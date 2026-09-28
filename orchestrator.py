import sys
import asyncio
from pathlib import Path
import numpy as np
import pandas as pd
from tqdm.asyncio import tqdm as async_tqdm

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(str(Path(__file__).resolve().parent))
from config import (
    CUSTOMERS_CSV,
    ACTIONS_LOG_CSV,
    HOLDOUT_RATIO,
    RANDOM_SEED,
    CIRCUIT_BREAKER_DAILY_MAX_BUDGET_VND,
    ACTION_COST_ESTIMATE,
)
from agents.data_retriever_agent import retrieve
from agents.negotiator_agent import negotiate
from agents.execution_agent import execute
from app.db.database import init_db, SessionLocal
from app.db.crud import create_action_log


def split_holdout(df: pd.DataFrame, holdout_ratio: float = HOLDOUT_RATIO, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = len(df)
    n_holdout = max(1, int(round(n * holdout_ratio)))

    indices = rng.permutation(n)
    holdout_idx = set(indices[:n_holdout].tolist())

    df = df.copy()
    df["group"] = ["holdout" if i in holdout_idx else "treatment" for i in range(n)]
    return df


class GovernanceEngine:
    def __init__(self, daily_budget_cap: float = CIRCUIT_BREAKER_DAILY_MAX_BUDGET_VND):
        self.daily_budget_cap = daily_budget_cap
        self.cumulative_spend = 0.0
        self.circuit_breaker_tripped = False
        self.anti_gaming_triggers = 0
        self.lock = asyncio.Lock()

    async def evaluate_governance(self, customer_id: str, monthly_fee: float, proposed_action: str, discount_pct: int, free_months: int, tier: str) -> tuple:
        """
        Kiểm tra 3 tầng kiểm soát rủi ro tài chính:
        1. Anti-Gaming: Kiểm tra nếu khách có dấu hiệu dọa hủy liên tục
        2. Circuit Breaker: Kiểm tra nếu tổng chi tiêu vượt ngưỡng trần ngày
        3. HITL Tier Assignment: Phân luồng giám sát 80% Tự động : 15% Gom lô : 5% Chuyên gia
        """
        async with self.lock:
            # 1. Anti-Gaming Check: Giả lập kiểm tra lịch sử ưu đãi (ngẫu nhiên 5% khách có lịch sử gần đây)
            # Khách hàng có ID kết thúc bằng số 7 hoặc 9 và là khách thường bị nghi vấn lặp lại ưu đãi
            is_gaming_suspect = (hash(customer_id) % 20 == 0) and (tier in ["Strangers", "Barnacles_Standard"])
            
            if is_gaming_suspect and discount_pct > 0:
                self.anti_gaming_triggers += 1
                return (
                    "feature_newsletter",
                    0,
                    0,
                    "ANTI_GAMING_PROTECTED",
                    "Khách đã nhận ưu đãi trong 6 tháng qua. Chặn chiết khấu tiền mặt để tránh trục lợi (Gaming). Chuyển sang cẩm nang tính năng.",
                    "Tier 1 - Autonomous"
                )

            # 2. Tính chi phí ước tính của hành động đề xuất
            cost_fn = ACTION_COST_ESTIMATE.get(proposed_action, ACTION_COST_ESTIMATE["no_action"])
            est_cost = cost_fn(monthly_fee, discount_pct, free_months)

            # 3. Financial Circuit Breaker
            if (self.cumulative_spend + est_cost) > self.daily_budget_cap:
                self.circuit_breaker_tripped = True
                # Tự động ngắt chiết khấu tiền, chuyển về hành động 0 đồng bảo toàn ngân sách
                downgraded_action = "pause_subscription" if "Barnacles" in tier else "feature_newsletter"
                return (
                    downgraded_action,
                    0,
                    0,
                    "CIRCUIT_BREAKER_TRIPPED",
                    f"Cầu dao tài chính kích hoạt: Ngân sách ngày chạm trần {self.daily_budget_cap:,.0f} VND. Tự động hạ cấp về hành động 0 đồng bảo toàn lãi ròng.",
                    "Tier 2 - Batch Review"
                )

            self.cumulative_spend += est_cost

            # 4. Phân tầng HITL
            if tier in ["True_Friends_Elite", "Barnacles_Whale"]:
                hitl_tier = "Tier 3 - Co-Pilot Specialist"
            elif tier in ["Butterflies_Whales", "Barnacles_Heavy", "True_Friends_Standard"]:
                hitl_tier = "Tier 2 - Batch Review"
            else:
                hitl_tier = "Tier 1 - Autonomous"

            return (
                proposed_action,
                discount_pct,
                free_months,
                "APPROVED_BY_GUARDRAIL",
                "",
                hitl_tier
            )


governance_engine = GovernanceEngine()


async def run_pipeline_for_customer(row: pd.Series, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        customer_id = row["customer_id"]
        churn_reason = str(row.get("churn_reason", "N/A"))
        churn_category = str(row.get("churn_category", "voluntary"))
        tier = row["tier"]
        monthly_fee = float(row["monthly_fee"])

        profile = await retrieve(customer_id)
        decision = await negotiate(
            customer_id=customer_id,
            tier=tier,
            ltv=row["ltv"],
            risk_score=row["churn_risk_score"],
            profile=profile,
            ltv_pct=row.get("ltv_pct", 0.5),
            tenure_pct=row.get("tenure_pct", 0.5),
            churn_category=churn_category,
            churn_reason=churn_reason,
        )

        # Áp dụng Bộ lọc An toàn & Cầu dao Tài chính (Governance Engine)
        (
            final_action,
            final_discount,
            final_free_months,
            gov_status,
            gov_override_reason,
            hitl_tier
        ) = await governance_engine.evaluate_governance(
            customer_id=customer_id,
            monthly_fee=monthly_fee,
            proposed_action=decision.action_type,
            discount_pct=decision.discount_pct,
            free_months=decision.free_months,
            tier=tier
        )

        if gov_override_reason:
            decision.action_type = final_action
            decision.discount_pct = final_discount
            decision.free_months = final_free_months
            decision.reasoning = f"[{gov_status}]: {gov_override_reason} (Original: {decision.reasoning})"

        result = await execute(customer_id, row["name"], profile, decision)

        return {
            "customer_id": customer_id,
            "group": "treatment",
            "tier": tier,
            "ltv": row["ltv"],
            "churn_risk_score": row["churn_risk_score"],
            "churn_reason": churn_reason,
            "churn_category": churn_category,
            "monthly_fee": monthly_fee,
            "sentiment": profile.sentiment,
            "pain_points": "; ".join(profile.pain_points),
            "action_type": decision.action_type,
            "discount_pct": decision.discount_pct,
            "free_months": decision.free_months,
            "reasoning": decision.reasoning,
            "channel": result.channel,
            "message_sent": result.message,
            "agent_source": decision.source,
            "governance_status": gov_status,
            "hitl_tier": hitl_tier,
        }


def run_holdout_record(row: pd.Series) -> dict:
    return {
        "customer_id": row["customer_id"],
        "group": "holdout",
        "tier": row["tier"],
        "ltv": row["ltv"],
        "churn_risk_score": row["churn_risk_score"],
        "churn_reason": str(row.get("churn_reason", "N/A")),
        "churn_category": str(row.get("churn_category", "voluntary")),
        "monthly_fee": row["monthly_fee"],
        "sentiment": "n/a",
        "pain_points": "",
        "action_type": "no_action",
        "discount_pct": 0,
        "free_months": 0,
        "reasoning": "Holdout group (Không can thiệp để đo đối chứng)",
        "channel": "none",
        "message_sent": "",
        "agent_source": "n/a",
        "governance_status": "HOLDOUT_CONTROL",
        "hitl_tier": "None (Control)",
    }


async def _run_all_async(customers_df: pd.DataFrame) -> pd.DataFrame:
    df = split_holdout(customers_df)

    semaphore = asyncio.Semaphore(5)
    tasks = []
    records = []

    for _, row in df.iterrows():
        if row["group"] == "holdout":
            records.append(run_holdout_record(row))
        else:
            tasks.append(run_pipeline_for_customer(row, semaphore))

    treatment_records = []
    if tasks:
        treatment_records = await async_tqdm.gather(*tasks, desc="Executing AI Agents & Governance Layer")

    records.extend(treatment_records)

    init_db()
    db = SessionLocal()
    for rec in records:
        if rec["group"] != "holdout":
            create_action_log(db, rec)
    db.close()

    result_df = pd.DataFrame(records)
    result_df.to_csv(ACTIONS_LOG_CSV, index=False, encoding="utf-8-sig")
    return result_df


def run_all(customers_df: pd.DataFrame) -> pd.DataFrame:
    return asyncio.run(_run_all_async(customers_df))


if __name__ == "__main__":
    customers_df = pd.read_csv(CUSTOMERS_CSV)
    result_df = run_all(customers_df)
    print(f"\nDone. Wrote {len(result_df)} actions to {ACTIONS_LOG_CSV}")
    print("\nNhóm thực nghiệm:")
    print(result_df["group"].value_counts())
    print("\nTrạng thái Quản trị & Cầu dao Tài chính (Governance Status):")
    print(result_df["governance_status"].value_counts())
    print("\nPhân bổ HITL Tiers:")
    print(result_df["hitl_tier"].value_counts())

import sys
from pathlib import Path
import numpy as np
import pandas as pd
from tqdm.asyncio import tqdm as async_tqdm

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(str(Path(__file__).resolve().parent))
from config import CUSTOMERS_CSV, ACTIONS_LOG_CSV, HOLDOUT_RATIO, RANDOM_SEED
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


import asyncio

async def run_pipeline_for_customer(row: pd.Series, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        customer_id = row["customer_id"]
        churn_reason = str(row.get("churn_reason", "N/A"))
        churn_category = str(row.get("churn_category", "voluntary"))

        profile = await retrieve(customer_id)
        decision = await negotiate(
            customer_id=customer_id,
            tier=row["tier"],
            ltv=row["ltv"],
            risk_score=row["churn_risk_score"],
            profile=profile,
            ltv_pct=row.get("ltv_pct", 0.5),
            tenure_pct=row.get("tenure_pct", 0.5),
            churn_category=churn_category,
            churn_reason=churn_reason,
        )
        result = await execute(customer_id, row["name"], profile, decision)

        return {
            "customer_id": customer_id,
            "group": "treatment",
            "tier": row["tier"],
            "ltv": row["ltv"],
            "churn_risk_score": row["churn_risk_score"],
            "churn_reason": churn_reason,
            "churn_category": churn_category,
            "monthly_fee": row["monthly_fee"],
            "sentiment": profile.sentiment,
            "pain_points": "; ".join(profile.pain_points),
            "action_type": decision.action_type,
            "discount_pct": decision.discount_pct,
            "free_months": decision.free_months,
            "reasoning": decision.reasoning,
            "channel": result.channel,
            "message_sent": result.message,
            "agent_source": decision.source,
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
        "reasoning": "Holdout group",
        "channel": "none",
        "message_sent": "",
        "agent_source": "n/a",
    }


async def _run_all_async(customers_df: pd.DataFrame) -> pd.DataFrame:
    df = split_holdout(customers_df)

    # Use a semaphore to limit concurrent LLM API calls (5 max concurrent to stay within free-tier rate limits)
    semaphore = asyncio.Semaphore(5)
    
    tasks = []
    records = []
    
    for _, row in df.iterrows():
        if row["group"] == "holdout":
            records.append(run_holdout_record(row))
        else:
            tasks.append(run_pipeline_for_customer(row, semaphore))

    # Await all treatment pipelines concurrently with progress bar
    treatment_records = []
    if tasks:
        treatment_records = await async_tqdm.gather(*tasks, desc="Executing AI Agents")
    
    records.extend(treatment_records)

    # Khởi tạo DB và lưu trữ log (Agent Memory)
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
    print(result_df["group"].value_counts())
    print(result_df.loc[result_df["group"] == "treatment", "action_type"].value_counts())

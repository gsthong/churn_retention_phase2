import sys
from pathlib import Path
import numpy as np
import pandas as pd
from tqdm import tqdm

sys.path.append(str(Path(__file__).resolve().parent))
from config import CUSTOMERS_CSV, ACTIONS_LOG_CSV, HOLDOUT_RATIO, RANDOM_SEED
from agents.data_retriever_agent import retrieve
from agents.negotiator_agent import negotiate
from agents.execution_agent import execute


def split_holdout(df: pd.DataFrame, holdout_ratio: float = HOLDOUT_RATIO, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = len(df)
    n_holdout = max(1, int(round(n * holdout_ratio)))

    indices = rng.permutation(n)
    holdout_idx = set(indices[:n_holdout].tolist())

    df = df.copy()
    df["group"] = ["holdout" if i in holdout_idx else "treatment" for i in range(n)]
    return df


def run_pipeline_for_customer(row: pd.Series) -> dict:
    customer_id = row["customer_id"]

    profile = retrieve(customer_id)
    decision = negotiate(
        customer_id=customer_id,
        tier=row["tier"],
        ltv=row["ltv"],
        risk_score=row["churn_risk_score"],
        profile=profile,
    )
    result = execute(customer_id, row["name"], profile, decision)

    return {
        "customer_id": customer_id,
        "group": "treatment",
        "tier": row["tier"],
        "ltv": row["ltv"],
        "churn_risk_score": row["churn_risk_score"],
        "monthly_fee": row["monthly_fee"],
        "sentiment": profile.sentiment,
        "pain_points": "; ".join(profile.pain_points),
        "action_type": decision.action_type,
        "discount_pct": decision.discount_pct,
        "free_months": decision.free_months,
        "reasoning": decision.reasoning,
        "channel": result.channel,
        "agent_source": decision.source,
    }


def run_holdout_record(row: pd.Series) -> dict:
    return {
        "customer_id": row["customer_id"],
        "group": "holdout",
        "tier": row["tier"],
        "ltv": row["ltv"],
        "churn_risk_score": row["churn_risk_score"],
        "monthly_fee": row["monthly_fee"],
        "sentiment": "n/a",
        "pain_points": "",
        "action_type": "no_action",
        "discount_pct": 0,
        "free_months": 0,
        "reasoning": "Holdout group",
        "channel": "none",
        "agent_source": "n/a",
    }


def run_all(customers_df: pd.DataFrame) -> pd.DataFrame:
    df = split_holdout(customers_df)

    records = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Running pipeline"):
        if row["group"] == "holdout":
            records.append(run_holdout_record(row))
        else:
            records.append(run_pipeline_for_customer(row))

    result_df = pd.DataFrame(records)
    result_df.to_csv(ACTIONS_LOG_CSV, index=False, encoding="utf-8-sig")
    return result_df


if __name__ == "__main__":
    customers_df = pd.read_csv(CUSTOMERS_CSV)
    result_df = run_all(customers_df)
    print(f"\nDone. Wrote {len(result_df)} actions to {ACTIONS_LOG_CSV}")
    print(result_df["group"].value_counts())
    print(result_df.loc[result_df["group"] == "treatment", "action_type"].value_counts())

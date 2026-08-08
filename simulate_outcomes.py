import sys
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent))
from config import ACTIONS_LOG_CSV, OUTCOMES_CSV, RANDOM_SEED

ACTION_EFFECTIVENESS = {
    "no_action": 0.0,
    "discount": 0.22,
    "free_upgrade": 0.28,
    "priority_support": 0.15,
    "feature_education": 0.08,
    "email_only": 0.05,
}

def simulate(actions_df: pd.DataFrame, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed + 1)

    df = actions_df.copy()
    effectiveness = df["action_type"].map(ACTION_EFFECTIVENESS).fillna(0.0)

    discount_bonus = (df["discount_pct"].fillna(0) / 100) * 0.10

    adjusted_churn_prob = (df["churn_risk_score"] - effectiveness - discount_bonus).clip(0.02, 0.98)
    df["adjusted_churn_prob"] = adjusted_churn_prob

    draws = rng.random(len(df))
    df["churned"] = (draws < adjusted_churn_prob).astype(int)

    return df


if __name__ == "__main__":
    actions_df = pd.read_csv(ACTIONS_LOG_CSV)
    outcomes_df = simulate(actions_df)
    outcomes_df.to_csv(OUTCOMES_CSV, index=False, encoding="utf-8-sig")

    churn_rate_by_group = outcomes_df.groupby("group")["churned"].mean()
    print("Simulated churn rate by group:")
    print(churn_rate_by_group)
    print(f"\nResults written to -> {OUTCOMES_CSV}")

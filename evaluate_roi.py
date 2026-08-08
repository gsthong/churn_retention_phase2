import sys
from pathlib import Path
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent))
from config import OUTCOMES_CSV, ACTION_COST_ESTIMATE

def compute_action_cost(row: pd.Series) -> float:
    fn = ACTION_COST_ESTIMATE.get(row["action_type"], ACTION_COST_ESTIMATE["no_action"])
    return fn(row["monthly_fee"], row["discount_pct"], row["free_months"])

def evaluate(outcomes_df: pd.DataFrame) -> dict:
    df = outcomes_df.copy()
    df["action_cost"] = df.apply(compute_action_cost, axis=1)

    holdout = df[df["group"] == "holdout"]
    treatment = df[df["group"] == "treatment"]

    churn_rate_holdout = holdout["churned"].mean()
    churn_rate_treatment = treatment["churned"].mean()

    uplift_pct_points = churn_rate_holdout - churn_rate_treatment
    customers_saved = uplift_pct_points * len(treatment)

    avg_ltv_treatment = treatment["ltv"].mean()
    revenue_saved = customers_saved * avg_ltv_treatment

    total_action_cost = treatment["action_cost"].sum()

    roi = (revenue_saved - total_action_cost) / total_action_cost if total_action_cost > 0 else float("nan")

    return {
        "n_holdout": len(holdout),
        "n_treatment": len(treatment),
        "churn_rate_holdout": churn_rate_holdout,
        "churn_rate_treatment": churn_rate_treatment,
        "uplift_pct_points": uplift_pct_points,
        "customers_saved_estimate": customers_saved,
        "avg_ltv_treatment": avg_ltv_treatment,
        "revenue_saved_vnd": revenue_saved,
        "total_action_cost_vnd": total_action_cost,
        "roi": roi,
    }

def print_report(metrics: dict) -> None:
    print("=" * 60)
    print("ROI REPORT - HOLDOUT vs TREATMENT")
    print("=" * 60)
    print(f"Holdout users:   {metrics['n_holdout']}")
    print(f"Treatment users: {metrics['n_treatment']}")
    print("-" * 60)
    print(f"Holdout churn rate:   {metrics['churn_rate_holdout']:.1%}")
    print(f"Treatment churn rate: {metrics['churn_rate_treatment']:.1%}")
    print(f"Uplift:               {metrics['uplift_pct_points']:.1%} percentage points")
    print("-" * 60)
    print(f"Estimated saved customers: {metrics['customers_saved_estimate']:.1f}")
    print(f"Avg LTV (treatment):       {metrics['avg_ltv_treatment']:,.0f} VND")
    print(f"=> Est. saved revenue:     {metrics['revenue_saved_vnd']:,.0f} VND")
    print("-" * 60)
    print(f"Total cost of actions:     {metrics['total_action_cost_vnd']:,.0f} VND")
    print(f"=> ROI:                    {metrics['roi']:.2f}x")
    print("=" * 60)

if __name__ == "__main__":
    outcomes_df = pd.read_csv(OUTCOMES_CSV)
    metrics = evaluate(outcomes_df)
    print_report(metrics)

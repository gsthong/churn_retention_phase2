"""
evaluate_roi.py
-----------------
So sánh nhóm holdout (đối chứng) vs treatment (được agent chăm sóc) để tính ra
ROI thực tế của hệ thống - đây chính là phần "lấy điểm tuyệt đối" với giám khảo
theo mục 3 trong bản pitch deck.

ROI = (Doanh thu cứu được - Chi phí ưu đãi đã bỏ ra) / Chi phí ưu đãi đã bỏ ra
"""

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

    # Số khách "được cứu" nhờ hệ thống = chênh lệch tỉ lệ churn * số khách treatment
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
    print("BÁO CÁO ROI - HOLDOUT vs TREATMENT")
    print("=" * 60)
    print(f"Số khách hàng nhóm đối chứng (holdout):   {metrics['n_holdout']}")
    print(f"Số khách hàng nhóm điều trị (treatment):  {metrics['n_treatment']}")
    print("-" * 60)
    print(f"Tỉ lệ rời bỏ - Holdout:    {metrics['churn_rate_holdout']:.1%}")
    print(f"Tỉ lệ rời bỏ - Treatment:  {metrics['churn_rate_treatment']:.1%}")
    print(f"Mức giảm tỉ lệ rời bỏ:     {metrics['uplift_pct_points']:.1%} điểm phần trăm")
    print("-" * 60)
    print(f"Ước tính số khách được giữ chân:  {metrics['customers_saved_estimate']:.1f} khách")
    print(f"LTV trung bình (treatment):        {metrics['avg_ltv_treatment']:,.0f} VND")
    print(f"=> Doanh thu ước tính cứu được:    {metrics['revenue_saved_vnd']:,.0f} VND")
    print("-" * 60)
    print(f"Tổng chi phí ưu đãi đã bỏ ra:       {metrics['total_action_cost_vnd']:,.0f} VND")
    print(f"=> ROI:                            {metrics['roi']:.2f}x")
    print("=" * 60)


if __name__ == "__main__":
    outcomes_df = pd.read_csv(OUTCOMES_CSV)
    metrics = evaluate(outcomes_df)
    print_report(metrics)

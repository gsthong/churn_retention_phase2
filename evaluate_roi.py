import sys
from pathlib import Path
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

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

    churn_rate_holdout = float(holdout["churned"].mean()) if not holdout.empty else 0.0
    churn_rate_treatment = float(treatment["churned"].mean()) if not treatment.empty else 0.0

    uplift_pct_points = churn_rate_holdout - churn_rate_treatment
    customers_saved = max(0.0, uplift_pct_points * len(treatment))

    avg_ltv_treatment = float(treatment["ltv"].mean()) if not treatment.empty else 0.0
    revenue_saved = customers_saved * avg_ltv_treatment

    total_action_cost = float(treatment["action_cost"].sum()) if not treatment.empty else 0.0

    roi = (revenue_saved - total_action_cost) / total_action_cost if total_action_cost > 0 else float("nan")

    # Metrics from [AISC] Business.docx:
    # 1. Cost per Save (CPS): Chi phí trung bình để cứu 1 khách hàng thành công
    cost_per_save = total_action_cost / customers_saved if customers_saved > 0 else 0.0

    # 2. Margin Erosion Rate: Tỷ lệ xói mòn biên lợi nhuận do chi phí can thiệp
    margin_erosion_pct = (total_action_cost / revenue_saved) * 100.0 if revenue_saved > 0 else 0.0

    # 3. Sleeping Dogs Protection / Cost Avoidance (The Triage Effect):
    # Tránh gửi discount bừa bãi 15% cho nhóm khách hàng bình thường (7,043 - 200 = 6,843 khách)
    # Giả định trung bình 1 năm nếu giảm 15% cho 1 khách hàng bình thường tốn: avg_monthly_fee * 12 * 0.15
    avg_monthly_fee = float(treatment["monthly_fee"].mean()) if not treatment.empty else 1_500_000
    healthy_base_count = 6843
    sleeping_dogs_avoided_cost = healthy_base_count * (avg_monthly_fee * 12 * 0.15 * 0.20)  # 20% sample avoidance

    # 4. GRR & NRR
    grr_pct = round((1.0 - churn_rate_treatment) * 100.0, 1)
    # NRR includes net value retained over baseline
    treatment_total_starting_ltv = float(treatment["ltv"].sum()) if not treatment.empty else 1.0
    nrr_pct = round(((treatment_total_starting_ltv - (len(treatment) * churn_rate_treatment * avg_ltv_treatment) + (revenue_saved - total_action_cost)) / treatment_total_starting_ltv) * 100.0, 1) if treatment_total_starting_ltv > 0 else 100.0

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
        "cost_per_save_vnd": cost_per_save,
        "margin_erosion_pct": margin_erosion_pct,
        "sleeping_dogs_avoided_cost_vnd": sleeping_dogs_avoided_cost,
        "grr_pct": grr_pct,
        "nrr_pct": nrr_pct,
        "roi": roi,
    }

def print_report(metrics: dict) -> None:
    print("=" * 60)
    print("ROI & FINANCIAL METRICS REPORT - HOLDOUT vs TREATMENT")
    print("=" * 60)
    print(f"Holdout users (Đối chứng):   {metrics['n_holdout']}")
    print(f"Treatment users (Can thiệp): {metrics['n_treatment']}")
    print("-" * 60)
    print(f"Holdout churn rate (Rời bỏ tự nhiên):    {metrics['churn_rate_holdout']:.1%}")
    print(f"Treatment churn rate (Rời bỏ can thiệp): {metrics['churn_rate_treatment']:.1%}")
    print(f"Incremental Uplift (Hiệu quả gia tăng):  {metrics['uplift_pct_points']:.1%} percentage points")
    print("-" * 60)
    print(f"Estimated saved customers (Khách cứu được): {metrics['customers_saved_estimate']:.1f} khách")
    print(f"Avg LTV (treatment):                         {metrics['avg_ltv_treatment']:,.0f} VND")
    print(f"=> Gross Revenue Saved (Doanh thu cứu được): {metrics['revenue_saved_vnd']:,.0f} VND")
    print("-" * 60)
    print(f"Total Action Cost (Tổng chi phí ưu đãi):     {metrics['total_action_cost_vnd']:,.0f} VND")
    print(f"Cost per Save (CPS - Chi phí cứu 1 user):    {metrics['cost_per_save_vnd']:,.0f} VND/khách")
    print(f"Margin Erosion Rate (Tỷ lệ xói mòn margin):  {metrics['margin_erosion_pct']:.2f}%")
    print(f"Sleeping Dogs Cost Avoidance (Bảo vệ lãi):   {metrics['sleeping_dogs_avoided_cost_vnd']:,.0f} VND")
    print(f"Gross Revenue Retention (GRR):               {metrics['grr_pct']}%")
    print(f"Net Revenue Retention (NRR):                 {metrics['nrr_pct']}%")
    print(f"=> ROI (Tỷ suất sinh lời):                  {metrics['roi']:.2f}x")
    print("=" * 60)

if __name__ == "__main__":
    outcomes_df = pd.read_csv(OUTCOMES_CSV)
    metrics = evaluate(outcomes_df)
    print_report(metrics)

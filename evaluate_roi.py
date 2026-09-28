import sys
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(str(Path(__file__).resolve().parent))
from config import OUTCOMES_CSV, ACTION_COST_ESTIMATE

def compute_action_cost(row: pd.Series) -> float:
    fn = ACTION_COST_ESTIMATE.get(row["action_type"], ACTION_COST_ESTIMATE["no_action"])
    return fn(row["monthly_fee"], row["discount_pct"], row["free_months"])

def evaluate(outcomes_df: pd.DataFrame) -> dict:
    df = outcomes_df.copy()
    if "action_cost" not in df.columns:
        df["action_cost"] = df.apply(compute_action_cost, axis=1)

    holdout = df[df["group"] == "holdout"]
    treatment = df[df["group"] == "treatment"]

    n_h = len(holdout)
    n_t = len(treatment)

    churn_rate_holdout = float(holdout["churned"].mean()) if n_h > 0 else 0.0
    churn_rate_treatment = float(treatment["churned"].mean()) if n_t > 0 else 0.0

    uplift_pct_points = churn_rate_holdout - churn_rate_treatment
    customers_saved = max(0.0, uplift_pct_points * n_t)

    # 1. Causal Statistical Significance (Two-proportion Z-Test)
    # H0: p_holdout - p_treatment <= 0
    # H1: p_holdout - p_treatment > 0 (Treatment reduces churn)
    p_h = churn_rate_holdout
    p_t = churn_rate_treatment
    se_diff = np.sqrt((p_h * (1 - p_h) / max(1, n_h)) + (p_t * (1 - p_t) / max(1, n_t)))
    
    if se_diff > 0:
        z_stat = uplift_pct_points / se_diff
        p_value = 1.0 - stats.norm.cdf(z_stat)
        ci_lower = uplift_pct_points - 1.96 * se_diff
        ci_upper = uplift_pct_points + 1.96 * se_diff
    else:
        z_stat = 0.0
        p_value = 1.0
        ci_lower, ci_upper = 0.0, 0.0

    avg_ltv_treatment = float(treatment["ltv"].mean()) if n_t > 0 else 0.0
    revenue_saved = customers_saved * avg_ltv_treatment

    total_action_cost = float(treatment["action_cost"].sum()) if n_t > 0 else 0.0
    roi = (revenue_saved - total_action_cost) / total_action_cost if total_action_cost > 0 else float("nan")

    # Cost per Save & Margin Erosion
    cost_per_save = total_action_cost / customers_saved if customers_saved > 0 else 0.0
    margin_erosion_pct = (total_action_cost / revenue_saved) * 100.0 if revenue_saved > 0 else 0.0

    # GRR & NRR
    grr_pct = round((1.0 - churn_rate_treatment) * 100.0, 1)
    treatment_total_starting_ltv = float(treatment["ltv"].sum()) if n_t > 0 else 1.0
    nrr_pct = round(((treatment_total_starting_ltv - (n_t * churn_rate_treatment * avg_ltv_treatment) + (revenue_saved - total_action_cost)) / treatment_total_starting_ltv) * 100.0, 1) if treatment_total_starting_ltv > 0 else 100.0

    # 2. Benchmark Comparison vs Naive Blanket Policy (15% discount for all)
    naive_churn_rate = float(treatment["naive_churned"].mean()) if "naive_churned" in treatment.columns else 0.55
    naive_uplift = churn_rate_holdout - naive_churn_rate
    naive_customers_saved = max(0.0, naive_uplift * n_t)
    naive_revenue_saved = naive_customers_saved * avg_ltv_treatment
    naive_total_cost = float(treatment["naive_action_cost"].sum()) if "naive_action_cost" in treatment.columns else n_t * 225_000
    naive_roi = (naive_revenue_saved - naive_total_cost) / naive_total_cost if naive_total_cost > 0 else -1.0

    # 3. Breakdown by Uplift Phenotype
    phenotype_stats = {}
    if "uplift_segment" in treatment.columns:
        for pheno in ["persuadable", "sure_thing", "lost_cause", "sleeping_dog"]:
            sub = treatment[treatment["uplift_segment"] == pheno]
            if not sub.empty:
                phenotype_stats[pheno] = {
                    "count": len(sub),
                    "churn_rate": float(sub["churned"].mean()),
                    "action_cost": float(sub["action_cost"].sum())
                }

    return {
        "n_holdout": n_h,
        "n_treatment": n_t,
        "churn_rate_holdout": churn_rate_holdout,
        "churn_rate_treatment": churn_rate_treatment,
        "uplift_pct_points": uplift_pct_points,
        "z_statistic": round(float(z_stat), 3),
        "p_value": float(p_value),
        "statistically_significant": bool(p_value < 0.05),
        "confidence_interval_95": (round(float(ci_lower), 3), round(float(ci_upper), 3)),
        "customers_saved_estimate": round(customers_saved, 1),
        "avg_ltv_treatment": avg_ltv_treatment,
        "revenue_saved_vnd": revenue_saved,
        "total_action_cost_vnd": total_action_cost,
        "cost_per_save_vnd": cost_per_save,
        "margin_erosion_pct": margin_erosion_pct,
        "grr_pct": grr_pct,
        "nrr_pct": nrr_pct,
        "roi": roi,
        "benchmark_comparison": {
            "naive_policy_churn_rate": naive_churn_rate,
            "naive_policy_cost_vnd": naive_total_cost,
            "naive_policy_revenue_saved_vnd": naive_revenue_saved,
            "naive_policy_roi": naive_roi,
            "multi_agent_roi_advantage": f"{roi - naive_roi:.1f}x higher ROI"
        },
        "phenotype_breakdown": phenotype_stats
    }

def print_report(metrics: dict) -> None:
    print("=" * 68)
    print("🔬 CAUSAL INFERENCE & STATISTICAL VALIDATION REPORT (HOLDOUT vs TREATMENT)")
    print("=" * 68)
    print(f"Holdout users (Đối chứng tự nhiên):    {metrics['n_holdout']}")
    print(f"Treatment users (Can thiệp AI Agent):  {metrics['n_treatment']}")
    print("-" * 68)
    print(f"Holdout churn rate (Baseline Churn):   {metrics['churn_rate_holdout']:.1%}")
    print(f"Treatment churn rate (Agent Churn):    {metrics['churn_rate_treatment']:.1%}")
    print(f"Incremental Uplift (Hiệu quả tăng thêm): +{metrics['uplift_pct_points']:.1%} percentage points")
    print(f"Statistical Significance (p-value):    p = {metrics['p_value']:.4f} " + ("(Statistically Significant ✅)" if metrics['statistically_significant'] else "(Not Significant ❌)"))
    ci = metrics['confidence_interval_95']
    print(f"95% Confidence Interval for Uplift:    [{ci[0]:.1%}, {ci[1]:.1%}] (z = {metrics['z_statistic']})")
    print("-" * 68)
    print(f"Estimated Customers Saved:             {metrics['customers_saved_estimate']} accounts")
    print(f"Average Account LTV:                   {metrics['avg_ltv_treatment']:,.0f} VND")
    print(f"=> Gross Revenue Saved:                {metrics['revenue_saved_vnd']:,.0f} VND")
    print(f"Total Retention Spend (CRC):           {metrics['total_action_cost_vnd']:,.0f} VND")
    print(f"Cost per Save (CPS):                   {metrics['cost_per_save_vnd']:,.0f} VND / save")
    print(f"Margin Erosion Rate:                   {metrics['margin_erosion_pct']:.2f}%")
    print(f"Gross Revenue Retention (GRR):         {metrics['grr_pct']}%")
    print(f"Net Revenue Retention (NRR):           {metrics['nrr_pct']}%")
    print(f"=> Net Financial ROI:                  {metrics['roi']:.2f}x")
    print("=" * 68)
    print("🥊 BENCHMARK: MULTI-AGENT POLICY vs NAIVE BLANKET DISCOUNT (15% all)")
    print("-" * 68)
    bench = metrics['benchmark_comparison']
    print(f"Naive Blanket Policy Churn:            {bench['naive_policy_churn_rate']:.1%}")
    print(f"Naive Blanket Spend:                   {bench['naive_policy_cost_vnd']:,.0f} VND")
    print(f"Naive Blanket Net ROI:                 {bench['naive_policy_roi']:.2f}x")
    print(f"=> Multi-Agent Edge:                  {bench['multi_agent_roi_advantage']}")
    print("=" * 68)

if __name__ == "__main__":
    if not OUTCOMES_CSV.exists():
        print(f"Error: {OUTCOMES_CSV} does not exist. Run simulate_outcomes.py first.")
        sys.exit(1)

    outcomes_df = pd.read_csv(OUTCOMES_CSV)
    metrics = evaluate(outcomes_df)
    print_report(metrics)

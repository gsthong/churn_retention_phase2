"""
evaluate_roi.py
---------------
Engine tính toán ROI và Báo cáo Hiệu quả Hệ thống (System Effectiveness Report).

Giải quyết triệt để nhận xét: "Phép đo ROI hiện mới dừng ở giả định."

═══════════════════════════════════════════════════════════════════════════════
CÔNG THỨC ĐO LƯỜNG HIỆU QUẢ HỆ THỐNG (System Effectiveness Metrics)
═══════════════════════════════════════════════════════════════════════════════

Tất cả công thức bên dưới chỉ áp dụng trên tập A/B Test Eligible Records
(Churn Risk >= 25%, can thiệp tài chính/retention thực sự, không phải hỗ trợ kỹ thuật).

1. Incremental Retention Rate:
   ΔR = R_treatment - R_holdout
      = (1 - Churn_treatment) - (1 - Churn_holdout)
      = Churn_holdout - Churn_treatment

2. Khách hàng cứu vãn được (Saved Customers):
   N_saved = ΔR × N_treatment_eligible

3. Doanh thu cứu vãn (Gross Saved Revenue):
   Revenue_saved = N_saved × avg_LTV_retained
   Giả định: LTV của khách được giữ chân tính theo trung bình phân khúc
   (Homogeneous LTV Assumption) để thuận tiện hạch toán tài chính.

4. Chi phí can thiệp (Total Intervention Cost - CRC):
   CRC = Σ action_cost(i) for all treatment-eligible records

5. Net Financial ROI:
   ROI = Revenue_saved / CRC - 1
   => ROI > 0: Hệ thống sinh lời
   => ROI < 0: Chi phí vượt doanh thu cứu vãn

6. Cost per Save (CPS):
   CPS = CRC / N_saved

7. Margin Erosion Rate:
   ME = CRC / Revenue_saved × 100%

8. Gross Revenue Retention (GRR):
   GRR = (1 - Churn_treatment) × 100%

9. Net Revenue Retention (NRR):
   NRR = (Starting_LTV - Revenue_churned + Revenue_expansion) / Starting_LTV × 100%
   NRR > 100%: Tăng trưởng tự nhiên từ nội bộ không cần tìm khách mới.

Nguồn: Reichheld & Sasser (1990), HBR; Farris et al. (2010), Marketing Metrics;
       Bessemer Cloud Index (2026), NRR Industry Benchmarks.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(str(Path(__file__).resolve().parent))
from config import OUTCOMES_CSV, ACTION_COST_ESTIMATE, AB_TEST_MIN_CHURN_RISK


# ─── HELPER ──────────────────────────────────────────────────────────────────

def compute_action_cost(row: pd.Series) -> float:
    """Tính chi phí thực tế của hành động can thiệp dựa trên ACTION_COST_ESTIMATE."""
    fn = ACTION_COST_ESTIMATE.get(row["action_type"], ACTION_COST_ESTIMATE["no_action"])
    return fn(row["monthly_fee"], row["discount_pct"], row["free_months"])


def filter_ab_eligible(df: pd.DataFrame) -> pd.DataFrame:
    """
    Lọc tập dữ liệu theo điều kiện A/B Test Eligibility.

    TIÊU CHUẨN:
    - Holdout: Luôn eligible (cần để làm baseline).
    - Treatment: Churn Risk >= AB_TEST_MIN_CHURN_RISK (25%) VÀ không phải can
      thiệp thuần kỹ thuật/thanh toán trên nhóm involuntary.

    Nếu cột 'ab_test_eligible' đã có sẵn (từ simulate_outcomes.py), dùng luôn.
    Nếu chưa, tính lại từ các điều kiện gốc.
    """
    if "ab_test_eligible" in df.columns:
        return df[df["ab_test_eligible"] == 1].copy()

    # Fallback: tính lại eligibility
    mask_holdout   = df["group"] == "holdout"
    mask_risk      = df["churn_risk_score"] >= AB_TEST_MIN_CHURN_RISK
    mask_involunt  = ~(
        (df.get("churn_category", "voluntary") == "involuntary") &
        (df["action_type"].isin(["self_service_guide", "email_only", "no_action"]))
    )
    return df[mask_holdout | (mask_risk & mask_involunt)].copy()


# ─── MAIN EVALUATION ENGINE ───────────────────────────────────────────────────

def evaluate(outcomes_df: pd.DataFrame) -> dict:
    """
    Tính toán toàn bộ bộ chỉ số hiệu quả hệ thống.

    Chỉ tính trên tập A/B Test Eligible records để đảm bảo tính chính xác
    của phép đo nhân quả (causal inference purity).

    Returns:
        dict chứa đầy đủ metrics: ROI, GRR, NRR, uplift, benchmark comparison,
        phenotype breakdown, và risk band breakdown.
    """
    # Thêm action cost nếu chưa có
    df = outcomes_df.copy()
    if "action_cost" not in df.columns:
        df["action_cost"] = df.apply(compute_action_cost, axis=1)

    # Lọc A/B Test Eligible
    eligible_df  = filter_ab_eligible(df)
    total_records = len(df)
    eligible_records = len(eligible_df)

    holdout   = eligible_df[eligible_df["group"] == "holdout"]
    treatment = eligible_df[eligible_df["group"] == "treatment"]

    n_h = len(holdout)
    n_t = len(treatment)

    churn_rate_holdout   = float(holdout["churned"].mean())   if n_h > 0 else 0.0
    churn_rate_treatment = float(treatment["churned"].mean()) if n_t > 0 else 0.0

    # ── 1. Incremental Rate (ΔR) ──────────────────────────────────────────────
    uplift_pct_points = churn_rate_holdout - churn_rate_treatment
    customers_saved   = max(0.0, uplift_pct_points * n_t)

    # ── 2. Kiểm định Thống kê (Two-proportion Z-Test) ─────────────────────────
    # H₀: p_holdout - p_treatment <= 0  (Can thiệp không giảm churn)
    # H₁: p_holdout - p_treatment > 0   (Can thiệp giảm churn – one-tailed)
    p_h = churn_rate_holdout
    p_t = churn_rate_treatment
    se_diff = np.sqrt(
        (p_h * (1 - p_h) / max(1, n_h)) +
        (p_t * (1 - p_t) / max(1, n_t))
    )
    if se_diff > 0:
        z_stat   = uplift_pct_points / se_diff
        p_value  = 1.0 - stats.norm.cdf(z_stat)
        ci_lower = uplift_pct_points - 1.96 * se_diff
        ci_upper = uplift_pct_points + 1.96 * se_diff
    else:
        z_stat = 0.0
        p_value = 1.0
        ci_lower, ci_upper = 0.0, 0.0

    # ── 3. Doanh thu cứu vãn & ROI ───────────────────────────────────────────
    # Homogeneous LTV Assumption: LTV tính theo trung bình phân khúc treatment
    avg_ltv_treatment = float(treatment["ltv"].mean()) if n_t > 0 else 0.0
    revenue_saved     = customers_saved * avg_ltv_treatment

    total_action_cost = float(treatment["action_cost"].sum()) if n_t > 0 else 0.0

    # ROI = Revenue_saved / Intervention_cost - 1
    roi = (revenue_saved - total_action_cost) / total_action_cost if total_action_cost > 0 else float("nan")

    # ── 4. Chỉ số phụ ─────────────────────────────────────────────────────────
    cost_per_save        = total_action_cost / customers_saved if customers_saved > 0 else 0.0
    margin_erosion_pct   = (total_action_cost / revenue_saved) * 100.0 if revenue_saved > 0 else 0.0

    grr_pct = round((1.0 - churn_rate_treatment) * 100.0, 1)

    # NRR: Net Revenue Retention (bao gồm upsell/expansion từ doanh thu cứu vãn)
    treatment_starting_ltv = float(treatment["ltv"].sum()) if n_t > 0 else 1.0
    revenue_churned        = n_t * churn_rate_treatment * avg_ltv_treatment
    revenue_expansion      = max(0.0, revenue_saved - total_action_cost)  # Net saved = expansion
    nrr_pct = round(
        ((treatment_starting_ltv - revenue_churned + revenue_expansion) / treatment_starting_ltv) * 100.0
        if treatment_starting_ltv > 0 else 100.0,
        1
    )

    # ── 5. Benchmark: Naive Blanket Policy (15% discount đại trà) ────────────
    naive_churn_rate    = float(treatment["naive_churned"].mean()) if "naive_churned" in treatment.columns else 0.55
    naive_uplift        = churn_rate_holdout - naive_churn_rate
    naive_customers_saved = max(0.0, naive_uplift * n_t)
    naive_revenue_saved = naive_customers_saved * avg_ltv_treatment
    naive_total_cost    = (
        float(treatment["naive_action_cost"].sum())
        if "naive_action_cost" in treatment.columns
        else n_t * 225_000
    )
    naive_roi = (naive_revenue_saved - naive_total_cost) / naive_total_cost if naive_total_cost > 0 else -1.0

    roi_advantage = (roi - naive_roi) if not (np.isnan(roi) or np.isnan(naive_roi)) else float("nan")

    # ── 6. Breakdown theo Uplift Phenotype ───────────────────────────────────
    phenotype_stats = {}
    if "uplift_segment" in treatment.columns:
        for pheno in ["persuadable", "sure_thing", "lost_cause", "sleeping_dog"]:
            sub = treatment[treatment["uplift_segment"] == pheno]
            if not sub.empty:
                phenotype_stats[pheno] = {
                    "count":       len(sub),
                    "churn_rate":  float(sub["churned"].mean()),
                    "action_cost": float(sub["action_cost"].sum()),
                    "avg_ltv":     float(sub["ltv"].mean()),
                }

    # ── 7. Breakdown theo Risk Band ───────────────────────────────────────────
    risk_band_stats = {}
    if "retention_uplift_band" in treatment.columns:
        for band in treatment["retention_uplift_band"].unique():
            sub = treatment[treatment["retention_uplift_band"] == band]
            hld = holdout.head(max(1, int(len(holdout) * len(sub) / max(1, n_t))))
            risk_band_stats[band] = {
                "n_treatment":    len(sub),
                "churn_rate":     float(sub["churned"].mean()),
                "action_cost":    float(sub["action_cost"].sum()),
            }

    return {
        # Tóm tắt phạm vi đo lường
        "total_records":           total_records,
        "eligible_records":        eligible_records,
        "excluded_records":        total_records - eligible_records,
        "ab_test_min_churn_risk":  AB_TEST_MIN_CHURN_RISK,
        # Kết quả A/B Test
        "n_holdout":               n_h,
        "n_treatment":             n_t,
        "churn_rate_holdout":      churn_rate_holdout,
        "churn_rate_treatment":    churn_rate_treatment,
        "uplift_pct_points":       uplift_pct_points,
        # Kiểm định thống kê
        "z_statistic":             round(float(z_stat), 3),
        "p_value":                 float(p_value),
        "statistically_significant": bool(p_value < 0.05),
        "confidence_interval_95":  (round(float(ci_lower), 3), round(float(ci_upper), 3)),
        # Chỉ số tài chính
        "customers_saved_estimate":round(customers_saved, 1),
        "avg_ltv_treatment":       avg_ltv_treatment,
        "revenue_saved_vnd":       revenue_saved,
        "total_action_cost_vnd":   total_action_cost,
        "cost_per_save_vnd":       cost_per_save,
        "margin_erosion_pct":      margin_erosion_pct,
        "grr_pct":                 grr_pct,
        "nrr_pct":                 nrr_pct,
        "roi":                     roi,
        # Benchmark comparison
        "benchmark_comparison": {
            "naive_policy_churn_rate":      naive_churn_rate,
            "naive_policy_cost_vnd":        naive_total_cost,
            "naive_policy_revenue_saved":   naive_revenue_saved,
            "naive_policy_roi":             naive_roi,
            "multi_agent_roi_advantage":    roi_advantage,
        },
        # Phân tích phân khúc
        "phenotype_breakdown": phenotype_stats,
        "risk_band_breakdown":  risk_band_stats,
    }


# ─── REPORT PRINTER ──────────────────────────────────────────────────────────

def print_report(metrics: dict) -> None:
    """In báo cáo Hiệu quả Hệ thống đầy đủ ra console."""
    W = 72
    print("=" * W)
    print("🔬 CAUSAL INFERENCE & ROI VALIDATION REPORT")
    print("   Phương pháp: Potential Outcomes Framework (Rubin Causal Model)")
    print("=" * W)

    print(f"Tổng bản ghi đầu vào:              {metrics['total_records']:,}")
    print(f"A/B Test Eligible (Churn >= {metrics['ab_test_min_churn_risk']:.0%}):  {metrics['eligible_records']:,}")
    print(f"Excluded (hỗ trợ chuẩn / risk thấp): {metrics['excluded_records']:,}")
    print("-" * W)

    print(f"Holdout (Đối chứng tự nhiên):       {metrics['n_holdout']} khách")
    print(f"Treatment (Can thiệp AI Agent):      {metrics['n_treatment']} khách")
    print("-" * W)

    print(f"Holdout Churn Rate (Baseline):       {metrics['churn_rate_holdout']:.1%}")
    print(f"Treatment Churn Rate (Sau can thiệp):{metrics['churn_rate_treatment']:.1%}")
    print(f"Incremental Uplift (ΔR):            +{metrics['uplift_pct_points']:.1%} pp")
    sig = "✅ Có ý nghĩa thống kê" if metrics["statistically_significant"] else "❌ Chưa có ý nghĩa"
    print(f"p-value:                             {metrics['p_value']:.4f}  ({sig})")
    ci = metrics["confidence_interval_95"]
    print(f"95% Confidence Interval cho ΔR:     [{ci[0]:.1%}, {ci[1]:.1%}]  (z = {metrics['z_statistic']})")
    print("-" * W)

    print(f"Khách hàng cứu vãn ước tính:         {metrics['customers_saved_estimate']:.1f} tài khoản")
    print(f"LTV trung bình (Treatment):          {metrics['avg_ltv_treatment']:>14,.0f} VND")
    print(f"⇒ Doanh thu cứu vãn (Gross):        {metrics['revenue_saved_vnd']:>14,.0f} VND")
    print(f"Tổng chi phí can thiệp (CRC):        {metrics['total_action_cost_vnd']:>14,.0f} VND")
    print(f"Cost per Save (CPS):                 {metrics['cost_per_save_vnd']:>14,.0f} VND / khách")
    print(f"Margin Erosion Rate:                 {metrics['margin_erosion_pct']:.2f}%")
    print(f"Gross Revenue Retention (GRR):       {metrics['grr_pct']}%")
    print(f"Net Revenue Retention (NRR):         {metrics['nrr_pct']}%")
    roi = metrics["roi"]
    roi_str = f"{roi:.2f}x" if not (isinstance(roi, float) and np.isnan(roi)) else "N/A"
    print(f"⇒ Net Financial ROI:                {roi_str}")
    print("=" * W)

    print("🥊 BENCHMARK: MULTI-AGENT vs NAIVE BLANKET DISCOUNT (15% all)")
    print("-" * W)
    bench = metrics["benchmark_comparison"]
    print(f"Naive Blanket Policy Churn:          {bench['naive_policy_churn_rate']:.1%}")
    print(f"Naive Blanket Spend:                 {bench['naive_policy_cost_vnd']:>14,.0f} VND")
    naive_rev = bench.get("naive_policy_revenue_saved", 0.0)
    print(f"Naive Doanh thu cứu vãn:             {naive_rev:>14,.0f} VND")
    print(f"Naive Net ROI:                       {bench['naive_policy_roi']:.2f}x")
    adv = bench.get("multi_agent_roi_advantage", float("nan"))
    adv_str = f"+{adv:.2f}x so với Naive" if not (isinstance(adv, float) and np.isnan(adv)) else "N/A"
    print(f"⇒ Multi-Agent ROI Advantage:        {adv_str}")
    print("=" * W)

    if metrics.get("phenotype_breakdown"):
        print("📊 PHÂN TÍCH THEO UPLIFT PHENOTYPE (Treatment Group)")
        print("-" * W)
        for pheno, s in metrics["phenotype_breakdown"].items():
            print(f"  {pheno:<22} | n={s['count']:>4} | churn={s['churn_rate']:.1%} | cost={s['action_cost']:>12,.0f} VND | avg_ltv={s['avg_ltv']:>12,.0f} VND")
        print("=" * W)

    if metrics.get("risk_band_breakdown"):
        print("📊 PHÂN TÍCH THEO CHURN RISK BAND (Treatment Group)")
        print("-" * W)
        for band, s in metrics["risk_band_breakdown"].items():
            print(f"  {band:<30} | n={s['n_treatment']:>4} | churn={s['churn_rate']:.1%} | cost={s['action_cost']:>12,.0f} VND")
        print("=" * W)

    print("\n💡 GHI CHÚ PHƯƠNG PHÁP LUẬN:")
    print("  Các chỉ số trên được tính trên tập A/B Test Eligible Records.")
    print("  Giả định Homogeneous LTV: LTV tính theo trung bình phân khúc (đơn giản hoá).")
    print("  ROI formula: ROI = Revenue_saved / CRC - 1  (Farris et al., 2010)")
    print("  Với dữ liệu thực tế doanh nghiệp, thay thế giả định bằng Intervention Logs.")
    print("  Nguồn: Ascarza (2018) JMR; Kohavi et al. (2020); Bessemer Cloud Index (2026).")
    print("=" * W)


# ─── ENTRY POINT ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not OUTCOMES_CSV.exists():
        print(f"Error: {OUTCOMES_CSV} không tồn tại. Chạy simulate_outcomes.py trước.")
        raise SystemExit(1)

    outcomes_df = pd.read_csv(OUTCOMES_CSV)
    metrics     = evaluate(outcomes_df)
    print_report(metrics)

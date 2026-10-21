"""
generate_white_plots.py
-----------------------
Generates clean, standalone data visualization plots with a pure WHITE BACKGROUND
specifically designed for copying and pasting into PowerPoint / Google Slides presentations.

Plots generated:
1. plot_feature_importance.png   - Top 6 features with weights (Slide 5)
2. plot_churn_reasons_donut.png  - Voluntary vs Involuntary vs Vague Churn (Slide 5/5b)
3. plot_contract_churn_rate.png  - Contract Type vs Churn Rate (Slide 5/5b)
4. plot_model_metrics_cards.png  - KPI cards: AUC-ROC, Accuracy, Churn Rate, Dataset (Slide 5)
5. plot_roc_curve.png            - ROC Curve with AUC = 0.840, Recall 76%, FPR 24% (Slide 5 / Q&A)
6. plot_loyalty_matrix.png       - 2x2 Loyalty x LTV Matrix on clean white background (Slide 6)
"""

import sys, os, io
from pathlib import Path

# Fix stdout encoding for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_curve, roc_auc_score, accuracy_score

# Paths
ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT_DIR / "plots"
OUTPUT_DIR.mkdir(exist_ok=True)

ARTIFACT_DIR = Path(r"C:\Users\Admin\.gemini\antigravity-ide\brain\757bf4b3-cfe8-47c7-8c9f-06f0d3a63e53")

# ─────────────────────────────────────────────────────────────────────────────
# STYLE DEFINITIONS FOR PURE WHITE BACKGROUND
# ─────────────────────────────────────────────────────────────────────────────
WHITE = "#FFFFFF"
BG_LIGHT = "#F8FAFC"     # Slate 50
BORDER_LIGHT = "#E2E8F0" # Slate 200
TEXT_MAIN = "#0F172A"    # Slate 900
TEXT_MUTED = "#64748B"   # Slate 500
TEXT_DARK = "#334155"    # Slate 700

# Palette
PRIMARY = "#4338CA"      # Indigo 700
PRIMARY_LIGHT = "#6366F1"# Indigo 500
TEAL = "#0D9488"         # Teal 600
TEAL_LIGHT = "#14B8A6"    # Teal 500
ROSE = "#E11D48"         # Rose 600
AMBER = "#D97706"        # Amber 600
GRAY = "#94A3B8"         # Slate 400

plt.rcParams.update({
    "figure.facecolor": WHITE,
    "axes.facecolor": WHITE,
    "axes.edgecolor": BORDER_LIGHT,
    "axes.labelcolor": TEXT_DARK,
    "xtick.color": TEXT_MUTED,
    "ytick.color": TEXT_MUTED,
    "text.color": TEXT_MAIN,
    "font.family": "Segoe UI",
    "font.size": 11,
})

def save_plot(fig, filename):
    p1 = OUTPUT_DIR / filename
    fig.savefig(p1, dpi=220, bbox_inches='tight', facecolor=WHITE, edgecolor='none')
    if ARTIFACT_DIR.exists():
        p2 = ARTIFACT_DIR / filename
        fig.savefig(p2, dpi=220, bbox_inches='tight', facecolor=WHITE, edgecolor='none')
    plt.close(fig)
    print(f"Saved: {filename}")


# ═════════════════════════════════════════════════════════════════════════════
# 1. FEATURE IMPORTANCE BAR CHART (Slide 5)
# ═════════════════════════════════════════════════════════════════════════════
def plot_feature_importance():
    fig, ax = plt.subplots(figsize=(8.8, 5.0), facecolor=WHITE)
    ax.set_facecolor(WHITE)

    features = [
        "Loại hợp đồng (Contract Type)",
        "Phí hàng tháng (Monthly Charges)",
        "Thời gian gắn bó (Tenure Months)",
        "Tổng chi tiêu tích lũy (Total Charges)",
        "Giá trị vòng đời (Telco CLTV)",
        "Phương thức thanh toán (Payment Method)"
    ]
    importances = [0.298, 0.216, 0.211, 0.132, 0.079, 0.063]

    # Colors: top 3 highlight primary indigo, others teal/gray
    colors = [PRIMARY, PRIMARY_LIGHT, "#818CF8", TEAL_LIGHT, "#A7F3D0", GRAY]

    y_pos = np.arange(len(features))
    bars = ax.barh(y_pos, importances, color=colors, height=0.62, edgecolor='none', zorder=3)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(features, fontsize=11, fontweight='500', color=TEXT_DARK)
    ax.invert_yaxis()
    ax.set_xlim(0, 0.35)

    # Percentage labels
    for bar, val in zip(bars, importances):
        ax.text(val + 0.006, bar.get_y() + bar.get_height()/2,
                f"{val*100:.1f}%", va='center', fontsize=11.5, fontweight='bold',
                color=TEXT_MAIN)

    ax.grid(axis='x', linestyle='--', alpha=0.5, color=BORDER_LIGHT, zorder=0)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(BORDER_LIGHT)
    ax.spines['bottom'].set_color(BORDER_LIGHT)
    ax.set_xlabel("Trọng số ảnh hưởng (Feature Importance)", fontsize=10.5, color=TEXT_MUTED, labelpad=8)
    
    ax.set_title("Top 6 Đặc Trưng Dự Báo Rời Bỏ Khách Hàng (Churn Risk)",
                 fontsize=13.5, fontweight='bold', color=TEXT_MAIN, pad=16, loc='left')

    ax.text(0.345, 4.6, "* Top 3 đặc trưng chiếm 72.5% tổng trọng số quyết định",
            ha='right', fontsize=9.5, color=TEXT_MUTED, style='italic')

    save_plot(fig, "plot_feature_importance.png")


# ═════════════════════════════════════════════════════════════════════════════
# 2. CHURN REASONS DONUT CHART (Slide 5 / 5b)
# ═════════════════════════════════════════════════════════════════════════════
def plot_churn_reasons_donut():
    # Make figure taller to give room for legend without any overlap
    fig, ax = plt.subplots(figsize=(7.5, 6.2), facecolor=WHITE)
    ax.set_facecolor(WHITE)

    sizes = [1509, 206, 154]
    labels = [
        "Voluntary Churn (Chủ động rời bỏ): 1.509 khách (80.7%)\n → Mục tiêu can thiệp giữ chân bằng ưu đãi/CSM",
        "Involuntary Churn (Bị động do lỗi thẻ/chuyển nơi ở): 206 khách (11.0%)\n → Tạm dừng dịch vụ / Tự động thu nợ lại (Auto-retry)",
        "Vague (Lý do khác / Khách không nêu rõ): 154 khách (8.2%)\n → Ghi nhận phản hồi để hoàn thiện sản phẩm"
    ]
    colors = [PRIMARY, AMBER, GRAY]
    
    wedge_props = dict(width=0.40, edgecolor=WHITE, linewidth=3)
    wedges, texts, autotexts = ax.pie(
        sizes, 
        labels=None, 
        autopct=lambda pct: f"{pct:.1f}%",
        pctdistance=0.78,
        colors=colors, 
        wedgeprops=wedge_props, 
        startangle=140,
        textprops=dict(color=WHITE, fontweight='bold', fontsize=10.5)
    )

    # Center circle annotation
    ax.text(0, 0.10, "1.869", ha='center', va='center', fontsize=24, fontweight='bold', color=TEXT_MAIN)
    ax.text(0, -0.16, "Khách Churn\n(Tổng 7.043)", ha='center', va='center', fontsize=10.5, color=TEXT_MUTED)

    ax.legend(
        wedges, labels,
        title="Phân loại bản chất khách hàng rời mạng",
        title_fontsize=11,
        loc="upper center",
        bbox_to_anchor=(0.5, -0.05),
        frameon=True,
        facecolor=BG_LIGHT,
        edgecolor=BORDER_LIGHT,
        fontsize=9.5,
        labelcolor=TEXT_DARK
    )

    ax.set_title("Phân Loại Bản Chất Rời Mạng (1.869 Khách Churn)",
                 fontsize=13.5, fontweight='bold', color=TEXT_MAIN, pad=15)

    save_plot(fig, "plot_churn_reasons_donut.png")


# ═════════════════════════════════════════════════════════════════════════════
# 3. CONTRACT TYPE VS CHURN RATE BAR CHART (Slide 5 / 5b)
# ═════════════════════════════════════════════════════════════════════════════
def plot_contract_churn_rate():
    fig, ax = plt.subplots(figsize=(8.5, 5.2), facecolor=WHITE)
    ax.set_facecolor(WHITE)

    contracts = ["Theo tháng\n(Month-to-month)", "Hợp đồng 1 năm\n(One year)", "Hợp đồng 2 năm\n(Two year)"]
    total_counts = [3875, 1473, 1695]
    churn_counts = [1655, 166, 48]
    churn_rates  = [42.7, 11.3, 2.8]

    x = np.arange(len(contracts))
    width = 0.48

    retained_counts = [t - c for t, c in zip(total_counts, churn_counts)]

    p1 = ax.bar(x, retained_counts, width, label='Ở lại (Retained)', color="#CBD5E1", edgecolor='none', zorder=3)
    p2 = ax.bar(x, churn_counts, width, bottom=retained_counts, label='Rời mạng (Churned)', color=ROSE, edgecolor='none', zorder=3)

    for i, (tot, chn, rate) in enumerate(zip(total_counts, churn_counts, churn_rates)):
        ax.text(i, tot + 80, f"Churn: {rate:.1f}%\n({chn:,}/{tot:,})",
                ha='center', va='bottom', fontsize=11, fontweight='bold',
                color=ROSE if rate > 20 else TEXT_MAIN)

    ax.set_ylim(0, 4800)
    ax.set_xticks(x)
    ax.set_xticklabels(contracts, fontsize=11, color=TEXT_DARK, fontweight='500')
    ax.set_ylabel("Số lượng khách hàng", fontsize=10.5, color=TEXT_MUTED)
    ax.grid(axis='y', linestyle='--', alpha=0.5, color=BORDER_LIGHT, zorder=0)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(BORDER_LIGHT)
    ax.spines['bottom'].set_color(BORDER_LIGHT)

    ax.set_title("Tác Động Của Loại Hợp Đồng Đến Tỷ Lệ Rời Bỏ (Churn Rate)",
                 fontsize=13.5, fontweight='bold', color=TEXT_MAIN, pad=16, loc='left')

    ax.legend(loc='upper right', frameon=True, facecolor=BG_LIGHT, edgecolor=BORDER_LIGHT, fontsize=10)

    # Callout badge
    ax.text(0, 2000, "Nguy cơ cao\ngấp 15 lần!", ha='center', va='center',
            fontsize=11, fontweight='bold', color=WHITE,
            bbox=dict(boxstyle="round,pad=0.4", facecolor="#991B1B", edgecolor='none'))

    save_plot(fig, "plot_contract_churn_rate.png")


# ═════════════════════════════════════════════════════════════════════════════
# 4. MODEL PERFORMANCE METRICS CARD (Slide 5)
# ═════════════════════════════════════════════════════════════════════════════
def plot_model_metrics_cards():
    fig, ax = plt.subplots(figsize=(8.8, 5.2), facecolor=WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(0, 10)
    ax.set_ylim(-0.2, 6.8)
    ax.axis('off')

    cards = [
        # (x, y, w, h, title, value, subtitle, color)
        (0.2, 3.2, 4.6, 2.5, "AUC-ROC SCORE", "0.840", "Khả năng phân biệt churn & ở lại (Rất tốt)", PRIMARY),
        (5.2, 3.2, 4.6, 2.5, "TỶ LỆ CHÍNH XÁC (ACCURACY)", "76.3%", "Đánh giá trên tập test 1.409 khách hàng", TEAL),
        (0.2, 0.4, 4.6, 2.5, "TỶ LỆ CHURN CƠ SỞ (BASE RATE)", "26.5%", "1.869 trên 7.043 khách trong bộ dữ liệu IBM", AMBER),
        (5.2, 0.4, 4.6, 2.5, "QUY MÔ BỘ DỮ LIỆU", "7.043", "Tập dữ liệu chuẩn IBM Telco (California)", TEXT_DARK),
    ]

    for (x, y, w, h, title, val, sub, color) in cards:
        rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2,rounding_size=0.3",
                              facecolor=BG_LIGHT, edgecolor=BORDER_LIGHT, linewidth=1.5, zorder=2)
        ax.add_patch(rect)

        # Accent bar on left edge of card
        accent_bar = FancyBboxPatch((x, y + 0.2), 0.18, h - 0.4, boxstyle="round,pad=0.05",
                                    facecolor=color, edgecolor='none', zorder=3)
        ax.add_patch(accent_bar)

        ax.text(x + 0.45, y + h - 0.55, title, fontsize=9.8, fontweight='bold', color=TEXT_MUTED, zorder=4)
        ax.text(x + 0.45, y + h/2 - 0.05, val, fontsize=24, fontweight='bold', color=color, zorder=4)
        ax.text(x + 0.45, y + 0.45, sub, fontsize=9.0, color=TEXT_DARK, zorder=4)

    # Title with generous top padding
    ax.text(0.2, 6.35, "Chỉ Số Hiệu Năng Mô Hình Dự Báo Rời Mạng (Random Forest)",
            fontsize=13.5, fontweight='bold', color=TEXT_MAIN, zorder=4)

    save_plot(fig, "plot_model_metrics_cards.png")


# ═════════════════════════════════════════════════════════════════════════════
# 5. ROC-AUC CURVE (Slide 5 / Q&A)
# ═════════════════════════════════════════════════════════════════════════════
def plot_roc_curve():
    from phase1_model import load_and_clean_telco_data
    df = load_and_clean_telco_data()
    features = ["Tenure Months", "Monthly Charges", "Total Charges", "CLTV", "contract_encoded", "payment_method_encoded"]
    X = df[features]
    y = df["Churn Value"].astype(int)

    train_X, test_X, train_y, test_y = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=150, max_depth=8, min_samples_split=10, random_state=42, class_weight="balanced")
    clf.fit(train_X, train_y)
    probs = clf.predict_proba(test_X)[:, 1]

    fpr, tpr, thresholds = roc_curve(test_y, probs)
    auc = roc_auc_score(test_y, probs)

    fig, ax = plt.subplots(figsize=(6.8, 5.5), facecolor=WHITE)
    ax.set_facecolor(WHITE)

    # ROC curve
    ax.plot(fpr, tpr, color=PRIMARY, linewidth=2.5, label=f"Random Forest (AUC = {auc:.3f})", zorder=3)
    ax.plot([0, 1], [0, 1], color=GRAY, linestyle="--", linewidth=1.5, label="Đoán ngẫu nhiên (AUC = 0.500)", zorder=2)

    # Fill area under curve
    ax.fill_between(fpr, tpr, alpha=0.08, color=PRIMARY, zorder=1)

    # Operating point (threshold ~ 0.50)
    idx_50 = np.argmin(np.abs(thresholds - 0.50))
    ax.scatter(fpr[idx_50], tpr[idx_50], color=ROSE, s=70, zorder=5)
    ax.annotate(f"Ngưỡng chuẩn (0.50)\nRecall (TPR) = {tpr[idx_50]*100:.1f}%\nBáo động giả (FPR) = {fpr[idx_50]*100:.1f}%",
                xy=(fpr[idx_50], tpr[idx_50]), xytext=(fpr[idx_50] + 0.12, tpr[idx_50] - 0.15),
                arrowprops=dict(arrowstyle="->", color=TEXT_MAIN, lw=1.2),
                fontsize=9.5, fontweight='bold', color=TEXT_MAIN,
                bbox=dict(boxstyle="round,pad=0.35", facecolor=BG_LIGHT, edgecolor=BORDER_LIGHT))

    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.02)
    ax.set_xlabel("Tỷ lệ Báo động Giả (False Positive Rate - FPR)", fontsize=10.5, color=TEXT_MUTED, labelpad=8)
    ax.set_ylabel("Tỷ lệ Nhận diện Đúng (True Positive Rate / Recall)", fontsize=10.5, color=TEXT_MUTED, labelpad=8)
    ax.set_title("Đường Cong ROC-AUC (Mô Hình Churn Risk)", fontsize=13, fontweight='bold', color=TEXT_MAIN, pad=12, loc='left')

    ax.grid(True, linestyle="--", alpha=0.5, color=BORDER_LIGHT, zorder=0)
    ax.legend(loc="lower right", frameon=True, facecolor=BG_LIGHT, edgecolor=BORDER_LIGHT, fontsize=10)

    save_plot(fig, "plot_roc_curve.png")


# ═════════════════════════════════════════════════════════════════════════════
# 6. 2x2 LOYALTY x LTV MATRIX (Slide 6 - Clean White Background)
# ═════════════════════════════════════════════════════════════════════════════
def plot_loyalty_matrix():
    fig, ax = plt.subplots(figsize=(8.5, 7.5), facecolor=WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(-0.6, 10.4)
    ax.set_ylim(-0.6, 10.6)
    ax.axis('off')

    quads = [
        # (x, y, w, h, title, subtitle, count, action, color_bg, color_border, color_title)
        (0.2, 5.2, 4.6, 4.3, "BUTTERFLIES", "Bướm — Giá trị cao, Gắn bó thấp", "18 khách (9.0%)",
         "Khóa gói năm (≤30%)\nƯu đãi chuyển đổi dài hạn", "#F5F3FF", "#818CF8", PRIMARY),
        (5.2, 5.2, 4.6, 4.3, "TRUE FRIENDS", "Bạn Thật — Giá trị cao & Gắn bó cao", "83 khách (41.5%)",
         "CSM Chăm sóc 1:1\nVIP Onboarding & Training", "#F0FDF4", "#4ADE80", TEAL),
        (0.2, 0.4, 4.6, 4.3, "STRANGERS", "Khách Vãng Lai — Giá trị thấp, mới dùng", "83 khách (41.5%)",
         "KHÔNG chi ngân sách\nTránh lãng phí dù rủi ro cao", "#FEF2F2", "#F87171", ROSE),
        (5.2, 0.4, 4.6, 4.3, "BARNACLES", "Hàu — Gắn bó cao, Giá trị thấp", "16 khách (8.0%)",
         "Giải pháp 0 đồng / Tạm ngưng\nKhông giảm giá trực tiếp", "#FFFBEB", "#FCD34D", AMBER),
    ]

    for (x, y, w, h, title, subtitle, count, action, bg, border, tc) in quads:
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2,rounding_size=0.35",
                             facecolor=bg, edgecolor=border, linewidth=2, zorder=2)
        ax.add_patch(box)

        # Title
        ax.text(x + w/2, y + h - 0.65, title, ha='center', va='center',
                fontsize=13, fontweight='bold', color=tc, zorder=4)
        # Subtitle
        ax.text(x + w/2, y + h - 1.3, subtitle, ha='center', va='center',
                fontsize=9.2, color=TEXT_MUTED, zorder=4)
        # Count Badge
        ax.text(x + w/2, y + h/2 + 0.1, count, ha='center', va='center',
                fontsize=11.5, fontweight='bold', color=TEXT_MAIN, zorder=4,
                bbox=dict(boxstyle="round,pad=0.3", facecolor=WHITE, edgecolor=border, lw=1))
        # Action
        ax.text(x + w/2, y + 0.85, action, ha='center', va='center',
                fontsize=9.2, color=TEXT_DARK, fontweight='500', zorder=4)

    # Axes label arrows
    ax.annotate("", xy=(9.8, 4.9), xytext=(0.2, 4.9),
                arrowprops=dict(arrowstyle="->", color=BORDER_LIGHT, lw=2.5), zorder=1)
    ax.annotate("", xy=(4.9, 9.8), xytext=(4.9, 0.2),
                arrowprops=dict(arrowstyle="->", color=BORDER_LIGHT, lw=2.5), zorder=1)

    ax.text(4.9, -0.25, "Thời gian gắn bó (Tenure / Loyalty)  →", ha='center', fontsize=11, color=TEXT_MUTED, fontweight='bold')
    ax.text(-0.25, 4.9, "Giá trị khách hàng (LTV)  →", va='center', rotation=90, fontsize=11, color=TEXT_MUTED, fontweight='bold')

    ax.text(0.2, 10.15, "Ma Trận Phân Khúc Giữ Chân Khách Hàng (Reinartz & Kumar, 2002)",
            fontsize=13, fontweight='bold', color=TEXT_MAIN, zorder=4)

    save_plot(fig, "plot_loyalty_matrix.png")


if __name__ == "__main__":
    print("Re-generating polished white-background plots for PowerPoint...")
    plot_feature_importance()
    plot_churn_reasons_donut()
    plot_contract_churn_rate()
    plot_model_metrics_cards()
    plot_roc_curve()
    plot_loyalty_matrix()
    print("All plots re-generated successfully!")

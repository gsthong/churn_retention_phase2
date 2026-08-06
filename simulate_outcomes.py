"""
simulate_outcomes.py
----------------------
CHỈ DÙNG CHO DEMO/THUYẾT TRÌNH.

Trong thực tế, kết quả "khách có rời bỏ hay không sau 1 tháng" phải lấy từ dữ liệu
thật (họ có gia hạn/hủy gói hay không). Vì demo không thể chờ 1 tháng, file này
sinh ra kết quả giả lập dựa trên một mô hình xác suất đơn giản:

    P(churn) = churn_risk_score, giảm đi nếu có hành động can thiệp
               (mức giảm tỉ lệ thuận với "độ mạnh" của hành động).

Mục đích: có dữ liệu để chạy evaluate_roi.py minh họa cách so sánh
holdout vs treatment ngay trong buổi demo.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent))
from config import ACTIONS_LOG_CSV, OUTCOMES_CSV, RANDOM_SEED

# Hệ số "hiệu quả" giả định của từng loại hành động (giảm bao nhiêu % xác suất churn tuyệt đối)
# Đây là con số giả lập cho demo - khi có dữ liệu thật, con số này sẽ được đo bằng
# chính kết quả A/B test, không phải gán tay như thế này.
ACTION_EFFECTIVENESS = {
    "no_action": 0.0,
    "discount": 0.22,
    "free_upgrade": 0.28,
    "priority_support": 0.15,
    "feature_education": 0.08,
    "email_only": 0.05,
}


def simulate(actions_df: pd.DataFrame, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed + 1)  # seed khác với lúc chia holdout để tránh trùng pattern

    df = actions_df.copy()
    effectiveness = df["action_type"].map(ACTION_EFFECTIVENESS).fillna(0.0)

    # Hành động mạnh hơn (discount % cao hơn) thì hiệu quả nhích thêm một chút
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
    print("Tỉ lệ churn giả lập theo nhóm:")
    print(churn_rate_by_group)
    print(f"\nĐã ghi kết quả mô phỏng -> {OUTCOMES_CSV}")

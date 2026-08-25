"""
generate_customers.py
----------------------
Sinh dữ liệu khách hàng "nguy cơ rời bỏ cao" giả lập ĐẦU RA của Phase 1
(XGBoost/Logistic Regression đã chạy xong, lọc ra danh sách này).

Phase 2 không quan tâm Phase 1 train model như thế nào - nó chỉ cần nhận vào
một danh sách: customer_id, thông tin hợp đồng, churn_risk_score, ltv.
File này giả lập chính xác cái input đó, dựa theo schema quen thuộc của
bộ IBM Telco Customer Churn (Contract, PaymentMethod, MonthlyCharges, TotalCharges...).

Chạy: python -m data_gen.generate_customers
"""

import random
import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import CUSTOMERS_CSV, RANDOM_SEED

SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"]
MIDDLE_MALE = ["Văn", "Hữu", "Đức", "Minh", "Quốc", "Thành"]
MIDDLE_FEMALE = ["Thị", "Ngọc", "Thu", "Diễm", "Kim", "Bảo"]
GIVEN_MALE = ["An", "Bình", "Cường", "Dũng", "Hải", "Khôi", "Long", "Nam", "Phong", "Quân", "Sơn", "Tuấn"]
GIVEN_FEMALE = ["Anh", "Chi", "Dung", "Hà", "Hương", "Lan", "Linh", "Mai", "Ngân", "Phương", "Trang", "Vy"]

CONTRACT_TYPES = ["Month-to-month", "One year", "Two year"]
PAYMENT_METHODS = ["Electronic check", "Mailed check", "Bank transfer", "Credit card"]


def _random_name(rng: random.Random) -> str:
    is_male = rng.random() < 0.5
    surname = rng.choice(SURNAMES)
    middle = rng.choice(MIDDLE_MALE if is_male else MIDDLE_FEMALE)
    given = rng.choice(GIVEN_MALE if is_male else GIVEN_FEMALE)
    return f"{surname} {middle} {given}"


def generate_customers(n: int = 200, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)

    rows = []
    for i in range(n):
        customer_id = f"CUS-{i + 1:04d}"
        name = _random_name(rng)
        tenure_months = int(np_rng.integers(1, 72))
        contract_type = rng.choices(CONTRACT_TYPES, weights=[0.6, 0.25, 0.15])[0]
        payment_method = rng.choice(PAYMENT_METHODS)

        monthly_fee = round(float(np_rng.uniform(99_000, 599_000)), -3)  # VND, làm tròn nghìn
        # Total charges: xấp xỉ monthly_fee * tenure, cộng nhiễu
        total_charges = round(monthly_fee * tenure_months * float(np_rng.uniform(0.85, 1.05)), -3)

        # Đây là nhóm ĐÃ được Phase 1 lọc ra là nguy cơ cao => risk score thiên về cao (0.55 - 0.98)
        churn_risk_score = round(float(np_rng.uniform(0.55, 0.98)), 3)

        # LTV ước tính = giá trị đã chi + hệ số kỳ vọng vòng đời còn lại
        expected_remaining_months = float(np_rng.uniform(3, 24))
        ltv = round(total_charges + monthly_fee * expected_remaining_months, -3)

        # Network influence score (Tribe Leader if > 0.8)
        network_influence_score = round(float(np_rng.uniform(0.0, 1.0)), 3)
        # Bóp méo phân phối để chỉ có khoảng 5% là tribe leader
        if rng.random() > 0.05:
            network_influence_score = min(network_influence_score, 0.79)
        is_tribe_leader = network_influence_score > 0.8

        # Enterprise wallet capacity (khoảng 15% là khách hàng doanh nghiệp tiềm năng lớn)
        is_enterprise_wallet = rng.random() < 0.18

        rows.append(
            {
                "customer_id": customer_id,
                "name": name,
                "tenure_months": tenure_months,
                "contract_type": contract_type,
                "payment_method": payment_method,
                "monthly_fee": monthly_fee,
                "total_charges": total_charges,
                "churn_risk_score": churn_risk_score,
                "ltv": ltv,
                "network_influence_score": network_influence_score,
                "is_tribe_leader": is_tribe_leader,
                "is_enterprise_wallet": is_enterprise_wallet,
            }
        )

    df = pd.DataFrame(rows)

    from config import assign_advanced_segment
    
    df['ltv_pct'] = df['ltv'].rank(pct=True)
    df['tenure_pct'] = df['tenure_months'].rank(pct=True)

    df["tier"] = df.apply(lambda row: assign_advanced_segment(
        row["ltv_pct"], row["tenure_pct"], row["is_tribe_leader"], row.get("is_enterprise_wallet", False)
    ), axis=1)
    
    return df


if __name__ == "__main__":
    df = generate_customers(n=200)
    df.to_csv(CUSTOMERS_CSV, index=False, encoding="utf-8-sig")
    print(f"Đã sinh {len(df)} khách hàng nguy cơ rời bỏ cao -> {CUSTOMERS_CSV}")
    print(df["tier"].value_counts())

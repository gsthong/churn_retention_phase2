"""
phase1_model.py
---------------
Phase 1 ML Engine & Data Preparation Module.
Reads the IBM Telco Customer Churn dataset (Telco_customer_churn.xlsx),
trains the Random Forest Churn Risk Predictor based on the Phase 1 Notebooks,
categorizes Churn Reasons (Voluntary vs Involuntary vs Vague),
and generates the high-risk customer cohort for Phase 2 Multi-Agent Retention.
"""

import random
import sys
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, roc_auc_score, accuracy_score
from sklearn.model_selection import train_test_split

sys.path.append(str(Path(__file__).resolve().parent))
from config import (
    TELCO_DATASET_PATH,
    CUSTOMERS_CSV,
    RANDOM_SEED,
    CHURN_REASONS_VOLUNTARY,
    CHURN_REASONS_INVOLUNTARY,
    CHURN_REASONS_VAGUE,
    CONTRACT_ENCODING,
    PAYMENT_METHOD_ENCODING,
    categorize_churn_reason,
    assign_advanced_segment,
)

SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"]
MIDDLE_MALE = ["Văn", "Hữu", "Đức", "Minh", "Quốc", "Thành", "Công", "Đình"]
MIDDLE_FEMALE = ["Thị", "Ngọc", "Thu", "Diễm", "Kim", "Bảo", "Khánh", "Mai"]
GIVEN_MALE = ["An", "Bình", "Cường", "Dũng", "Hải", "Khôi", "Long", "Nam", "Phong", "Quân", "Sơn", "Tuấn", "Khang", "Tâm"]
GIVEN_FEMALE = ["Anh", "Chi", "Dung", "Hà", "Hương", "Lan", "Linh", "Mai", "Ngân", "Phương", "Trang", "Vy", "Thảo", "Hạnh"]


def _random_name(rng: random.Random) -> str:
    is_male = rng.random() < 0.5
    surname = rng.choice(SURNAMES)
    middle = rng.choice(MIDDLE_MALE if is_male else MIDDLE_FEMALE)
    given = rng.choice(GIVEN_MALE if is_male else GIVEN_FEMALE)
    return f"{surname} {middle} {given}"


def load_and_clean_telco_data(filepath: Optional[Path] = None) -> pd.DataFrame:
    """
    Loads Telco_customer_churn.xlsx and applies standard cleaning from Notebook 1:
    - Strips whitespace in 'Total Charges'
    - Encodes Contract & Payment Method
    - Categorizes Churn Reason into Voluntary (1), Involuntary (2), Vague (3)
    """
    path = filepath or TELCO_DATASET_PATH
    if not path.exists():
        raise FileNotFoundError(f"Telco dataset not found at {path}")

    df = pd.read_excel(path)

    # Clean Total Charges (replace whitespace with tenure * monthly charges or 0)
    df["Total Charges"] = pd.to_numeric(df["Total Charges"].astype(str).str.strip(), errors="coerce")
    df["Total Charges"] = df["Total Charges"].fillna(df["Tenure Months"] * df["Monthly Charges"])

    # Categorize Churn Reason
    df["churn_category"] = df["Churn Reason"].apply(categorize_churn_reason)
    df["churn_reason_clean"] = df["Churn Reason"].fillna("N/A")

    # Encode categorical columns for ML
    df["contract_encoded"] = df["Contract"].map(CONTRACT_ENCODING).fillna(1).astype(int)
    df["payment_method_encoded"] = df["Payment Method"].map(PAYMENT_METHOD_ENCODING).fillna(1).astype(int)

    return df


def train_churn_model(
    df: pd.DataFrame, 
    seed: int = RANDOM_SEED
) -> Tuple[RandomForestClassifier, Dict[str, Any]]:
    """
    Trains a Random Forest Classifier on Telco customer attributes to predict Churn Value (0 or 1).
    Features: ['Tenure Months', 'Monthly Charges', 'Total Charges', 'CLTV', 'contract_encoded', 'payment_method_encoded']
    """
    features = ["Tenure Months", "Monthly Charges", "Total Charges", "CLTV", "contract_encoded", "payment_method_encoded"]
    X = df[features].copy()
    y = df["Churn Value"].astype(int)

    train_X, test_X, train_y, test_y = train_test_split(
        X, y, test_size=0.20, random_state=seed, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        min_samples_split=10,
        random_state=seed,
        class_weight="balanced"
    )
    model.fit(train_X, train_y)

    test_preds = model.predict(test_X)
    test_probs = model.predict_proba(test_X)[:, 1]

    metrics = {
        "accuracy": float(accuracy_score(test_y, test_preds)),
        "roc_auc": float(roc_auc_score(test_y, test_probs)),
        "mae": float(mean_absolute_error(test_y, test_probs)),
        "feature_importances": {
            feat: float(imp) for feat, imp in zip(features, model.feature_importances_)
        },
        "train_samples": len(train_X),
        "test_samples": len(test_X)
    }

    return model, metrics


def generate_at_risk_cohort(
    df: pd.DataFrame,
    model: RandomForestClassifier,
    n_customers: int = 200,
    filter_voluntary_only: bool = False,
    seed: int = RANDOM_SEED
) -> pd.DataFrame:
    """
    Scores all customers in the dataset, selects high-risk customers,
    enriches with Vietnamese demographic details, LTV in VND, and strategic business tiers.
    """
    features = ["Tenure Months", "Monthly Charges", "Total Charges", "CLTV", "contract_encoded", "payment_method_encoded"]
    
    scored_df = df.copy()
    scored_df["churn_risk_score"] = model.predict_proba(scored_df[features])[:, 1].round(3)

    # Filter cohort: customers with high churn risk (e.g. >= 0.50) or actual churned records
    high_risk_df = scored_df[
        (scored_df["churn_risk_score"] >= 0.50) | (scored_df["Churn Value"] == 1)
    ].copy()

    if filter_voluntary_only:
        high_risk_df = high_risk_df[high_risk_df["churn_category"] == "voluntary"]

    # Sample to requested size or sort by risk
    if len(high_risk_df) > n_customers:
        # Sample with probability proportional to churn risk score
        sample_weights = high_risk_df["churn_risk_score"] ** 2
        sample_weights = sample_weights / sample_weights.sum()
        high_risk_df = high_risk_df.sample(n=n_customers, weights=sample_weights, random_state=seed)

    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)

    rows = []
    for idx, row in high_risk_df.reset_index(drop=True).iterrows():
        customer_id = f"CUS-{idx + 1:04d}"
        name = _random_name(rng)
        tenure_months = int(row["Tenure Months"])
        contract_type = str(row["Contract"])
        payment_method = str(row["Payment Method"])
        
        # Convert charges to VND ($1 = 24,000 VND)
        monthly_fee = round(float(row["Monthly Charges"]) * 24_000, -3)
        total_charges = round(float(row["Total Charges"]) * 24_000, -3)

        # LTV calculation: (Total Charges) + (Monthly Fee * remaining expected life in months)
        # Using real CLTV field from Telco dataset as base multiplier
        cltv_multiplier = float(row.get("CLTV", 3000)) / 1000.0  # e.g., 2.5 - 4.5
        expected_months = max(3.0, min(24.0, cltv_multiplier * 4.0))
        ltv = round(total_charges + monthly_fee * expected_months, -3)

        churn_risk_score = float(row["churn_risk_score"])
        churn_reason = str(row.get("Churn Reason", "N/A")) if pd.notna(row.get("Churn Reason")) else "Competitor made better offer"
        churn_category = str(row.get("churn_category", "voluntary"))

        # Network influence score (Tribe Leader if > 0.8)
        network_influence_score = round(float(np_rng.uniform(0.0, 1.0)), 3)
        if rng.random() > 0.06:
            network_influence_score = min(network_influence_score, 0.79)
        is_tribe_leader = network_influence_score > 0.8

        # Enterprise wallet capacity (approx 15% enterprise)
        is_enterprise_wallet = rng.random() < 0.18

        rows.append({
            "customer_id": customer_id,
            "original_telco_id": str(row["CustomerID"]),
            "name": name,
            "tenure_months": tenure_months,
            "contract_type": contract_type,
            "payment_method": payment_method,
            "monthly_fee": monthly_fee,
            "total_charges": total_charges,
            "churn_risk_score": churn_risk_score,
            "ltv": ltv,
            "churn_reason": churn_reason,
            "churn_category": churn_category,
            "network_influence_score": network_influence_score,
            "is_tribe_leader": is_tribe_leader,
            "is_enterprise_wallet": is_enterprise_wallet,
        })

    result_df = pd.DataFrame(rows)

    # Assign Business Segments
    result_df["ltv_pct"] = result_df["ltv"].rank(pct=True)
    result_df["tenure_pct"] = result_df["tenure_months"].rank(pct=True)

    result_df["tier"] = result_df.apply(
        lambda r: assign_advanced_segment(
            r["ltv_pct"], r["tenure_pct"], r["is_tribe_leader"], r["is_enterprise_wallet"]
        ),
        axis=1
    )

    return result_df


def get_dataset_summary() -> Dict[str, Any]:
    """
    Returns high-level statistics and breakdown of the real Telco dataset
    for API endpoints and dashboard analytics.
    """
    df = load_and_clean_telco_data()
    
    total_customers = len(df)
    churn_count = int((df["Churn Value"] == 1).sum())
    churn_rate = float(churn_count / total_customers) if total_customers > 0 else 0.0

    # Churn Category distribution
    churn_category_counts = df[df["Churn Value"] == 1]["churn_category"].value_counts().to_dict()

    # Top Churn Reasons
    top_reasons = df[df["Churn Value"] == 1]["Churn Reason"].value_counts().head(10).to_dict()
    top_reasons_list = [{"reason": str(k), "count": int(v)} for k, v in top_reasons.items()]

    # Contract distribution
    contract_dist = df["Contract"].value_counts().to_dict()

    # Payment Method distribution
    payment_dist = df["Payment Method"].value_counts().to_dict()

    # Monthly charges stats ($)
    monthly_stats = {
        "min": float(df["Monthly Charges"].min()),
        "mean": float(df["Monthly Charges"].mean()),
        "max": float(df["Monthly Charges"].max()),
        "median": float(df["Monthly Charges"].median()),
    }

    return {
        "dataset_name": "IBM Telco Customer Churn (California)",
        "total_records": total_customers,
        "churned_records": churn_count,
        "retained_records": total_customers - churn_count,
        "churn_rate_pct": round(churn_rate * 100, 2),
        "voluntary_churn_count": int(churn_category_counts.get("voluntary", 0)),
        "involuntary_churn_count": int(churn_category_counts.get("involuntary", 0)),
        "vague_churn_count": int(churn_category_counts.get("vague", 0)),
        "top_churn_reasons": top_reasons_list,
        "contract_distribution": contract_dist,
        "payment_method_distribution": payment_dist,
        "monthly_charges_usd": monthly_stats,
    }


def run_phase1(
    n_customers: int = 200,
    filter_voluntary_only: bool = False,
    output_path: Optional[Path] = None,
    seed: int = RANDOM_SEED
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Complete Phase 1 Pipeline: Load -> Clean -> Train RF Model -> Score & Segment -> Save at_risk_customers.csv.
    """
    print("=" * 60)
    print("PHASE 1: ML CHURN PREDICTION & REASON CATEGORIZATION")
    print("=" * 60)
    print(f"Loading raw dataset from {TELCO_DATASET_PATH}...")
    df = load_and_clean_telco_data()
    print(f"Loaded {len(df):,} customer records with {len(df.columns)} columns.")

    print("\nTraining Random Forest Churn Predictor...")
    model, metrics = train_churn_model(df, seed=seed)
    print(f"Model Trained successfully:")
    print(f"  - Accuracy: {metrics['accuracy']:.2%}")
    print(f"  - ROC-AUC:  {metrics['roc_auc']:.4f}")
    print(f"  - MAE:      {metrics['mae']:.4f}")

    print(f"\nExtracting {n_customers} high-risk customers for Phase 2...")
    at_risk_df = generate_at_risk_cohort(
        df, model, n_customers=n_customers, filter_voluntary_only=filter_voluntary_only, seed=seed
    )

    out_file = output_path or CUSTOMERS_CSV
    out_file.parent.mkdir(parents=True, exist_ok=True)
    at_risk_df.to_csv(out_file, index=False, encoding="utf-8-sig")
    print(f"Saved {len(at_risk_df)} high-risk records to {out_file}")
    print(f"\nTier Breakdown:\n{at_risk_df['tier'].value_counts()}")
    print(f"\nChurn Category Breakdown:\n{at_risk_df['churn_category'].value_counts()}")
    print("=" * 60)

    return at_risk_df, metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Phase 1 ML Churn Model Pipeline")
    parser.add_argument("--n-customers", type=int, default=200, help="Number of at-risk customers to export")
    parser.add_argument("--filter-voluntary", action="store_true", help="Filter for voluntary churn cases only")
    args = parser.parse_args()

    run_phase1(n_customers=args.n_customers, filter_voluntary_only=args.filter_voluntary)

import argparse
import pandas as pd
import numpy as np
import random
from pathlib import Path

URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"

def get_data(limit=None):
    print("Downloading IBM Telco dataset...")
    df = pd.read_csv(URL)
    
    # filter churned users
    df_churn = df[df['Churn'] == 'Yes'].copy()
    if limit:
        df_churn = df_churn.head(limit)
        
    df_churn['monthly_fee'] = df_churn['MonthlyCharges'] * 24000
    df_churn['TotalCharges'] = pd.to_numeric(df_churn['TotalCharges'], errors='coerce').fillna(0)
    df_churn['total_charges'] = df_churn['TotalCharges'] * 24000
    
    df_churn = df_churn.rename(columns={
        'customerID': 'customer_id',
        'tenure': 'tenure_months',
        'Contract': 'contract_type',
        'PaymentMethod': 'payment_method'
    })
    
    last_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Đặng", "Bùi", "Đỗ"]
    first_names = ["An", "Bình", "Cường", "Dung", "Hà", "Linh", "Minh", "Nam", "Trang", "Tuấn", "Khang", "Tâm"]
    
    df_churn['name'] = [f"{random.choice(last_names)} {random.choice(first_names)}" for _ in range(len(df_churn))]
    df_churn['churn_risk_score'] = np.random.uniform(0.70, 0.95, size=len(df_churn))
    
    rem_months = np.random.uniform(3, 12, size=len(df_churn))
    df_churn['ltv'] = df_churn['total_charges'] + (df_churn['monthly_fee'] * rem_months)
    
    final_cols = ['customer_id', 'name', 'tenure_months', 'contract_type', 'payment_method', 
                  'monthly_fee', 'total_charges', 'churn_risk_score', 'ltv']
    
    df_final = df_churn[final_cols]
    
    out = Path("data/real_phase1_output.csv")
    out.parent.mkdir(exist_ok=True)
    df_final.to_csv(out, index=False, encoding='utf-8-sig')
    print(f"Saved {len(df_final)} rows to {out}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download and prepare Telco data")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows")
    parser.add_argument("--all", action="store_true", help="Download all churn data")
    args = parser.parse_args()
    
    lim = None if args.all else (args.limit or 50)
    get_data(lim)

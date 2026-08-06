import pandas as pd
import numpy as np
import random
from pathlib import Path

# URL gốc của IBM Telco Customer Churn dataset
URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"

def prepare_real_data():
    print("Đang tải dữ liệu thực tế (IBM Telco Churn)...")
    df = pd.read_csv(URL)
    
    # Giả lập việc Phase 1 (XGBoost) đã lọc ra 50 khách hàng có nguy cơ rời bỏ cao nhất
    # Trong dataset gốc, 'Churn' == 'Yes'
    df_churn = df[df['Churn'] == 'Yes'].head(50).copy()
    
    # Map các cột sang chuẩn của hệ thống Phase 2
    # Chuyển đổi cước phí từ USD sang VND (giả sử 1 USD = 24,000 VND)
    df_churn['monthly_fee'] = df_churn['MonthlyCharges'] * 24000
    
    # TotalCharges có thể có khoảng trắng, xử lý lỗi parse
    df_churn['TotalCharges'] = pd.to_numeric(df_churn['TotalCharges'], errors='coerce').fillna(0)
    df_churn['total_charges'] = df_churn['TotalCharges'] * 24000
    
    df_churn = df_churn.rename(columns={
        'customerID': 'customer_id',
        'tenure': 'tenure_months',
        'Contract': 'contract_type',
        'PaymentMethod': 'payment_method'
    })
    
    # Thêm tên giả lập (vì dataset thật bị ẩn danh)
    SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh"]
    GIVEN_NAMES = ["An", "Bình", "Cường", "Dung", "Hà", "Linh", "Minh", "Nam", "Trang", "Tuấn"]
    
    def random_name():
        return f"{random.choice(SURNAMES)} {random.choice(GIVEN_NAMES)}"
        
    df_churn['name'] = [random_name() for _ in range(len(df_churn))]
    
    # Giả lập output của model Phase 1: churn_risk_score và LTV
    df_churn['churn_risk_score'] = np.random.uniform(0.70, 0.95, size=len(df_churn))
    
    expected_remaining_months = np.random.uniform(3, 12, size=len(df_churn))
    df_churn['ltv'] = df_churn['total_charges'] + (df_churn['monthly_fee'] * expected_remaining_months)
    
    # Giữ lại đúng các cột Phase 2 cần
    final_cols = ['customer_id', 'name', 'tenure_months', 'contract_type', 'payment_method', 
                  'monthly_fee', 'total_charges', 'churn_risk_score', 'ltv']
    
    df_final = df_churn[final_cols]
    
    out_path = Path("data/real_phase1_output.csv")
    out_path.parent.mkdir(exist_ok=True)
    df_final.to_csv(out_path, index=False, encoding='utf-8-sig')
    print(f"Đã lưu data thật vào {out_path} (Số lượng: {len(df_final)})")

if __name__ == "__main__":
    prepare_real_data()

"""
config.py
---------
Cấu hình trung tâm cho toàn bộ Phase 2 (Multi-Agent Retention Layer).
Mọi "luật chơi" business (guardrail ngân sách, catalog hành động, model routing)
đều nằm ở đây để dễ chỉnh sửa và để giám khảo thấy rõ hệ thống có ràng buộc rõ ràng,
không phải AI muốn làm gì thì làm.
"""

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Đường dẫn
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
LOG_DIR = DATA_DIR / "logs"
OUTPUT_DIR = ROOT_DIR / "outputs"
MESSAGES_DIR = OUTPUT_DIR / "messages"

CUSTOMERS_CSV = DATA_DIR / "at_risk_customers.csv"
ACTIONS_LOG_CSV = OUTPUT_DIR / "actions_log.csv"
OUTCOMES_CSV = OUTPUT_DIR / "outcomes.csv"

for d in (DATA_DIR, LOG_DIR, OUTPUT_DIR, MESSAGES_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# LLM / model routing
# ---------------------------------------------------------------------------
# Dùng model rẻ + nhanh cho tác vụ trích xuất đơn giản (Retriever),
# dùng model mạnh hơn cho tác vụ ra quyết định chiến lược (Negotiator)
# và tác vụ sinh nội dung cá nhân hóa (Execution).
# => đây cũng là một điểm cộng khi thuyết trình: "tối ưu chi phí bằng model routing".
RETRIEVER_MODEL = "claude-haiku-4-5-20251001"
NEGOTIATOR_MODEL = "claude-sonnet-5"
EXECUTION_MODEL = "claude-sonnet-5"

from dotenv import load_dotenv

load_dotenv()  # Load variables from .env if it exists

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL")
ZALO_OA_TOKEN = os.environ.get("ZALO_OA_TOKEN")

# Nếu không có API key, toàn bộ hệ thống tự động chạy ở MOCK MODE
# (rule-based, không tốn tiền, không cần mạng) để demo vẫn chạy được.
USE_MOCK = ANTHROPIC_API_KEY is None

# ---------------------------------------------------------------------------
# Holdout group (nhóm đối chứng) - dùng để đo ROI thực tế của hệ thống
# ---------------------------------------------------------------------------
HOLDOUT_RATIO = 0.10  # 10% khách hàng nguy cơ cao sẽ KHÔNG được agent chăm sóc
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# Guardrail ngân sách ("vòng kim cô") theo tier khách hàng
# Negotiator Agent BẮT BUỘC phải tôn trọng các giới hạn này.
# Dù LLM có "sáng tạo" đề xuất gì, code vẫn sẽ clip lại đúng guardrail.
# ---------------------------------------------------------------------------
GUARDRAILS = {
    "VIP": {
        "max_discount_pct": 30,
        "max_free_months": 1,
        "allowed_actions": ["discount", "free_upgrade", "priority_support", "email_only"],
    },
    "Standard": {
        "max_discount_pct": 15,
        "max_free_months": 0,
        "allowed_actions": ["discount", "email_only", "feature_education"],
    },
    "Basic": {
        "max_discount_pct": 5,
        "max_free_months": 0,
        "allowed_actions": ["email_only", "feature_education"],
    },
}

# Định nghĩa tier theo phân vị LTV (percentile), tính lúc generate data
TIER_PERCENTILES = {
    "VIP": 0.80,       # top 20% LTV
    "Standard": 0.30,  # giữa 50% LTV
    "Basic": 0.0,      # 30% LTV thấp nhất
}

# Giá trị quy đổi ước tính cho mỗi loại hành động (dùng để tính chi phí ROI)
ACTION_COST_ESTIMATE = {
    # cost = % chi phí tính trên monthly_fee của khách, hoặc giá trị cố định
    "discount": lambda monthly_fee, discount_pct, free_months: monthly_fee * (discount_pct / 100),
    "free_upgrade": lambda monthly_fee, discount_pct, free_months: monthly_fee * free_months,
    "priority_support": lambda monthly_fee, discount_pct, free_months: 20000,  # chi phí vận hành ước tính (VND)
    "email_only": lambda monthly_fee, discount_pct, free_months: 500,  # gần như 0đ
    "feature_education": lambda monthly_fee, discount_pct, free_months: 500,
    "no_action": lambda monthly_fee, discount_pct, free_months: 0,
}

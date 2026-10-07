import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
LOG_DIR = DATA_DIR / "logs"
OUTPUT_DIR = ROOT_DIR / "outputs"
MESSAGES_DIR = OUTPUT_DIR / "messages"

CUSTOMERS_CSV = DATA_DIR / "at_risk_customers.csv"
TELCO_DATASET_PATH = DATA_DIR / "Telco_customer_churn.xlsx"
ACTIONS_LOG_CSV = OUTPUT_DIR / "actions_log.csv"
OUTCOMES_CSV = OUTPUT_DIR / "outcomes.csv"

# Reason Categorization from Phase 1 Notebook
CHURN_REASONS_VOLUNTARY = [
    "Competitor made better offer",
    "Competitor had better devices",
    "Competitor offered higher download speeds",
    "Competitor offered more data",
    "Product dissatisfaction",
    "Service dissatisfaction",
    "Long distance charges",
    "Attitude of service provider",
    "Attitude of support person",
    "Poor expertise of online support",
    "Poor expertise of phone support",
    "Extra data charges",
    "Price too high",
    "Lack of affordable download/upload speed",
    "Lack of self-service on Website",
]

CHURN_REASONS_INVOLUNTARY = [
    "Limited range of services",
    "Network reliability",
    "Deceased",
    "Moved",
]

CHURN_REASONS_VAGUE = [
    "Don't know",
]

CONTRACT_ENCODING = {
    "Month-to-month": 1,
    "Two year": 2,
    "One year": 3,
}

PAYMENT_METHOD_ENCODING = {
    "Mailed check": 1,
    "Electronic check": 2,
    "Bank transfer (automatic)": 3,
    "Credit card (automatic)": 4,
}

def categorize_churn_reason(reason: str) -> str:
    if not isinstance(reason, str):
        return "voluntary"
    if reason in CHURN_REASONS_VOLUNTARY:
        return "voluntary"
    elif reason in CHURN_REASONS_INVOLUNTARY:
        return "involuntary"
    elif reason in CHURN_REASONS_VAGUE:
        return "vague"
    return "voluntary"

for d in (DATA_DIR, LOG_DIR, OUTPUT_DIR, MESSAGES_DIR):
    d.mkdir(parents=True, exist_ok=True)

load_dotenv()

# Multi-Key & Multi-Provider LLM Configuration
GROQ_API_KEYS_STR = os.environ.get("GROQ_API_KEYS", "")
GROQ_API_KEYS = [k.strip() for k in GROQ_API_KEYS_STR.split(",") if k.strip()]
GROQ_BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

OPENROUTER_API_KEYS_STR = os.environ.get("OPENROUTER_API_KEYS", "")
OPENROUTER_API_KEYS = [k.strip() for k in OPENROUTER_API_KEYS_STR.split(",") if k.strip()]
OPENROUTER_API_KEY = OPENROUTER_API_KEYS[0] if OPENROUTER_API_KEYS else os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

GROQ_API_KEY = GROQ_API_KEYS[0] if GROQ_API_KEYS else os.environ.get("GROQ_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Best-in-class Model Routing (using Qwen on Groq)
RETRIEVER_MODEL = os.environ.get("RETRIEVER_MODEL", "qwen/qwen3.6-27b")
NEGOTIATOR_MODEL = os.environ.get("NEGOTIATOR_MODEL", "qwen/qwen3.6-27b")
EXECUTION_MODEL = os.environ.get("EXECUTION_MODEL", "qwen/qwen3.6-27b")

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL")
ZALO_OA_TOKEN = os.environ.get("ZALO_OA_TOKEN")

# Fallback to mock mode only if no keys at all
USE_MOCK = (len(GROQ_API_KEYS) == 0) and (len(OPENROUTER_API_KEYS) == 0) and (OPENAI_API_KEY is None)

# ==========================================
# 🧪 A/B TEST & HOLDOUT GROUP POLICY
# ==========================================
# Tỷ lệ nhóm đối chứng (5-15% tùy quy mô doanh nghiệp, mặc định 10%)
# Kohavi, R., Tang, D., & Xu, Y. (2020). Trustworthy online controlled experiments.
HOLDOUT_RATIO = 0.10
RANDOM_SEED = 42

# Ngưỡng Churn Risk tối thiểu để tính can thiệp vào A/B Test tài chính
# Những khách hàng có Churn Risk < ngưỡng này hoặc chỉ được can thiệp kỹ thuật/thanh toán
# sẽ KHÔNG được tính vào phép đo ROI / A/B Test (chỉ đưa vào luồng hỗ trợ chuẩn)
AB_TEST_MIN_CHURN_RISK = 0.25

# ==========================================
# 📈 GIẢ ĐỊNH KINH DOANH & RETENTION UPLIFT
# ==========================================
# Tỷ lệ ở lại tăng thêm nhờ can thiệp AI (so với không làm gì - Holdout baseline)
# Nguồn: Ascarza (2018). Retention futility. Journal of Marketing Research, 55(1), 80-98.
# & Hiệu chỉnh dựa trên benchmark ngành telecom (Ringly.io, 2026)

# Churn Risk >= 80%: Khách gần chắc chắn rời đi, ưu đãi cứu được 1 phần nhỏ nhạy cảm
RETENTION_UPLIFT_HIGH_RISK = 0.05   # +5 percentage points

# 50% <= Churn Risk < 80%: Khách đang phân vân, trúng đích mang lại hiệu quả rõ rệt
RETENTION_UPLIFT_MID_RISK  = 0.10   # +10 percentage points

# Churn Risk < 50%: Khách có thiện chí ở lại, chỉ cần hỗ trợ nhẹ là đủ giữ chân
RETENTION_UPLIFT_LOW_RISK  = 0.15   # +15 percentage points

# Giả định: LTV của khách được giữ chân lấy trung bình phân khúc (Homogeneous LTV Assumption)
LTV_HOMOGENEOUS_ASSUMPTION = True

# Giả định: Tỷ lệ Churn KHÔNG thay đổi nếu vấn đề cốt lõi chưa được giải quyết
# (can thiệp tài chính thuần túy mà không fix technical/service issue => uplift = 0)
UPLIFT_ZERO_IF_UNRESOLVED = True

# ==========================================
# 🛡️ AI GOVERNANCE & SAFETY CONTROLS
# ==========================================
# Financial Circuit Breaker: Stop-loss cap to prevent runaway AI discounting
CIRCUIT_BREAKER_DAILY_MAX_BUDGET_VND = 35_000_000  # Ngưỡng ngắt khẩn cấp hàng ngày
CIRCUIT_BREAKER_MAX_MARGIN_EROSION_PCT = 25.0       # Tỷ lệ xói mòn biên lợi nhuận tối đa cho phép

# Anti-Gaming & Frequency Capping: Ngăn chặn khách dọa hủy để trục lợi khuyến mãi
ANTI_GAMING_COOLING_PERIOD_DAYS = 180              # Tối đa 1 ưu đãi tài chính / 6 tháng / khách
MAX_FINANCIAL_PROMO_PER_YEAR = 2

# Human-In-The-Loop (HITL) Allocation Ratio Targets
HITL_TARGETS = {
    "tier1_autonomous_pct": 80.0,   # Tự động hóa 80% (low-risk / zero-cost actions)
    "tier2_batch_review_pct": 15.0, # Duyệt gom theo lô 15% (mid-tier offers)
    "tier3_copilot_pct": 5.0,       # Chuyên viên CSM đàm phán 5% (VIP / High LTV)
}

# ==========================================
# 📊 CAUSAL INFERENCE & UPLIFT SEGMENTS
# ==========================================
UPLIFT_PERSUADABLE = "persuadable"    # Cứu được nếu có can thiệp (Target chính)
UPLIFT_SURE_THING = "sure_thing"      # Tự ở lại dù không can thiệp (Tránh lãng phí)
UPLIFT_LOST_CAUSE = "lost_cause"      # Rời đi dù có ưu đãi (Involuntary / Pause subscription)
UPLIFT_SLEEPING_DOG = "sleeping_dog"  # Nhắc tới là hủy ngay (Tuyệt đối không chạm)

# tier guardrails based on advanced business segments
GUARDRAILS = {
    "True_Friends_Elite": {
        "max_discount_pct": 40,
        "max_free_months": 2,
        "allowed_actions": ["vip_training", "dedicated_csm_audit", "discount"],
    },
    "True_Friends_Standard": {
        "max_discount_pct": 25,
        "max_free_months": 1,
        "allowed_actions": ["vip_training", "discount", "priority_support"],
    },
    "Butterflies_Whales": {
        "max_discount_pct": 30,
        "max_free_months": 0,
        "allowed_actions": ["loyalty_upgrade", "discount"],
    },
    "Butterflies_Standard": {
        "max_discount_pct": 15,
        "max_free_months": 0,
        "allowed_actions": ["loyalty_upgrade", "discount"],
    },
    "Barnacles_Whale": {
        "max_discount_pct": 20,
        "max_free_months": 1,
        "allowed_actions": ["dedicated_csm_audit", "enterprise_trial_unlock", "cross_sell_bundle"],
    },
    "Barnacles_Heavy": {
        "max_discount_pct": 0,
        "max_free_months": 0,
        "allowed_actions": ["pause_subscription", "no_action"],
    },
    "Barnacles_Standard": {
        "max_discount_pct": 5,
        "max_free_months": 0,
        "allowed_actions": ["pause_subscription", "feature_newsletter", "self_service_guide"],
    },
    "Strangers": {
        "max_discount_pct": 5,
        "max_free_months": 0,
        "allowed_actions": ["feature_newsletter", "email_only"],
    },
}

def assign_advanced_segment(ltv_pct: float, tenure_pct: float, is_tribe_leader: bool = False, is_enterprise_wallet: bool = False) -> str:
    """
    Map Data -> Business Strategy based on LTV Percentile, Tenure Percentile, Tribe Leader status, and Wallet Capacity.
    """
    if is_tribe_leader:
        return "True_Friends_Elite"
        
    if ltv_pct >= 0.8 and tenure_pct >= 0.8:
        return "True_Friends_Elite"
    if ltv_pct >= 0.5 and tenure_pct >= 0.5:
        return "True_Friends_Standard"
        
    if ltv_pct >= 0.8 and tenure_pct < 0.5:
        return "Butterflies_Whales"
    if ltv_pct >= 0.5 and tenure_pct < 0.5:
        return "Butterflies_Standard"
        
    # Barnacles Breakdown
    if ltv_pct < 0.5 and tenure_pct >= 0.7 and is_enterprise_wallet:
        return "Barnacles_Whale"
    if ltv_pct < 0.2 and tenure_pct >= 0.8:
        return "Barnacles_Heavy"
    if ltv_pct < 0.5 and tenure_pct >= 0.5:
        return "Barnacles_Standard"
        
    return "Strangers"

# rough cost estimation for actions
ACTION_COST_ESTIMATE = {
    "discount": lambda monthly_fee, discount_pct, free_months: monthly_fee * (discount_pct / 100),
    "vip_training": lambda monthly_fee, discount_pct, free_months: 20000, 
    "dedicated_csm_audit": lambda monthly_fee, discount_pct, free_months: 50000,
    "enterprise_trial_unlock": lambda monthly_fee, discount_pct, free_months: 10000,
    "cross_sell_bundle": lambda monthly_fee, discount_pct, free_months: 15000,
    "loyalty_upgrade": lambda monthly_fee, discount_pct, free_months: monthly_fee * 12 * (discount_pct / 100),
    "feature_newsletter": lambda monthly_fee, discount_pct, free_months: 0,
    "self_service_guide": lambda monthly_fee, discount_pct, free_months: 0,
    "pause_subscription": lambda monthly_fee, discount_pct, free_months: 0,
    "email_only": lambda monthly_fee, discount_pct, free_months: 500,
    "priority_support": lambda monthly_fee, discount_pct, free_months: 5000,
    "no_action": lambda monthly_fee, discount_pct, free_months: 0,
}

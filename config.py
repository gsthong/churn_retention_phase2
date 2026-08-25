import os
from pathlib import Path
from dotenv import load_dotenv

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

# holdout group to measure real roi
HOLDOUT_RATIO = 0.10
RANDOM_SEED = 42

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

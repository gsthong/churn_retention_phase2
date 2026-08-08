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

# Using OpenAI Codex (gpt-3.5-turbo/gpt-4)
RETRIEVER_MODEL = "gpt-3.5-turbo"
NEGOTIATOR_MODEL = "gpt-4o"
EXECUTION_MODEL = "gpt-4o"

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL")
ZALO_OA_TOKEN = os.environ.get("ZALO_OA_TOKEN")

# fallback to mock mode if no key provided
USE_MOCK = OPENAI_API_KEY is None

# holdout group to measure real roi
HOLDOUT_RATIO = 0.10
RANDOM_SEED = 42

# tier guardrails
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

TIER_PERCENTILES = {
    "VIP": 0.80,
    "Standard": 0.30,
    "Basic": 0.0,
}

# rough cost estimation for actions
ACTION_COST_ESTIMATE = {
    "discount": lambda monthly_fee, discount_pct, free_months: monthly_fee * (discount_pct / 100),
    "free_upgrade": lambda monthly_fee, discount_pct, free_months: monthly_fee * free_months,
    "priority_support": lambda monthly_fee, discount_pct, free_months: 20000, 
    "email_only": lambda monthly_fee, discount_pct, free_months: 500,
    "feature_education": lambda monthly_fee, discount_pct, free_months: 500,
    "no_action": lambda monthly_fee, discount_pct, free_months: 0,
}

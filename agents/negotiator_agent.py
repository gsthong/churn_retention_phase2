import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import GUARDRAILS, NEGOTIATOR_MODEL
from agents.llm_client import complete_json
from agents.data_retriever_agent import RetrievedProfile

SYSTEM_PROMPT = """Bạn là Strategic Negotiator Agent (hoặc AI Action Layer).
Dựa trên thông tin khách hàng, rủi ro, và LTV, đề xuất MỘT hành động giữ chân theo triết lý "Phantom Sale" và "CAC vs CRC arbitraging".
Mục tiêu là chốt sale giả lập để giữ lại doanh thu (LTV), đồng thời đảm bảo chi phí giữ chân (CRC) cực kỳ thấp để tối ưu Net Revenue Retained (NRR).

RÀNG BUỘC BẮT BUỘC:
{guardrail_text}

Trả lời DUY NHẤT bằng JSON:
{{
  "action_type": "<action_type>",
  "discount_pct": <số nguyên 0-100>,
  "free_months": <số nguyên >=0>,
  "reasoning": "<1-2 câu giải thích tại sao chọn action này theo triết lý CAC/CRC>"
}}
"""

def _rule_based_decision(tier: str, risk_score: float, sentiment: str, churn_category: str = "voluntary", churn_reason: str = "") -> dict:
    g = GUARDRAILS.get(tier, GUARDRAILS["Strangers"])

    # Involuntary churn safeguard: Do not waste marketing discount budget on unrecoverable moves/life events
    if churn_category == "involuntary" or any(k in churn_reason.lower() for k in ["moved", "deceased"]):
        return {
            "action_type": "pause_subscription" if "pause_subscription" in g["allowed_actions"] else "no_action",
            "discount_pct": 0,
            "free_months": 0,
            "reasoning": "Involuntary churn safeguard: Khách chuyển địa điểm/bất khả kháng, bảo toàn ngân sách và kích hoạt bảo lưu/Pause.",
        }

    if tier == "True_Friends_Elite":
        return {
            "action_type": "vip_training" if "vip_training" in g["allowed_actions"] else "discount",
            "discount_pct": g["max_discount_pct"] if risk_score >= 0.8 else g["max_discount_pct"] // 2,
            "free_months": g["max_free_months"] if risk_score >= 0.8 else 1,
            "reasoning": "Strategic review & VIP training (White-glove) cho High LTV.",
        }
    if tier == "True_Friends_Standard":
        return {
            "action_type": "vip_training" if "vip_training" in g["allowed_actions"] else "discount",
            "discount_pct": g["max_discount_pct"],
            "free_months": 0,
            "reasoning": "Strategic review & VIP training (White-glove) cho High LTV.",
        }
    if tier == "Butterflies_Whales":
        return {
            "action_type": "loyalty_upgrade" if "loyalty_upgrade" in g["allowed_actions"] else "discount",
            "discount_pct": 15 if "loyalty_upgrade" in g["allowed_actions"] else g["max_discount_pct"],
            "free_months": 0,
            "reasoning": "Commercial Play: Lock in capital with annual upgrade.",
        }
    if tier == "Butterflies_Standard":
        return {
            "action_type": "loyalty_upgrade" if "loyalty_upgrade" in g["allowed_actions"] else "discount",
            "discount_pct": 15 if "loyalty_upgrade" in g["allowed_actions"] else g["max_discount_pct"],
            "free_months": 0,
            "reasoning": "Commercial Play: Lock in capital with annual upgrade.",
        }
    if tier == "Barnacles_Whale":
        return {
            "action_type": "dedicated_csm_audit" if "dedicated_csm_audit" in g["allowed_actions"] else "enterprise_trial_unlock",
            "discount_pct": 15 if risk_score >= 0.8 else 10,
            "free_months": 1 if risk_score >= 0.8 else 0,
            "reasoning": "Whale Barnacle Play: Unlock enterprise audit & PoC trial to capture full wallet capacity.",
        }
    if tier == "Barnacles_Heavy":
        return {
            "action_type": "pause_subscription" if "pause_subscription" in g["allowed_actions"] else "no_action",
            "discount_pct": 0,
            "free_months": 0,
            "reasoning": "Draining resources. Offering Pause to keep in CRM without cost.",
        }
    if tier == "Barnacles_Standard":
        return {
            "action_type": "pause_subscription" if "pause_subscription" in g["allowed_actions"] else "feature_newsletter",
            "discount_pct": 0,
            "free_months": 0,
            "reasoning": "Low LTV. Offering Pause to retain safely.",
        }
    # Strangers
    return {
        "action_type": "feature_newsletter" if "feature_newsletter" in g["allowed_actions"] else g["allowed_actions"][0],
        "discount_pct": 0,
        "free_months": 0,
        "reasoning": "Zero-cost save: Automated feature nudge.",
    }

def _enforce_guardrail(decision: dict, tier: str) -> dict:
    g = GUARDRAILS.get(tier, GUARDRAILS["Strangers"])

    action_type = decision.get("action_type", "email_only")
    if action_type not in g["allowed_actions"]:
        action_type = g["allowed_actions"][0]

    discount_pct = int(decision.get("discount_pct", 0) or 0)
    discount_pct = max(0, min(discount_pct, g["max_discount_pct"]))

    free_months = int(decision.get("free_months", 0) or 0)
    free_months = max(0, min(free_months, g["max_free_months"]))

    return {
        "action_type": action_type,
        "discount_pct": discount_pct,
        "free_months": free_months,
        "reasoning": decision.get("reasoning", ""),
    }

@dataclass
class NegotiationDecision:
    customer_id: str
    action_type: str
    discount_pct: int
    free_months: int
    reasoning: str
    source: str

async def negotiate(
    customer_id: str, 
    tier: str, 
    ltv: float, 
    risk_score: float, 
    profile: RetrievedProfile, 
    ltv_pct: float = None, 
    tenure_pct: float = None,
    churn_category: str = "voluntary",
    churn_reason: str = ""
) -> NegotiationDecision:
    g = GUARDRAILS.get(tier, GUARDRAILS["Strangers"])
    guardrail_text = (
        f"- Tier: {tier}\n"
        f"- Max discount: {g['max_discount_pct']}%\n"
        f"- Max free months: {g['max_free_months']}\n"
        f"- Allowed actions: {', '.join(g['allowed_actions'])}"
    )

    system_prompt = SYSTEM_PROMPT.format(guardrail_text=guardrail_text)
    
    # Format percentiles for the prompt (e.g. 0.85 -> 85th percentile)
    ltv_rank_str = f"{int(ltv_pct * 100)}th percentile" if ltv_pct is not None else "Unknown"
    tenure_rank_str = f"{int(tenure_pct * 100)}th percentile" if tenure_pct is not None else "Unknown"

    user_prompt = (
        f"Customer Token: {customer_id}\n"
        f"Tier: {tier}\n"
        f"LTV Estimate: {ltv:,.0f} VND (Rank: {ltv_rank_str})\n"
        f"Tenure Rank: {tenure_rank_str}\n"
        f"Risk score: {risk_score}\n"
        f"Churn Category: {churn_category}\n"
        f"Churn Reason: {churn_reason}\n"
        f"Sentiment: {profile.sentiment}\n"
        f"Pain points: {', '.join(profile.pain_points)}\n"
        f"Summary: {profile.summary}\n"
    )

    # Resource Allocation Routing: LLM for High-Value & Strategic Whale Expansion
    if tier in ["True_Friends_Elite", "True_Friends_Standard", "Barnacles_Whale"] and churn_category != "involuntary":
        parsed = await complete_json(NEGOTIATOR_MODEL, system_prompt, user_prompt, max_tokens=400)
    else:
        parsed = None # Bypass LLM for Automated Nudge workflows or Involuntary Churn

    if parsed and "action_type" in parsed:
        decision = _enforce_guardrail(parsed, tier)
        source = "llm"
    else:
        decision = _enforce_guardrail(_rule_based_decision(tier, risk_score, profile.sentiment, churn_category, churn_reason), tier)
        source = "mock"

    return NegotiationDecision(
        customer_id=customer_id,
        action_type=decision["action_type"],
        discount_pct=decision["discount_pct"],
        free_months=decision["free_months"],
        reasoning=decision["reasoning"],
        source=source,
    )

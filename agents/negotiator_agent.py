import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import GUARDRAILS, NEGOTIATOR_MODEL
from agents.llm_client import complete_json
from agents.data_retriever_agent import RetrievedProfile

SYSTEM_PROMPT = """Bạn là Strategic Negotiator Agent.
Dựa trên thông tin khách hàng, đề xuất MỘT hành động giữ chân.

RÀNG BUỘC BẮT BUỘC:
{guardrail_text}

Trả lời DUY NHẤT bằng JSON:
{{
  "action_type": "<action_type>",
  "discount_pct": <số nguyên 0-100>,
  "free_months": <số nguyên >=0>,
  "reasoning": "<1-2 câu giải thích>"
}}
"""

def _rule_based_decision(tier: str, risk_score: float, sentiment: str) -> dict:
    g = GUARDRAILS[tier]

    if tier == "VIP" and risk_score >= 0.8:
        return {
            "action_type": "discount" if "discount" in g["allowed_actions"] else "priority_support",
            "discount_pct": g["max_discount_pct"],
            "free_months": g["max_free_months"],
            "reasoning": "High risk VIP, max discount.",
        }
    if tier == "VIP":
        return {
            "action_type": "discount",
            "discount_pct": g["max_discount_pct"] // 2,
            "free_months": 0,
            "reasoning": "Medium risk VIP, partial discount.",
        }
    if tier == "Standard" and sentiment in ("frustrated", "price_sensitive"):
        return {
            "action_type": "discount",
            "discount_pct": g["max_discount_pct"],
            "free_months": 0,
            "reasoning": "Standard tier, frustrated/price sensitive.",
        }
    if tier == "Standard":
        return {
            "action_type": "feature_education",
            "discount_pct": 0,
            "free_months": 0,
            "reasoning": "Standard tier, neutral.",
        }
    return {
        "action_type": "email_only" if "email_only" in g["allowed_actions"] else g["allowed_actions"][0],
        "discount_pct": 0,
        "free_months": 0,
        "reasoning": "Basic tier, low LTV.",
    }

def _enforce_guardrail(decision: dict, tier: str) -> dict:
    g = GUARDRAILS[tier]

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

async def negotiate(customer_id: str, tier: str, ltv: float, risk_score: float, profile: RetrievedProfile) -> NegotiationDecision:
    g = GUARDRAILS[tier]
    guardrail_text = (
        f"- Tier: {tier}\n"
        f"- Max discount: {g['max_discount_pct']}%\n"
        f"- Max free months: {g['max_free_months']}\n"
        f"- Allowed actions: {', '.join(g['allowed_actions'])}"
    )

    system_prompt = SYSTEM_PROMPT.format(guardrail_text=guardrail_text)
    user_prompt = (
        f"Customer: {customer_id}\n"
        f"Tier: {tier}\n"
        f"LTV: {ltv:,.0f}\n"
        f"Risk score: {risk_score}\n"
        f"Sentiment: {profile.sentiment}\n"
        f"Pain points: {', '.join(profile.pain_points)}\n"
        f"Summary: {profile.summary}\n"
    )

    parsed = await complete_json(NEGOTIATOR_MODEL, system_prompt, user_prompt, max_tokens=400)

    if parsed and "action_type" in parsed:
        decision = _enforce_guardrail(parsed, tier)
        source = "llm"
    else:
        decision = _enforce_guardrail(_rule_based_decision(tier, risk_score, profile.sentiment), tier)
        source = "mock"

    return NegotiationDecision(
        customer_id=customer_id,
        action_type=decision["action_type"],
        discount_pct=decision["discount_pct"],
        free_months=decision["free_months"],
        reasoning=decision["reasoning"],
        source=source,
    )

"""
negotiator_agent.py
--------------------
Đặc vụ đàm phán chiến lược (Strategic Critic / Negotiator Agent).

Đây là "bộ não" ra quyết định: dựa vào LTV, churn risk score, tier và tín hiệu
từ Data Retriever Agent, quyết định hành động giữ chân nào phù hợp nhất.

QUAN TRỌNG - Guardrail ("vòng kim cô"): dù LLM đề xuất gì, hàm _enforce_guardrail()
LUÔN LUÔN chạy sau cùng để ép giá trị về đúng giới hạn ngân sách cho phép theo tier
(config.GUARDRAILS). Đây chính là câu trả lời cho câu hỏi phản biện kinh điển:
"Làm sao đảm bảo Agent không giảm giá điên cuồng làm lỗ công ty?"
"""

import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import GUARDRAILS, NEGOTIATOR_MODEL
from agents.llm_client import complete_json
from agents.data_retriever_agent import RetrievedProfile

SYSTEM_PROMPT = """Bạn là Strategic Negotiator Agent trong hệ thống giữ chân khách hàng.
Bạn nhận thông tin về 1 khách hàng có nguy cơ rời bỏ cao và phải đề xuất MỘT hành động
giữ chân tối ưu, cân bằng giữa hiệu quả giữ chân và chi phí bỏ ra cho công ty.

RÀNG BUỘC BẮT BUỘC (guardrail ngân sách theo tier), bạn KHÔNG được vượt quá:
{guardrail_text}

action_type phải là một trong các giá trị được phép cho tier đó (allowed_actions).

Trả lời DUY NHẤT bằng JSON hợp lệ, không thêm chữ nào khác, theo đúng schema:
{{
  "action_type": "<discount | free_upgrade | priority_support | email_only | feature_education>",
  "discount_pct": <số nguyên 0-100, 0 nếu không áp dụng>,
  "free_months": <số nguyên >=0, 0 nếu không áp dụng>,
  "reasoning": "<1-2 câu giải thích ngắn gọn tại sao chọn hành động này>"
}}
"""

# Rule-based fallback: cây quyết định đơn giản dựa trên tier + risk score + sentiment
def _rule_based_decision(tier: str, risk_score: float, sentiment: str) -> dict:
    g = GUARDRAILS[tier]

    if tier == "VIP" and risk_score >= 0.8:
        return {
            "action_type": "discount" if "discount" in g["allowed_actions"] else "priority_support",
            "discount_pct": g["max_discount_pct"],
            "free_months": g["max_free_months"],
            "reasoning": "Khách VIP, rủi ro rất cao -> dùng hết ngân sách ưu đãi cho phép để giữ chân.",
        }
    if tier == "VIP":
        return {
            "action_type": "discount",
            "discount_pct": g["max_discount_pct"] // 2,
            "free_months": 0,
            "reasoning": "Khách VIP nhưng rủi ro ở mức trung bình -> ưu đãi vừa phải, tiết kiệm ngân sách.",
        }
    if tier == "Standard" and sentiment in ("frustrated", "price_sensitive"):
        return {
            "action_type": "discount",
            "discount_pct": g["max_discount_pct"],
            "free_months": 0,
            "reasoning": "Khách Standard đang bực bội/nhạy cảm giá -> giảm giá tối đa trong hạn mức cho phép.",
        }
    if tier == "Standard":
        return {
            "action_type": "feature_education",
            "discount_pct": 0,
            "free_months": 0,
            "reasoning": "Khách Standard, chưa có tín hiệu quá tiêu cực -> ưu tiên hướng dẫn tính năng, tiết kiệm chi phí.",
        }
    # Basic tier
    return {
        "action_type": "email_only" if "email_only" in g["allowed_actions"] else g["allowed_actions"][0],
        "discount_pct": 0,
        "free_months": 0,
        "reasoning": "Khách Basic, LTV thấp -> chỉ nhắc nhở/giáo dục tính năng, không tốn chi phí giảm giá.",
    }


def _enforce_guardrail(decision: dict, tier: str) -> dict:
    """Ép cứng mọi quyết định về đúng guardrail ngân sách của tier, bất kể LLM đề xuất gì."""
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
    source: str  # "llm" hoặc "mock"


def negotiate(customer_id: str, tier: str, ltv: float, risk_score: float, profile: RetrievedProfile) -> NegotiationDecision:
    g = GUARDRAILS[tier]
    guardrail_text = (
        f"- Tier: {tier}\n"
        f"- Giảm giá tối đa: {g['max_discount_pct']}%\n"
        f"- Số tháng miễn phí tối đa: {g['max_free_months']}\n"
        f"- Hành động được phép: {', '.join(g['allowed_actions'])}"
    )

    system_prompt = SYSTEM_PROMPT.format(guardrail_text=guardrail_text)
    user_prompt = (
        f"Khách hàng: {customer_id}\n"
        f"Tier: {tier}\n"
        f"LTV ước tính: {ltv:,.0f} VND\n"
        f"Churn risk score: {risk_score}\n"
        f"Sentiment (từ Data Retriever Agent): {profile.sentiment}\n"
        f"Pain points: {', '.join(profile.pain_points)}\n"
        f"Tóm tắt tình trạng: {profile.summary}\n"
    )

    parsed = complete_json(NEGOTIATOR_MODEL, system_prompt, user_prompt, max_tokens=400)

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

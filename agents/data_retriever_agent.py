import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import LOG_DIR, RETRIEVER_MODEL
from agents.llm_client import complete_json

SYSTEM_PROMPT = """Bạn là một Data Retriever Agent.
Nhiệm vụ của bạn là đọc log và trích xuất tín hiệu, KHÔNG đề xuất hành động.

Trả lời DUY NHẤT bằng JSON:
{
  "pain_points": ["<tối đa 3 vấn đề>"],
  "sentiment": "<frustrated | neutral | silent | price_sensitive>",
  "summary": "<tóm tắt 1 câu>"
}
"""

KEYWORD_MAP = {
    "technical_issue": ["lag", "chậm", "văng", "chập chờn", "kết nối", "mạng"],
    "billing_complaint": ["trừ tiền", "hóa đơn", "phí", "phụ phí"],
    "competitor_mention": ["đối thủ", "nhà mạng khác", "chuyển qua", "khuyến mãi khủng"],
    "feature_confusion": ["hướng dẫn", "không biết cách", "khó dùng", "giao diện"],
    "silence": ["không có hoạt động", "không phát sinh", "không mở app"],
    "price_sensitive_but_positive": ["giá hơi cao", "chi tiêu eo hẹp", "cân nhắc cắt giảm"],
}

CATEGORY_TO_SENTIMENT = {
    "technical_issue": "frustrated",
    "billing_complaint": "frustrated",
    "competitor_mention": "price_sensitive",
    "feature_confusion": "neutral",
    "silence": "silent",
    "price_sensitive_but_positive": "price_sensitive",
}

CATEGORY_TO_PAIN_POINT_VI = {
    "technical_issue": "Sự cố kỹ thuật / kết nối",
    "billing_complaint": "Thắc mắc hóa đơn/phí",
    "competitor_mention": "Cân nhắc đối thủ",
    "feature_confusion": "Khó sử dụng",
    "silence": "Ít hoạt động",
    "price_sensitive_but_positive": "Nhạy cảm giá",
}

@dataclass
class RetrievedProfile:
    customer_id: str
    pain_points: list = field(default_factory=list)
    sentiment: str = "neutral"
    summary: str = ""
    source: str = "mock"

def _read_log(customer_id: str) -> str:
    log_path = LOG_DIR / f"{customer_id}.txt"
    if not log_path.exists():
        return ""
    return log_path.read_text(encoding="utf-8")

def _rule_based_extract(customer_id: str, raw_log: str) -> RetrievedProfile:
    categories_found = re.findall(r"\((\w+)\)", raw_log)
    if not categories_found:
        categories_found = [
            cat for cat, kws in KEYWORD_MAP.items() if any(kw in raw_log.lower() for kw in kws)
        ] or ["silence"]

    pain_points = list({CATEGORY_TO_PAIN_POINT_VI.get(c, c) for c in categories_found})[:3]
    primary_cat = categories_found[0]
    sentiment = CATEGORY_TO_SENTIMENT.get(primary_cat, "neutral")
    summary = f"Tín hiệu nổi bật: {pain_points[0] if pain_points else 'N/A'}"

    return RetrievedProfile(
        customer_id=customer_id,
        pain_points=pain_points,
        sentiment=sentiment,
        summary=summary,
        source="mock",
    )

def retrieve(customer_id: str) -> RetrievedProfile:
    raw_log = _read_log(customer_id)
    if not raw_log:
        return RetrievedProfile(
            customer_id=customer_id,
            pain_points=["No data"],
            sentiment="silent",
            summary="No log found.",
            source="mock",
        )

    user_prompt = f"Log: {customer_id}:\n\n{raw_log}"
    parsed = complete_json(RETRIEVER_MODEL, SYSTEM_PROMPT, user_prompt, max_tokens=300)

    if parsed and "pain_points" in parsed:
        return RetrievedProfile(
            customer_id=customer_id,
            pain_points=parsed.get("pain_points", [])[:3],
            sentiment=parsed.get("sentiment", "neutral"),
            summary=parsed.get("summary", ""),
            source="llm",
        )

    return _rule_based_extract(customer_id, raw_log)

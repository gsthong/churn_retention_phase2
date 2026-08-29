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
    "technical_issue": ["lag", "chậm", "văng", "chập chờn", "kết nối", "mạng", "rớt", "modem"],
    "billing_complaint": ["trừ tiền", "hóa đơn", "phí", "phụ phí", "cước", "đắt", "vượt gói"],
    "competitor_mention": ["đối thủ", "nhà mạng khác", "chuyển qua", "khuyến mãi khủng", "bên kia", "500mbps", "wifi 6"],
    "support_dissatisfaction": ["tổng đài", "thái độ", "kỹ thuật viên", "khiếu nại", "thờ ơ", "không nghe máy", "bảo trì"],
    "feature_confusion": ["hướng dẫn", "không biết cách", "khó dùng", "giao diện", "tự đổi gói", "app"],
    "relocation": ["chuyển nhà", "chuyển địa điểm", "công tác", "tỉnh khác"],
    "deceased": ["qua đời", "mất", "người thân", "thanh lý"],
    "silence": ["không có hoạt động", "không phát sinh", "không mở app", "ít nhu cầu"],
    "price_sensitive_but_positive": ["giá hơi cao", "chi tiêu eo hẹp", "cân nhắc cắt giảm", "vừa túi tiền"],
}

CATEGORY_TO_SENTIMENT = {
    "technical_issue": "frustrated",
    "billing_complaint": "frustrated",
    "support_dissatisfaction": "frustrated",
    "competitor_mention": "price_sensitive",
    "feature_confusion": "neutral",
    "relocation": "neutral",
    "deceased": "neutral",
    "silence": "silent",
    "price_sensitive_but_positive": "price_sensitive",
}

CATEGORY_TO_PAIN_POINT_VI = {
    "technical_issue": "Sự cố kỹ thuật / kết nối",
    "billing_complaint": "Thắc mắc hóa đơn / cước phí",
    "support_dissatisfaction": "Chất lượng CSKH / hỗ trợ",
    "competitor_mention": "Cân nhắc gói cước đối thủ",
    "feature_confusion": "Khó sử dụng giao diện / tính năng",
    "relocation": "Chuyển địa điểm / công tác",
    "deceased": "Thủ tục thanh lý hợp đồng",
    "silence": "Ít hoạt động / không tương tác",
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

async def retrieve(customer_id: str) -> RetrievedProfile:
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
    parsed = await complete_json(RETRIEVER_MODEL, SYSTEM_PROMPT, user_prompt, max_tokens=300)

    if parsed and "pain_points" in parsed:
        return RetrievedProfile(
            customer_id=customer_id,
            pain_points=parsed.get("pain_points", [])[:3],
            sentiment=parsed.get("sentiment", "neutral"),
            summary=parsed.get("summary", ""),
            source="llm",
        )

    return _rule_based_extract(customer_id, raw_log)

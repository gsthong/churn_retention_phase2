"""
data_retriever_agent.py
------------------------
Đặc vụ thu thập (Data Retriever Agent).

Nhiệm vụ: đọc log tương tác thô (support ticket, hành vi sử dụng) của 1 khách
hàng, rồi trích xuất ra tín hiệu có cấu trúc: khách đang gặp vấn đề gì, thái độ
ra sao. Đây là tác vụ đọc-hiểu đơn giản nên dùng model rẻ (Haiku) để tối ưu chi phí.
"""

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import LOG_DIR, RETRIEVER_MODEL
from agents.llm_client import complete_json

SYSTEM_PROMPT = """Bạn là một Data Retriever Agent trong hệ thống giữ chân khách hàng.
Nhiệm vụ của bạn CHỈ là đọc log thô và trích xuất tín hiệu, KHÔNG được đề xuất
hành động hay khuyến mãi gì cả (đó là việc của agent khác).

Trả lời DUY NHẤT bằng JSON hợp lệ, không thêm chữ nào khác, theo đúng schema:
{
  "pain_points": ["<tối đa 3 vấn đề chính, ngắn gọn>"],
  "sentiment": "<một trong: frustrated, neutral, silent, price_sensitive>",
  "summary": "<tóm tắt 1 câu về tình trạng khách hàng>"
}
"""

# Rule-based fallback keyword map (dùng khi không có LLM)
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
    "technical_issue": "Gặp sự cố kỹ thuật / kết nối không ổn định",
    "billing_complaint": "Thắc mắc hoặc không hài lòng về hóa đơn/phí",
    "competitor_mention": "Đang cân nhắc chuyển sang đối thủ vì giá",
    "feature_confusion": "Khó sử dụng / chưa hiểu tính năng mới",
    "silence": "Không còn hoạt động, có dấu hiệu rời bỏ âm thầm",
    "price_sensitive_but_positive": "Hài lòng về dịch vụ nhưng nhạy cảm về giá",
}


@dataclass
class RetrievedProfile:
    customer_id: str
    pain_points: list = field(default_factory=list)
    sentiment: str = "neutral"
    summary: str = ""
    source: str = "mock"  # "llm" hoặc "mock"


def _read_log(customer_id: str) -> str:
    log_path = LOG_DIR / f"{customer_id}.txt"
    if not log_path.exists():
        return ""
    return log_path.read_text(encoding="utf-8")


def _rule_based_extract(customer_id: str, raw_log: str) -> RetrievedProfile:
    """Fallback không cần LLM: bắt category có sẵn trong log (định dạng do generate_logs.py sinh ra)."""
    categories_found = re.findall(r"\((\w+)\)", raw_log)
    if not categories_found:
        # fallback siêu đơn giản: quét từ khóa thô
        categories_found = [
            cat for cat, kws in KEYWORD_MAP.items() if any(kw in raw_log.lower() for kw in kws)
        ] or ["silence"]

    pain_points = list({CATEGORY_TO_PAIN_POINT_VI.get(c, c) for c in categories_found})[:3]
    primary_cat = categories_found[0]
    sentiment = CATEGORY_TO_SENTIMENT.get(primary_cat, "neutral")
    summary = f"Khách hàng có {len(categories_found)} tín hiệu gần đây, nổi bật: {pain_points[0] if pain_points else 'không rõ'}."

    return RetrievedProfile(
        customer_id=customer_id,
        pain_points=pain_points,
        sentiment=sentiment,
        summary=summary,
        source="mock",
    )


def retrieve(customer_id: str) -> RetrievedProfile:
    """Entry point chính của Data Retriever Agent."""
    raw_log = _read_log(customer_id)
    if not raw_log:
        return RetrievedProfile(
            customer_id=customer_id,
            pain_points=["Không có dữ liệu tương tác gần đây"],
            sentiment="silent",
            summary="Không tìm thấy log tương tác nào cho khách hàng này.",
            source="mock",
        )

    user_prompt = f"Log tương tác thô của khách hàng {customer_id}:\n\n{raw_log}"
    parsed = complete_json(RETRIEVER_MODEL, SYSTEM_PROMPT, user_prompt, max_tokens=300)

    if parsed and "pain_points" in parsed:
        return RetrievedProfile(
            customer_id=customer_id,
            pain_points=parsed.get("pain_points", [])[:3],
            sentiment=parsed.get("sentiment", "neutral"),
            summary=parsed.get("summary", ""),
            source="llm",
        )

    # Fallback rule-based nếu không có LLM hoặc parse JSON thất bại
    return _rule_based_extract(customer_id, raw_log)

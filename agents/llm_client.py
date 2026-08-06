"""
llm_client.py
-------------
Wrapper gọi Anthropic API dùng chung cho cả 3 agent.

Nếu không tìm thấy biến môi trường ANTHROPIC_API_KEY, hệ thống tự động chạy
MOCK MODE (không gọi mạng, không tốn phí) - mỗi agent sẽ tự có logic rule-based
fallback riêng để demo vẫn chạy mượt mà không cần API key.
"""

import json
import sys
from pathlib import Path

from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import USE_MOCK, ANTHROPIC_API_KEY

_client = None
if not USE_MOCK:
    try:
        from anthropic import Anthropic, APIConnectionError, RateLimitError, APIStatusError

        _client = Anthropic(api_key=ANTHROPIC_API_KEY)
        RETRY_EXCEPTIONS = (APIConnectionError, RateLimitError, APIStatusError)
    except ImportError:
        print("[WARN] Chưa cài package `anthropic` (pip install anthropic). Chuyển sang MOCK MODE.")
        _client = None
        RETRY_EXCEPTIONS = (Exception,)
else:
    RETRY_EXCEPTIONS = (Exception,)


def is_live() -> bool:
    """True nếu đang gọi API thật, False nếu đang mock."""
    return _client is not None


@retry(
    retry=retry_if_exception_type(RETRY_EXCEPTIONS),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    reraise=True
)
def _call_api_with_retry(model: str, system: str, user_prompt: str, max_tokens: int) -> str:
    response = _client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text

def complete(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> str | None:
    """
    Gọi Claude. Trả về text response, hoặc None nếu đang ở mock mode / lỗi
    (agent gọi hàm này phải tự xử lý fallback khi nhận None).
    """
    if _client is None:
        return None

    try:
        return _call_api_with_retry(model, system, user_prompt, max_tokens)
    except Exception as e:  # noqa: BLE001 - demo project, log và fallback về mock
        print(f"[WARN] Lỗi khi gọi Anthropic API ({model}) sau nhiều lần thử: {e}. Dùng fallback rule-based.")
        return None


def complete_json(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> dict | None:
    """Giống complete(), nhưng cố gắng parse response thành JSON. Trả về None nếu thất bại."""
    text = complete(model, system, user_prompt, max_tokens=max_tokens)
    if text is None:
        return None
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"[WARN] Không parse được JSON từ model, raw response:\n{text}\nDùng fallback rule-based.")
        return None

import json
import sys
from pathlib import Path
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import USE_MOCK, OPENAI_API_KEY

_client = None
if not USE_MOCK:
    try:
        from openai import OpenAI, APIConnectionError, RateLimitError, APIStatusError
        _client = OpenAI(api_key=OPENAI_API_KEY)
        RETRY_EXCEPTIONS = (APIConnectionError, RateLimitError, APIStatusError)
    except ImportError:
        print("[WARN] Missing openai package. Falling back to mock mode.")
        _client = None
        RETRY_EXCEPTIONS = (Exception,)
else:
    RETRY_EXCEPTIONS = (Exception,)

def is_live() -> bool:
    return _client is not None

@retry(
    retry=retry_if_exception_type(RETRY_EXCEPTIONS),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    reraise=True
)
def _call_api_with_retry(model: str, system: str, user_prompt: str, max_tokens: int) -> str:
    response = _client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

def complete(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> str | None:
    if _client is None:
        return None

    try:
        return _call_api_with_retry(model, system, user_prompt, max_tokens)
    except Exception as e:
        print(f"[WARN] OpenAI API error: {e}. Using rule-based fallback.")
        return None

def complete_json(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> dict | None:
    text = complete(model, system, user_prompt, max_tokens=max_tokens)
    if text is None:
        return None
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"[WARN] JSON decode failed, raw text:\n{text}\nUsing fallback.")
        return None

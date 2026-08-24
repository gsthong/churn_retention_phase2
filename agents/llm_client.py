import json
import re
import sys
import asyncio
from pathlib import Path
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import USE_MOCK, OPENAI_API_KEY, OPENROUTER_API_KEY, OPENROUTER_BASE_URL

_client = None
if not USE_MOCK:
    try:
        from openai import AsyncOpenAI, APIConnectionError, RateLimitError, APIStatusError
        if OPENROUTER_API_KEY:
            _client = AsyncOpenAI(
                api_key=OPENROUTER_API_KEY,
                base_url=OPENROUTER_BASE_URL,
                default_headers={
                    "HTTP-Referer": "https://github.com/churn_retention_phase2",
                    "X-Title": "Churn Retention Phase 2",
                }
            )
        elif OPENAI_API_KEY:
            _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
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
    wait=wait_exponential(multiplier=1, min=2, max=6),
    stop=stop_after_attempt(2),
    reraise=True
)
async def _call_api_with_retry(model: str, system: str, user_prompt: str, max_tokens: int) -> str:
    response = await _client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=max_tokens,
        timeout=25.0
    )
    return response.choices[0].message.content

async def complete(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> str | None:
    if _client is None:
        await asyncio.sleep(0.01) # Mock async latency
        return None

    try:
        return await _call_api_with_retry(model, system, user_prompt, max_tokens)
    except Exception as e:
        print(f"[WARN] OpenAI API error: {e}. Using rule-based fallback.")
        return None

async def complete_json(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> dict | None:
    text = await complete(model, system, user_prompt, max_tokens=max_tokens)
    if text is None:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        print(f"[WARN] JSON decode failed, raw text:\n{text}\nUsing fallback.")
        return None

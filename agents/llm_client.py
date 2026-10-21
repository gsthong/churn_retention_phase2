import json
import re
import sys
import asyncio
from pathlib import Path
from typing import List, Optional

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import (
    USE_MOCK, 
    GROQ_API_KEYS, 
    GROQ_BASE_URL, 
    OPENROUTER_API_KEYS, 
    OPENROUTER_BASE_URL, 
    OPENAI_API_KEY
)

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

class MultiKeyLLMPool:
    def __init__(self):
        self.groq_clients: List[AsyncOpenAI] = []
        self.openrouter_clients: List[AsyncOpenAI] = []
        self.openai_client: Optional[AsyncOpenAI] = None
        self._groq_idx = 0
        self._or_idx = 0

        if AsyncOpenAI is not None:
            # Initialize Groq clients (Primary High-Speed)
            for k in GROQ_API_KEYS:
                try:
                    self.groq_clients.append(AsyncOpenAI(api_key=k, base_url=GROQ_BASE_URL))
                except Exception as e:
                    print(f"[WARN] Error initializing Groq client: {e}")

            # Initialize OpenRouter clients (Secondary Fallback)
            for k in OPENROUTER_API_KEYS:
                try:
                    self.openrouter_clients.append(
                        AsyncOpenAI(
                            api_key=k, 
                            base_url=OPENROUTER_BASE_URL,
                            default_headers={
                                "HTTP-Referer": "https://github.com/churn_retention_phase2",
                                "X-Title": "Churn Retention Phase 2",
                            }
                        )
                    )
                except Exception as e:
                    print(f"[WARN] Error initializing OpenRouter client: {e}")

            if OPENAI_API_KEY:
                try:
                    self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
                except Exception:
                    pass

    def is_available(self) -> bool:
        return bool(self.groq_clients or self.openrouter_clients or self.openai_client)

    def _get_next_groq(self) -> Optional[AsyncOpenAI]:
        if not self.groq_clients:
            return None
        client = self.groq_clients[self._groq_idx % len(self.groq_clients)]
        self._groq_idx += 1
        return client

    def _get_next_openrouter(self) -> Optional[AsyncOpenAI]:
        if not self.openrouter_clients:
            return None
        client = self.openrouter_clients[self._or_idx % len(self.openrouter_clients)]
        self._or_idx += 1
        return client

    async def call_completion(self, model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> Optional[str]:
        if not self.is_available():
            await asyncio.sleep(0.01)
            return None

        # 1. Try Groq Pool First (Fastest & high RPM)
        if self.groq_clients:
            groq_model = "qwen/qwen3.6-27b"
            dead_clients = []

            for client in list(self.groq_clients):
                try:
                    resp = await client.chat.completions.create(
                        model=groq_model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user_prompt}
                        ],
                        max_tokens=max_tokens,
                        temperature=0.2,
                        timeout=12.0
                    )
                    content = resp.choices[0].message.content or ""
                    # Strip <think>...</think> reasoning tags if present
                    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
                    return content
                except Exception as e:
                    err_msg = str(e)
                    if "401" in err_msg or "invalid_api_key" in err_msg.lower():
                        dead_clients.append(client)
                    elif "429" in err_msg or "rate_limit" in err_msg.lower():
                        await asyncio.sleep(0.1)
                    else:
                        print(f"[WARN] Groq key error: {err_msg[:90]}... Rotating.")

            for dc in dead_clients:
                if dc in self.groq_clients:
                    self.groq_clients.remove(dc)

        # 2. Fallback to OpenRouter Pool
        if self.openrouter_clients:
            or_model = "openrouter/free"
            dead_or = []

            for client in list(self.openrouter_clients):
                try:
                    resp = await client.chat.completions.create(
                        model=or_model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user_prompt}
                        ],
                        max_tokens=max_tokens,
                        timeout=20.0
                    )
                    return resp.choices[0].message.content
                except Exception as e:
                    err_msg = str(e)
                    if "401" in err_msg or "user not found" in err_msg.lower():
                        dead_or.append(client)
                    elif "429" in err_msg:
                        await asyncio.sleep(0.2)
                    continue

            for dc in dead_or:
                if dc in self.openrouter_clients:
                    self.openrouter_clients.remove(dc)

        if not self.groq_clients and not self.openrouter_clients and not getattr(self, "_warned_fallback", False):
            self._warned_fallback = True
            print("[INFO] Không có API Key LLM hợp lệ hoặc đã hết hạn. Hệ thống tự động chuyển sang chế độ Rule-Based / Template Engine (Tốc độ cao & chuẩn xác).")

        return None

_pool = MultiKeyLLMPool()

def is_live() -> bool:
    return _pool.is_available()

async def complete(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> Optional[str]:
    try:
        return await _pool.call_completion(model, system, user_prompt, max_tokens)
    except Exception as e:
        print(f"[WARN] Multi-Key LLM completion fallback: {e}")
        return None

async def complete_json(model: str, system: str, user_prompt: str, max_tokens: int = 1024) -> Optional[dict]:
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
        return None

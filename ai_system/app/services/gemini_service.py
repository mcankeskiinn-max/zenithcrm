import base64
from typing import Any, Dict, List

import httpx

from app.core.config import settings


class GeminiService:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=60.0)

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        url = f"{settings.gemini_api_base}/models/{settings.gemini_embedding_model}:batchEmbedContents"
        payload = {
            "requests": [
                {"model": f"models/{settings.gemini_embedding_model}", "content": {"parts": [{"text": t}]}}
                for t in texts
            ]
        }
        headers = {"x-goog-api-key": settings.gemini_api_key}
        response = await self._client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return [item["embedding"]["values"] for item in data.get("embeddings", [])]

    async def analyze_image(self, image_bytes: bytes, prompt: str) -> str:
        url = f"{settings.gemini_api_base}/models/{settings.gemini_flash_model}:generateContent"
        encoded = base64.b64encode(image_bytes).decode("ascii")
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": encoded}},
                    ],
                }
            ]
        }
        headers = {"x-goog-api-key": settings.gemini_api_key}
        response = await self._client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(part.get("text", "") for part in parts)

    async def generate_answer(self, prompt: str) -> str:
        url = f"{settings.gemini_api_base}/models/{settings.gemini_flash_model}:generateContent"
        payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
        headers = {"x-goog-api-key": settings.gemini_api_key}
        response = await self._client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(part.get("text", "") for part in parts)

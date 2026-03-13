from typing import List

from fastapi import Depends

from app.core.config import settings
from app.models.schemas import AssistantContextItem, AssistantRequest, AssistantResponse
from app.services.document_service import DocumentService
from app.services.gcs_service import GcsService
from app.services.gemini_service import GeminiService


class RagService:
    def __init__(self, gemini: GeminiService, documents: DocumentService, gcs: GcsService) -> None:
        self._gemini = gemini
        self._documents = documents
        self._gcs = gcs

    @classmethod
    def from_request(cls) -> "RagService":
        return cls(GeminiService(), DocumentService(), GcsService())

    async def answer(self, payload: AssistantRequest) -> AssistantResponse:
        embeddings = await self._gemini.embed_texts([payload.query])
        if not embeddings:
            return AssistantResponse(answer="Embedding uretilemedi.", context=[])
        matches = await self._documents.search_similar(
            embeddings[0],
            source_type=None,
            limit=settings.max_context_chunks,
        )
        context_items: List[AssistantContextItem] = []
        context_texts: List[str] = []
        for match in matches:
            gcs_path = match.get("gcs_path")
            if gcs_path:
                signed = self._gcs.generate_signed_url(gcs_path)
            else:
                signed = None
            context_items.append(
                AssistantContextItem(
                    source_type=match["source_type"],
                    source_id=str(match["source_id"]),
                    snippet=match["content"][:500],
                    gcs_path=signed,
                    score=float(match["score"]),
                )
            )
            context_texts.append(f"[{match['source_type']}:{match['source_id']}] {match['content']}")

        prompt = self._build_prompt(payload, context_texts)
        answer = await self._gemini.generate_answer(prompt)
        return AssistantResponse(answer=answer, context=context_items)

    def _build_prompt(self, payload: AssistantRequest, context_texts: List[str]) -> str:
        history_text = "\n".join(f"{msg.role}: {msg.content}" for msg in payload.history)
        context_block = "\n".join(context_texts)
        return (
            "Sen ZenithCRM sigorta asistanisin. Kullanici sorusunu, paylasilan baglam ile cevapla.\n"
            "Eger baglam yeterli degilse bunu belirt.\n\n"
            f"Baglam:\n{context_block}\n\n"
            f"Onceki Konusma:\n{history_text}\n\n"
            f"Soru: {payload.query}\n"
            "Cevap:"
        )

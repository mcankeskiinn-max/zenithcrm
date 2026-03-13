import base64
import io
import json
import os
from typing import Any, Dict, Tuple
from uuid import UUID, uuid4

from fastapi import Depends
from pypdf import PdfReader

from app.core.config import settings
from app.models.schemas import PubSubMessage
from app.services.document_service import DocumentService
from app.services.gcs_service import GcsService
from app.services.gemini_service import GeminiService
from app.utils.vector import chunk_text


class PipelineService:
    def __init__(self, gemini: GeminiService, documents: DocumentService, gcs: GcsService) -> None:
        self._gemini = gemini
        self._documents = documents
        self._gcs = gcs

    @classmethod
    def from_request(cls) -> "PipelineService":
        return cls(GeminiService(), DocumentService(), GcsService())

    async def process_pubsub_message(self, message: PubSubMessage) -> Dict[str, Any]:
        payload = self._decode_pubsub_payload(message.data)
        bucket = payload.get("bucket")
        name = payload.get("name")
        if not bucket or not name:
            return {"status": "ignored", "object_path": None, "processed_chunks": 0, "details": payload}

        source_type, source_id = self._infer_source(name)
        file_bytes = self._gcs.download_bytes(name)
        extension = os.path.splitext(name.lower())[1]

        if extension == ".pdf":
            return await self._process_pdf(name, file_bytes, source_type, source_id)

        return await self._process_image(name, file_bytes, source_type, source_id)

    async def _process_pdf(
        self,
        object_path: str,
        file_bytes: bytes,
        source_type: str,
        source_id: str,
    ) -> Dict[str, Any]:
        text = self._extract_pdf_text(file_bytes)
        chunks = chunk_text(text, settings.max_chunk_chars)
        embeddings = await self._gemini.embed_texts(chunks)
        inserted = await self._documents.insert_embeddings(
            source_type=source_type,
            source_id=source_id,
            gcs_path=object_path,
            content_chunks=chunks,
            embeddings=embeddings,
            metadata={"content_type": "pdf"},
        )
        if source_type == "policy":
            await self._documents.upsert_policy_document_path(source_id, object_path)
        return {"status": "processed", "object_path": object_path, "processed_chunks": inserted, "details": {}}

    async def _process_image(
        self,
        object_path: str,
        file_bytes: bytes,
        source_type: str,
        source_id: str,
    ) -> Dict[str, Any]:
        prompt = (
            "Hasar goruntusunu analiz et. Hasar seviyesi, parca bilgisi, arac rengi, "
            "arac tipi ve goruntuyle ilgili diger ayirt edici bilgileri cikar."
        )
        analysis = await self._gemini.analyze_image(file_bytes, prompt)
        embeddings = await self._gemini.embed_texts([analysis])
        inserted = await self._documents.insert_embeddings(
            source_type=source_type,
            source_id=source_id,
            gcs_path=object_path,
            content_chunks=[analysis],
            embeddings=embeddings,
            metadata={"content_type": "image_analysis"},
        )
        if source_type == "claim":
            await self._documents.attach_claim_image(source_id, object_path)
        return {"status": "processed", "object_path": object_path, "processed_chunks": inserted, "details": {}}

    def _decode_pubsub_payload(self, data: str) -> Dict[str, Any]:
        decoded = base64.b64decode(data).decode("utf-8")
        return json.loads(decoded)

    def _infer_source(self, object_path: str) -> Tuple[str, str]:
        parts = object_path.split("/")
        if len(parts) >= 2 and parts[0] in {"policies", "claims"}:
            source_type = "policy" if parts[0] == "policies" else "claim"
            source_id = parts[1]
            try:
                UUID(source_id)
                return source_type, source_id
            except ValueError:
                pass
        return "document", str(uuid4())

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

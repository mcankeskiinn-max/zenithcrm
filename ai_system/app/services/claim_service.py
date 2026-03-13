from typing import List

from fastapi import Depends

from app.db.pool import get_pool
from app.models.schemas import ClaimResult
from app.services.document_service import DocumentService
from app.services.gcs_service import GcsService
from app.services.gemini_service import GeminiService


class ClaimService:
    def __init__(self, gemini: GeminiService, documents: DocumentService, gcs: GcsService) -> None:
        self._gemini = gemini
        self._documents = documents
        self._gcs = gcs

    @classmethod
    def from_request(cls) -> "ClaimService":
        return cls(GeminiService(), DocumentService(), GcsService())

    async def semantic_search(self, query: str, limit: int) -> List[ClaimResult]:
        embeddings = await self._gemini.embed_texts([query])
        if not embeddings:
            return []
        matches = await self._documents.search_similar(embeddings[0], source_type="claim", limit=limit)
        pool = await get_pool()
        claim_ids = [row["source_id"] for row in matches]
        if not claim_ids:
            return []
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, claim_number, policy_id, incident_date, status, image_gcs_paths
                FROM claims
                WHERE id = ANY($1::uuid[])
                """,
                claim_ids,
            )
        row_map = {str(row["id"]): row for row in rows}
        results: List[ClaimResult] = []
        for match in matches:
            row = row_map.get(str(match["source_id"]))
            if not row:
                continue
            image_paths = row["image_gcs_paths"] or []
            signed_urls = [self._gcs.generate_signed_url(path) for path in image_paths]
            results.append(
                ClaimResult(
                    id=str(row["id"]),
                    claim_number=row["claim_number"],
                    policy_id=str(row["policy_id"]) if row["policy_id"] else None,
                    incident_date=row["incident_date"],
                    status=row["status"],
                    image_urls=signed_urls,
                    score=float(match["score"]),
                )
            )
        return results

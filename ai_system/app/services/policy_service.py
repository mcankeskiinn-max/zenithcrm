from typing import List

from fastapi import Depends

from app.db.pool import get_pool
from app.models.schemas import PolicyResult
from app.services.document_service import DocumentService
from app.services.gcs_service import GcsService
from app.services.gemini_service import GeminiService


class PolicyService:
    def __init__(self, gemini: GeminiService, documents: DocumentService, gcs: GcsService) -> None:
        self._gemini = gemini
        self._documents = documents
        self._gcs = gcs

    @classmethod
    def from_request(cls) -> "PolicyService":
        return cls(GeminiService(), DocumentService(), GcsService())

    async def semantic_search(self, query: str, limit: int) -> List[PolicyResult]:
        embeddings = await self._gemini.embed_texts([query])
        if not embeddings:
            return []
        matches = await self._documents.search_similar(embeddings[0], source_type="policy", limit=limit)
        pool = await get_pool()
        policy_ids = [row["source_id"] for row in matches]
        if not policy_ids:
            return []
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, policy_number, policy_type, limit_amount, coverage_summary, document_gcs_path
                FROM policies
                WHERE id = ANY($1::uuid[])
                """,
                policy_ids,
            )
        row_map = {str(row["id"]): row for row in rows}
        results: List[PolicyResult] = []
        for match in matches:
            row = row_map.get(str(match["source_id"]))
            if not row:
                continue
            url = self._gcs.generate_signed_url(row["document_gcs_path"]) if row["document_gcs_path"] else None
            results.append(
                PolicyResult(
                    id=str(row["id"]),
                    policy_number=row["policy_number"],
                    policy_type=row["policy_type"],
                    limit_amount=float(row["limit_amount"]) if row["limit_amount"] is not None else None,
                    coverage_summary=row["coverage_summary"],
                    document_url=url,
                    score=float(match["score"]),
                )
            )
        return results

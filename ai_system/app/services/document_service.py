from typing import Any, Dict, Iterable, List, Optional

from app.core.config import settings
from app.db.pool import get_pool
from app.utils.vector import to_pgvector


class DocumentService:
    async def insert_embeddings(
        self,
        source_type: str,
        source_id: str,
        gcs_path: str,
        content_chunks: Iterable[str],
        embeddings: Iterable[List[float]],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        metadata = metadata or {}
        records = list(zip(content_chunks, embeddings))
        if not records:
            return 0
        pool = await get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                for content, vector in records:
                    await conn.execute(
                        """
                        INSERT INTO document_embeddings
                            (source_type, source_id, gcs_path, content, metadata, embedding)
                        VALUES ($1, $2, $3, $4, $5, $6::vector)
                        """,
                        source_type,
                        source_id,
                        gcs_path,
                        content,
                        metadata,
                        to_pgvector(vector),
                    )
        return len(records)

    async def search_similar(
        self,
        embedding: List[float],
        source_type: Optional[str],
        limit: int,
    ) -> List[Dict[str, Any]]:
        pool = await get_pool()
        vector_literal = to_pgvector(embedding)
        query = """
            SELECT source_type, source_id, gcs_path, content,
                   (embedding <=> $1::vector) AS score
            FROM document_embeddings
            WHERE ($2::text IS NULL OR source_type = $2)
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, vector_literal, source_type, limit)
        return [dict(row) for row in rows]

    async def upsert_policy_document_path(self, policy_id: str, gcs_path: str) -> None:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE policies SET document_gcs_path = $1 WHERE id = $2",
                gcs_path,
                policy_id,
            )

    async def attach_claim_image(self, claim_id: str, gcs_path: str) -> None:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE claims SET image_gcs_paths = array_append(image_gcs_paths, $1) WHERE id = $2",
                gcs_path,
                claim_id,
            )

from fastapi import APIRouter, Depends, Query

from app.models.schemas import ClaimSearchResponse
from app.services.claim_service import ClaimService

router = APIRouter()


@router.get("/semantic-search", response_model=ClaimSearchResponse)
async def semantic_search_claims(
    query: str = Query(..., min_length=2),
    limit: int = Query(default=10, ge=1, le=50),
    service: ClaimService = Depends(ClaimService.from_request),
) -> ClaimSearchResponse:
    results = await service.semantic_search(query=query, limit=limit)
    return ClaimSearchResponse(results=results)

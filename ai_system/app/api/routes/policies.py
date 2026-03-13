from fastapi import APIRouter, Depends, Query

from app.models.schemas import PolicySearchResponse
from app.services.policy_service import PolicyService

router = APIRouter()


@router.get("/semantic-search", response_model=PolicySearchResponse)
async def semantic_search_policies(
    query: str = Query(..., min_length=2),
    limit: int = Query(default=10, ge=1, le=50),
    service: PolicyService = Depends(PolicyService.from_request),
) -> PolicySearchResponse:
    results = await service.semantic_search(query=query, limit=limit)
    return PolicySearchResponse(results=results)

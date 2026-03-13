from fastapi import APIRouter, Depends

from app.models.schemas import AssistantRequest, AssistantResponse
from app.services.rag_service import RagService

router = APIRouter()


@router.post("/chat", response_model=AssistantResponse)
async def chat_with_assistant(
    payload: AssistantRequest,
    service: RagService = Depends(RagService.from_request),
) -> AssistantResponse:
    response = await service.answer(payload)
    return response

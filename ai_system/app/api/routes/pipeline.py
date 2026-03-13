from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import GcsEventPayload, PipelineResponse
from app.services.pipeline_service import PipelineService

router = APIRouter()


@router.post("/gcs", response_model=PipelineResponse)
async def handle_gcs_event(
    payload: GcsEventPayload,
    service: PipelineService = Depends(PipelineService.from_request),
) -> PipelineResponse:
    if not payload.message or not payload.message.data:
        raise HTTPException(status_code=400, detail="Missing Pub/Sub message")
    result = await service.process_pubsub_message(payload.message)
    return PipelineResponse(**result)

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PolicyResult(BaseModel):
    id: str
    policy_number: str
    policy_type: Optional[str]
    limit_amount: Optional[float]
    coverage_summary: Optional[str]
    document_url: Optional[str]
    score: float


class PolicySearchResponse(BaseModel):
    results: List[PolicyResult]


class ClaimResult(BaseModel):
    id: str
    claim_number: str
    policy_id: Optional[str]
    incident_date: Optional[datetime]
    status: Optional[str]
    image_urls: List[str] = Field(default_factory=list)
    score: float


class ClaimSearchResponse(BaseModel):
    results: List[ClaimResult]


class AssistantMessage(BaseModel):
    role: str
    content: str


class AssistantRequest(BaseModel):
    query: str
    history: List[AssistantMessage] = Field(default_factory=list)


class AssistantContextItem(BaseModel):
    source_type: str
    source_id: str
    snippet: str
    gcs_path: Optional[str]
    score: float


class AssistantResponse(BaseModel):
    answer: str
    context: List[AssistantContextItem]


class PubSubMessage(BaseModel):
    data: str
    message_id: Optional[str] = Field(default=None, alias="messageId")
    publish_time: Optional[str] = Field(default=None, alias="publishTime")


class GcsEventPayload(BaseModel):
    message: Optional[PubSubMessage] = None
    subscription: Optional[str] = None


class PipelineResponse(BaseModel):
    status: str
    object_path: Optional[str]
    processed_chunks: int = 0
    details: Dict[str, Any] = Field(default_factory=dict)

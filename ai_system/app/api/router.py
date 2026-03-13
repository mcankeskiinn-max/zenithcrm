from fastapi import APIRouter

from app.api.routes.assistant import router as assistant_router
from app.api.routes.claims import router as claims_router
from app.api.routes.policies import router as policies_router
from app.api.routes.pipeline import router as pipeline_router


api_router = APIRouter(prefix="/api")
api_router.include_router(policies_router, prefix="/policies", tags=["policies"])
api_router.include_router(claims_router, prefix="/claims", tags=["claims"])
api_router.include_router(assistant_router, prefix="/assistant", tags=["assistant"])
api_router.include_router(pipeline_router, prefix="/pipeline", tags=["pipeline"])

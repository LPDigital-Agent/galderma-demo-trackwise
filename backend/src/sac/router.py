# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Module - FastAPI Router
# ============================================
#
# REST endpoints for SAC complaint generation,
# status, scenario catalog, and configuration.
#
# ============================================

from fastapi import APIRouter

from src.sac import service
from src.sac.models import (
    SACConfigureRequest,
    SACGenerateRequest,
    SACGenerateResponse,
    SACStatus,
    ScenarioTemplate,
)
from src.simulator.api import simulator_api


router = APIRouter(tags=["SAC"])


@router.post("/generate", response_model=SACGenerateResponse)
async def generate_cases(request: SACGenerateRequest) -> SACGenerateResponse:
    """Generate SAC complaint cases from templates or agent."""
    return await service.generate_cases(request, simulator_api)


@router.get("/status", response_model=SACStatus)
async def get_status() -> SACStatus:
    """Get current SAC module status."""
    return service.get_status()


@router.get("/scenarios", response_model=list[ScenarioTemplate])
async def get_scenarios() -> list[ScenarioTemplate]:
    """List all available demo scenario types."""
    return service.get_scenarios()


@router.post("/configure", response_model=SACStatus)
async def configure(request: SACConfigureRequest) -> SACStatus:
    """Update SAC module configuration."""
    return service.configure(request)

# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Module - Pydantic Models
# ============================================
#
# Models for the SAC (Servico de Atendimento ao
# Consumidor) complaint generation module.
#
# ============================================

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ScenarioType(StrEnum):
    """Available SAC demo scenario types."""
    RECURRING_COMPLAINT = "RECURRING_COMPLAINT"
    ADVERSE_EVENT_HIGH = "ADVERSE_EVENT_HIGH"
    LINKED_INQUIRY = "LINKED_INQUIRY"
    MISSING_DATA = "MISSING_DATA"
    MULTI_PRODUCT_BATCH = "MULTI_PRODUCT_BATCH"
    RANDOM = "RANDOM"


class SACGenerateRequest(BaseModel):
    """Request to generate SAC complaint cases."""
    count: int = Field(default=1, ge=1, le=10)
    scenario_type: ScenarioType = Field(default=ScenarioType.RANDOM)
    product_brand: str | None = Field(default=None)
    use_agent: bool = Field(default=True)
    persist_dynamo: bool = Field(default=False)


class SACGenerateResponse(BaseModel):
    """Response from SAC case generation."""
    success: bool
    generated_count: int
    case_ids: list[str]
    scenario_type: str
    generation_method: str  # "gemini_agent" or "template_fallback"
    generation_time_ms: int
    cases: list[dict]  # Serialized Case objects


class SACStatus(BaseModel):
    """Current status of the SAC module."""
    agent_available: bool
    total_generated: int
    last_generation_at: datetime | None
    fallback_mode: bool
    dynamo_enabled: bool


class SACConfigureRequest(BaseModel):
    """Request to configure the SAC module."""
    dynamo_enabled: bool = False
    default_scenario: ScenarioType | None = None
    gemini_temperature: float = Field(default=0.8, ge=0.0, le=1.5)


class ScenarioTemplate(BaseModel):
    """Metadata about a demo scenario type."""
    scenario_type: ScenarioType
    name_pt: str
    name_en: str
    description_pt: str
    description_en: str
    demo_impact: str
    typical_count: int
    triggers_agents: list[str]

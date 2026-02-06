# ============================================
# Galderma TrackWise AI Autopilot Demo
# Shared Agent Configuration
# ============================================
#
# Centralized configuration for all agents.
# Uses pydantic-settings for environment variable loading.
# ============================================

import os
from enum import StrEnum

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from strands.models.gemini import GeminiModel


class ExecutionMode(StrEnum):
    """Agent execution modes."""

    OBSERVE = "OBSERVE"  # Read-only, just watch and report
    TRAIN = "TRAIN"  # Learning mode, all decisions require human approval
    ACT = "ACT"  # Full autonomy for low-risk decisions


class ModelId(StrEnum):
    """Available Gemini model IDs via Strands GeminiModel."""

    PRO = "gemini-3-pro-preview"
    FLASH = "gemini-3-flash-preview"


def _build_gemini_model(model_id: str, temperature: float = 0.5) -> GeminiModel:
    """Build a GeminiModel instance with the given parameters."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    return GeminiModel(
        client_args={"api_key": api_key},
        model_id=model_id,
        params={
            "temperature": temperature,
            "max_output_tokens": 4096,
            "top_p": 0.95,
        },
    )


class AgentConfig(BaseSettings):
    """Configuration for agent runtime.

    Loads from environment variables with AGENT_ prefix.
    """

    model_config = SettingsConfigDict(
        env_prefix="AGENT_",
        env_file=".env",
        extra="ignore",
    )

    # Agent identity
    name: str = Field(default="unknown", description="Agent name")
    environment: str = Field(default="dev", description="Environment: dev, staging, prod")

    # AWS configuration
    aws_region: str = Field(default="us-east-2", alias="AWS_REGION")
    aws_account_id: str = Field(default="176545286005")

    # Execution mode
    mode: ExecutionMode = Field(
        default=ExecutionMode.ACT,
        description="Execution mode: OBSERVE, TRAIN, or ACT",
    )

    # Model configuration
    model_id: str = Field(
        default=ModelId.PRO.value,
        description="Gemini model ID to use",
    )

    # AgentCore endpoints
    memory_id: str | None = Field(default=None, description="AgentCore Memory ID")
    gateway_endpoint: str | None = Field(
        default=None, description="AgentCore Gateway endpoint"
    )

    # DynamoDB tables
    runs_table_name: str | None = Field(
        default=None, alias="RUNS_TABLE_NAME"
    )
    ledger_table_name: str | None = Field(
        default=None, alias="LEDGER_TABLE_NAME"
    )
    cases_table_name: str | None = Field(
        default=None, alias="CASES_TABLE_NAME"
    )

    # Thresholds
    confidence_threshold: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Minimum confidence for auto-actions",
    )
    similarity_threshold: float = Field(
        default=0.75,
        ge=0.0,
        le=1.0,
        description="Minimum similarity for pattern matching",
    )

    # Timeouts
    a2a_timeout_seconds: int = Field(
        default=60, description="Timeout for A2A calls"
    )
    tool_timeout_seconds: int = Field(
        default=30, description="Timeout for tool calls"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    enable_tracing: bool = Field(default=True, description="Enable AgentCore tracing")

    def is_opus_required(self) -> bool:
        """Check if OPUS model is required for this agent."""
        # OPUS agents per AGENT_ARCHITECTURE.md
        opus_agents = ["compliance-guardian", "resolution-composer"]
        return self.name in opus_agents

    def get_model_id(self) -> str:
        """Get appropriate model ID string."""
        if self.is_opus_required():
            return ModelId.PRO.value
        return self.model_id

    def get_model(self) -> GeminiModel:
        """Get configured GeminiModel instance for this agent."""
        if self.is_opus_required():
            return _build_gemini_model(ModelId.PRO.value, temperature=0.3)
        if self.name == "sac-generator":
            return _build_gemini_model(ModelId.PRO.value, temperature=0.8)
        return _build_gemini_model(ModelId.PRO.value, temperature=0.5)

    def should_require_human_review(
        self,
        severity: str,
        confidence: float,
    ) -> bool:
        """Determine if human review is required.

        Human-in-the-Loop triggers:
        - TRAIN mode: Always
        - HIGH/CRITICAL severity: Always
        - Low confidence: Always
        """
        if self.mode == ExecutionMode.TRAIN:
            return True

        if severity in ["HIGH", "CRITICAL"]:
            return True

        return confidence < self.confidence_threshold


# Galderma product taxonomy
GALDERMA_PRODUCTS = {
    "CETAPHIL": [
        "Cetaphil Gentle Skin Cleanser",
        "Cetaphil Moisturizing Lotion",
        "Cetaphil Daily Facial Cleanser",
        "Cetaphil Moisturizing Cream",
        "Cetaphil PRO",
    ],
    "DIFFERIN": [
        "Differin Gel 0.1%",
        "Differin Cleanser",
        "Differin Moisturizer",
        "Differin Dark Spot Corrector",
    ],
    "EPIDUO": [
        "Epiduo Gel",
        "Epiduo Forte",
    ],
    "ALASTIN": [
        "Alastin Skincare Restorative Skin Complex",
        "Alastin HydraTint Pro Mineral Sunscreen",
        "Alastin Gentle Cleanser",
    ],
    "RESTYLANE": [
        "Restylane",
        "Restylane Lyft",
        "Restylane Silk",
        "Restylane Defyne",
        "Restylane Refyne",
    ],
}


def get_product_line(product_name: str) -> str | None:
    """Get product line from product name."""
    product_lower = product_name.lower()
    for line, products in GALDERMA_PRODUCTS.items():
        if line.lower() in product_lower:
            return line
        for product in products:
            if product.lower() in product_lower:
                return line
    return None


# Default agent configurations
DEFAULT_AGENTS = {
    "observer": {
        "model_id": ModelId.PRO.value,
        "description": "Orchestrator agent - routes events to specialists",
    },
    "case-understanding": {
        "model_id": ModelId.PRO.value,
        "description": "Analyzes and classifies TrackWise cases",
    },
    "recurring-detector": {
        "model_id": ModelId.PRO.value,
        "description": "Detects recurring patterns in complaints",
    },
    "compliance-guardian": {
        "model_id": ModelId.PRO.value,  # PRO for critical decisions
        "description": "Validates compliance with 5 policy rules",
    },
    "resolution-composer": {
        "model_id": ModelId.PRO.value,  # PRO for quality
        "description": "Composes multilingual resolutions (PT/EN/ES/FR)",
    },
    "inquiry-bridge": {
        "model_id": ModelId.PRO.value,
        "description": "Handles inquiry-linked complaints",
    },
    "writeback": {
        "model_id": ModelId.PRO.value,
        "description": "Executes writeback to TrackWise Simulator",
    },
    "memory-curator": {
        "model_id": ModelId.PRO.value,
        "description": "Manages memory updates from feedback",
    },
    "csv-pack": {
        "model_id": ModelId.PRO.value,
        "description": "Generates CSV compliance packs",
    },
}

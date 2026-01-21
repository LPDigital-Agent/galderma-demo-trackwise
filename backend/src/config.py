# ============================================
# Galderma TrackWise AI Autopilot Demo
# Backend Configuration
# ============================================

import os
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service info
    service_name: str = "trackwise-simulator"
    version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"

    # AWS Configuration
    aws_region: str = "us-east-2"
    aws_account_id: str = "176545286005"

    # AgentCore Configuration
    observer_agent_arn: Optional[str] = None
    a2a_enabled: bool = False

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8080

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Load settings
settings = Settings()

# ============================================
# Galderma TrackWise AI Autopilot Demo
# Memory Models - AgentCore Memory Integration
# ============================================

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class MemoryStrategy(StrEnum):
    """AgentCore Memory strategies."""

    RECURRING_PATTERNS = "RecurringPatterns"
    RESOLUTION_TEMPLATES = "ResolutionTemplates"
    POLICY_KNOWLEDGE = "PolicyKnowledge"


class MemoryPattern(BaseModel):
    """Pattern stored in AgentCore Memory.

    Used for semantic search and pattern matching.
    """

    pattern_id: str = Field(description="Unique pattern identifier")
    strategy: MemoryStrategy = Field(description="Memory strategy this belongs to")

    # Content
    name: str = Field(description="Human-readable pattern name")
    description: str = Field(description="Pattern description for semantic matching")
    content: dict[str, Any] = Field(description="Full pattern content")

    # Classification
    category: str | None = Field(default=None, description="Pattern category")
    product_line: str | None = Field(default=None, description="Product line if applicable")
    severity: str | None = Field(default=None, description="Associated severity")

    # Learning metrics
    confidence: float = Field(
        ge=0.0, le=1.0, default=0.5, description="Pattern confidence score"
    )
    match_count: int = Field(default=0, description="Number of times pattern matched")
    success_count: int = Field(default=0, description="Successful resolutions using this")
    failure_count: int = Field(default=0, description="Failed resolutions using this")

    # Versioning
    version: int = Field(default=1, description="Pattern version number")
    previous_version_id: str | None = Field(
        default=None, description="Previous version ID for history"
    )

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_matched_at: datetime | None = Field(default=None)

    # Human review
    human_verified: bool = Field(
        default=False, description="Whether pattern was human-verified"
    )
    verified_by: str | None = Field(default=None, description="Verifier ID")
    verified_at: datetime | None = Field(default=None)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class MemoryQuery(BaseModel):
    """Query for AgentCore Memory semantic search."""

    strategy: MemoryStrategy = Field(description="Strategy to query")
    query_text: str = Field(description="Text to search for (semantic)")

    # Filters
    category: str | None = Field(default=None, description="Filter by category")
    product_line: str | None = Field(default=None, description="Filter by product line")
    min_confidence: float | None = Field(
        default=None, ge=0.0, le=1.0, description="Minimum confidence threshold"
    )

    # Pagination
    limit: int = Field(default=10, ge=1, le=100, description="Max results")
    similarity_threshold: float = Field(
        default=0.75, ge=0.0, le=1.0, description="Minimum similarity score"
    )


class MemoryQueryResult(BaseModel):
    """Result from AgentCore Memory query."""

    patterns: list[MemoryPattern] = Field(description="Matched patterns")
    total_matches: int = Field(description="Total matches found")
    query_time_ms: int = Field(description="Query execution time")

    # Best match
    top_match: MemoryPattern | None = Field(
        default=None, description="Highest scoring match"
    )
    top_similarity: float | None = Field(
        default=None, description="Similarity score of top match"
    )


class MemoryWriteRequest(BaseModel):
    """Request to write/update AgentCore Memory."""

    strategy: MemoryStrategy = Field(description="Target strategy")
    pattern_id: str | None = Field(
        default=None, description="Pattern ID (None for new)"
    )

    # Content
    name: str = Field(description="Pattern name")
    description: str = Field(description="Pattern description for embedding")
    content: dict[str, Any] = Field(description="Pattern content")

    # Classification
    category: str | None = Field(default=None)
    product_line: str | None = Field(default=None)
    severity: str | None = Field(default=None)

    # Initial confidence
    initial_confidence: float = Field(default=0.5, ge=0.0, le=1.0)

    # Source
    source_case_id: str | None = Field(
        default=None, description="Case that generated this pattern"
    )
    source_run_id: str | None = Field(
        default=None, description="Run that generated this pattern"
    )


class MemoryFeedback(BaseModel):
    """Feedback for memory learning (TRAIN mode)."""

    pattern_id: str = Field(description="Pattern ID receiving feedback")
    strategy: MemoryStrategy = Field(description="Strategy of pattern")

    # Feedback type
    feedback_type: str = Field(
        description="APPROVE | REJECT | CORRECT"
    )

    # Correction (if CORRECT)
    corrected_content: dict[str, Any] | None = Field(
        default=None, description="Corrected content if type is CORRECT"
    )

    # Source
    case_id: str = Field(description="Case that generated feedback")
    run_id: str = Field(description="Run that generated feedback")

    # Confidence adjustment
    confidence_delta: float | None = Field(
        default=None, description="Calculated confidence change"
    )

    # Human actor
    feedback_by: str | None = Field(default=None, description="Human who provided feedback")
    feedback_at: datetime = Field(default_factory=datetime.utcnow)

    def calculate_confidence_delta(self) -> float:
        """Calculate confidence change based on feedback type."""
        if self.feedback_type == "APPROVE":
            return 0.05  # Boost confidence
        elif self.feedback_type == "REJECT":
            return -0.10  # Reduce confidence
        elif self.feedback_type == "CORRECT":
            return 0.0  # Reset with correction
        return 0.0

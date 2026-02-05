# ============================================
# Galderma TrackWise AI Autopilot Demo
# Ledger Models - Immutable Decision Ledger
# ============================================

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class LedgerAction(StrEnum):
    """Action types recorded in the decision ledger."""

    CASE_ANALYZED = "CASE_ANALYZED"
    PATTERN_MATCHED = "PATTERN_MATCHED"
    PATTERN_CREATED = "PATTERN_CREATED"
    COMPLIANCE_CHECKED = "COMPLIANCE_CHECKED"
    RESOLUTION_GENERATED = "RESOLUTION_GENERATED"
    WRITEBACK_EXECUTED = "WRITEBACK_EXECUTED"
    HUMAN_REVIEW_REQUESTED = "HUMAN_REVIEW_REQUESTED"
    HUMAN_APPROVED = "HUMAN_APPROVED"
    HUMAN_REJECTED = "HUMAN_REJECTED"
    MEMORY_UPDATED = "MEMORY_UPDATED"
    CASE_ESCALATED = "CASE_ESCALATED"
    ERROR_OCCURRED = "ERROR_OCCURRED"


class BeforeAfterState(BaseModel):
    """Before/after state for audit trail."""

    field: str = Field(description="Field that changed")
    before: Any | None = Field(default=None, description="Value before change")
    after: Any | None = Field(default=None, description="Value after change")


class LedgerEntry(BaseModel):
    """Immutable decision ledger entry.

    Every significant decision made by agents is recorded here for audit.
    Entries are immutable once created (append-only ledger).
    """

    ledger_id: str = Field(description="Unique ledger entry ID (ULID)")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Entry timestamp"
    )

    # Context
    run_id: str = Field(description="Run ID that generated this entry")
    case_id: str = Field(description="Case ID being processed")
    agent_name: str = Field(description="Agent that made the decision")

    # Action
    action: LedgerAction = Field(description="Type of action recorded")
    action_description: str = Field(description="Human-readable action description")

    # Decision details
    decision: str | None = Field(
        default=None, description="Decision made (e.g., APPROVE, REJECT)"
    )
    confidence: float | None = Field(
        default=None, ge=0.0, le=1.0, description="Confidence score for decision"
    )
    reasoning: str | None = Field(default=None, description="Reasoning for decision")

    # State changes (for audit diff view)
    state_changes: list[BeforeAfterState] = Field(
        default_factory=list, description="List of state changes"
    )

    # Policy evaluation
    policies_evaluated: list[str] | None = Field(
        default=None, description="List of policy IDs evaluated"
    )
    policy_violations: list[str] | None = Field(
        default=None, description="List of policy violations (if any)"
    )

    # Memory operations
    memory_strategy: str | None = Field(
        default=None, description="Memory strategy used (if applicable)"
    )
    memory_pattern_id: str | None = Field(
        default=None, description="Memory pattern ID (if applicable)"
    )

    # Human-in-the-loop
    requires_human_action: bool = Field(
        default=False, description="Whether entry requires human action"
    )
    human_action_taken: str | None = Field(
        default=None, description="Human action if taken"
    )
    human_actor: str | None = Field(
        default=None, description="Human who took action (if applicable)"
    )
    human_action_timestamp: datetime | None = Field(
        default=None, description="Timestamp of human action"
    )

    # Error details
    error_type: str | None = Field(default=None, description="Error type if failed")
    error_message: str | None = Field(
        default=None, description="Error message if failed"
    )
    error_stack: str | None = Field(
        default=None, description="Error stack trace if applicable"
    )

    # Metadata
    model_id: str | None = Field(default=None, description="LLM model ID used")
    tokens_used: int | None = Field(default=None, description="Tokens consumed")
    latency_ms: int | None = Field(default=None, description="Operation latency")

    # Hash for integrity verification
    entry_hash: str | None = Field(
        default=None, description="SHA-256 hash of entry for integrity"
    )
    previous_hash: str | None = Field(
        default=None, description="Hash of previous entry (blockchain-style)"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

    def to_audit_format(self) -> dict[str, Any]:
        """Convert to audit-friendly format with diff view."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "run_id": self.run_id,
            "case_id": self.case_id,
            "agent": self.agent_name,
            "action": self.action.value,
            "description": self.action_description,
            "decision": self.decision,
            "confidence": self.confidence,
            "changes": [
                {"field": c.field, "from": c.before, "to": c.after}
                for c in self.state_changes
            ],
            "human_required": self.requires_human_action,
        }

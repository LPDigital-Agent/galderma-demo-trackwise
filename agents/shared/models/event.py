# ============================================
# Galderma TrackWise AI Autopilot Demo
# Event Models - TrackWise Event Processing
# ============================================

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class EventType(str, Enum):
    """TrackWise event types from simulator."""

    # Case lifecycle events
    CASE_CREATED = "CaseCreated"
    CASE_UPDATED = "CaseUpdated"
    CASE_CLOSED = "CaseClosed"

    # Complaint-specific events
    COMPLAINT_CREATED = "ComplaintCreated"
    COMPLAINT_UPDATED = "ComplaintUpdated"
    COMPLAINT_CLOSED = "ComplaintClosed"
    FACTORY_COMPLAINT_CLOSED = "FactoryComplaintClosed"

    # Inquiry events
    INQUIRY_CREATED = "InquiryCreated"
    INQUIRY_CLOSED = "InquiryClosed"

    # System events
    BATCH_CREATED = "BatchCreated"
    DEMO_RESET = "DemoReset"

    # Agent events (internal)
    AGENT_STARTED = "AgentStarted"
    AGENT_COMPLETED = "AgentCompleted"
    HUMAN_REVIEW_REQUESTED = "HumanReviewRequested"
    HUMAN_FEEDBACK_RECEIVED = "HumanFeedbackReceived"


class TrackWiseEvent(BaseModel):
    """Event payload from TrackWise simulator.

    Contains the actual event data for processing.
    """

    event_type: EventType = Field(description="Type of event")
    case_id: str = Field(description="TrackWise case ID")

    # Case snapshot at event time
    case_snapshot: Optional[dict[str, Any]] = Field(
        default=None, description="Full case state at event time"
    )

    # Change details
    changed_fields: Optional[list[str]] = Field(
        default=None, description="List of fields that changed"
    )
    previous_values: Optional[dict[str, Any]] = Field(
        default=None, description="Previous values of changed fields"
    )
    new_values: Optional[dict[str, Any]] = Field(
        default=None, description="New values of changed fields"
    )

    # Metadata
    source: str = Field(default="trackwise-simulator", description="Event source")
    user_id: Optional[str] = Field(
        default=None, description="User who triggered event (if manual)"
    )


class EventEnvelope(BaseModel):
    """Envelope wrapper for TrackWise events.

    This is the outer container received by the Observer agent.
    Follows A2A message format.
    """

    envelope_id: str = Field(description="Unique envelope ID (ULID)")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Event timestamp"
    )

    # Event payload
    event: TrackWiseEvent = Field(description="The actual event data")

    # Processing metadata
    correlation_id: Optional[str] = Field(
        default=None, description="Correlation ID for tracing"
    )
    causation_id: Optional[str] = Field(
        default=None, description="ID of event that caused this one"
    )

    # Retry information
    attempt: int = Field(default=1, description="Processing attempt number")
    max_attempts: int = Field(default=3, description="Maximum retry attempts")

    # Priority
    priority: int = Field(
        default=5, ge=1, le=10, description="Processing priority (1=highest)"
    )

    # Routing hints
    target_agent: Optional[str] = Field(
        default=None, description="Specific agent to route to (if known)"
    )
    requires_opus: bool = Field(
        default=False, description="Whether event requires OPUS model"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

    @classmethod
    def from_trackwise_event(
        cls,
        event: TrackWiseEvent,
        envelope_id: str,
        correlation_id: Optional[str] = None,
    ) -> "EventEnvelope":
        """Create envelope from TrackWise event."""
        # Determine if OPUS is required based on event type
        requires_opus = event.event_type in [
            EventType.COMPLAINT_CREATED,
            EventType.FACTORY_COMPLAINT_CLOSED,
        ]

        # Set priority based on event type
        priority_map = {
            EventType.FACTORY_COMPLAINT_CLOSED: 1,  # Highest
            EventType.COMPLAINT_CREATED: 2,
            EventType.COMPLAINT_CLOSED: 3,
            EventType.CASE_CREATED: 4,
            EventType.INQUIRY_CREATED: 5,
            EventType.CASE_UPDATED: 6,
            EventType.INQUIRY_CLOSED: 7,
            EventType.CASE_CLOSED: 8,
        }

        return cls(
            envelope_id=envelope_id,
            event=event,
            correlation_id=correlation_id,
            priority=priority_map.get(event.event_type, 5),
            requires_opus=requires_opus,
        )

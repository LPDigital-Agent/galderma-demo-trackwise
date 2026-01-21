# ============================================
# Galderma TrackWise AI Autopilot Demo
# Case Models - TrackWise Case Representation
# ============================================

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class CaseStatus(str, Enum):
    """Status of a TrackWise case."""

    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_REVIEW = "PENDING_REVIEW"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class CaseType(str, Enum):
    """Type of TrackWise case."""

    COMPLAINT = "COMPLAINT"
    INQUIRY = "INQUIRY"


class Severity(str, Enum):
    """Severity level for cases."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ComplaintCategory(str, Enum):
    """Category of complaint."""

    PRODUCT_QUALITY = "PRODUCT_QUALITY"
    PACKAGING = "PACKAGING"
    LABELING = "LABELING"
    DELIVERY = "DELIVERY"
    ADVERSE_REACTION = "ADVERSE_REACTION"
    EFFICACY = "EFFICACY"
    OTHER = "OTHER"


class Case(BaseModel):
    """TrackWise case representation.

    This model represents a case in the TrackWise system.
    Used for both storage and API responses.
    """

    case_id: str = Field(description="Unique case identifier (TrackWise format)")
    case_type: CaseType = Field(description="Type of case: COMPLAINT or INQUIRY")
    status: CaseStatus = Field(default=CaseStatus.OPEN, description="Current case status")

    # Product information
    product: str = Field(description="Galderma product name")
    product_code: str | None = Field(default=None, description="Product SKU/code")
    batch_number: str | None = Field(default=None, description="Product batch number")

    # Complaint details
    category: ComplaintCategory | None = Field(
        default=None, description="Complaint category"
    )
    severity: Severity = Field(default=Severity.LOW, description="Severity level")
    description: str = Field(description="Case description from customer")

    # Contact information
    customer_name: str | None = Field(default=None, description="Customer name")
    customer_email: str | None = Field(default=None, description="Customer email")
    customer_country: str | None = Field(default=None, description="Customer country code")

    # Resolution
    resolution: str | None = Field(default=None, description="Resolution text")
    resolution_code: str | None = Field(default=None, description="Resolution code")

    # Linked cases
    linked_inquiry_id: str | None = Field(
        default=None, description="Linked inquiry case ID (for complaints)"
    )

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    closed_at: datetime | None = Field(default=None, description="Closure timestamp")

    # AI processing metadata
    ai_processed: bool = Field(default=False, description="Whether AI has processed this case")
    ai_confidence: float | None = Field(
        default=None, ge=0.0, le=1.0, description="AI confidence score"
    )
    ai_recommendation: str | None = Field(
        default=None, description="AI recommendation: AUTO_CLOSE | HUMAN_REVIEW | ESCALATE"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class CaseCreate(BaseModel):
    """Request model for creating a new case."""

    case_type: CaseType = Field(description="Type of case")
    product: str = Field(description="Galderma product name")
    description: str = Field(description="Case description")
    severity: Severity | None = Field(default=Severity.LOW, description="Initial severity")
    category: ComplaintCategory | None = Field(default=None, description="Complaint category")
    customer_name: str | None = Field(default=None, description="Customer name")
    customer_email: str | None = Field(default=None, description="Customer email")
    customer_country: str | None = Field(default=None, description="Customer country")
    batch_number: str | None = Field(default=None, description="Product batch number")


class CaseUpdate(BaseModel):
    """Request model for updating an existing case."""

    status: CaseStatus | None = Field(default=None, description="New status")
    severity: Severity | None = Field(default=None, description="Updated severity")
    category: ComplaintCategory | None = Field(default=None, description="Updated category")
    resolution: str | None = Field(default=None, description="Resolution text")
    resolution_code: str | None = Field(default=None, description="Resolution code")
    ai_processed: bool | None = Field(default=None, description="AI processed flag")
    ai_confidence: float | None = Field(default=None, description="AI confidence score")
    ai_recommendation: str | None = Field(default=None, description="AI recommendation")

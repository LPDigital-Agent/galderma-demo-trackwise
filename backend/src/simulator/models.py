# ============================================
# Galderma TrackWise AI Autopilot Demo
# TrackWise Simulator - Pydantic Models
# ============================================
#
# Data models matching DATA_MODEL.md specifications
# These models simulate TrackWise Digital entities
#
# ============================================

import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


def generate_ulid() -> str:
    """Generate a ULID-like ID using UUID for compatibility."""
    # Use UUID4 and format it similar to ULID (26 chars, uppercase alphanumeric)
    return uuid.uuid4().hex[:26].upper()


# ============================================
# Enums
# ============================================
class CaseStatus(StrEnum):
    """Case status in TrackWise workflow."""
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_REVIEW = "PENDING_REVIEW"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class CaseSeverity(StrEnum):
    """Case severity levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CaseType(StrEnum):
    """Type of case in TrackWise."""
    COMPLAINT = "COMPLAINT"
    INQUIRY = "INQUIRY"
    ADVERSE_EVENT = "ADVERSE_EVENT"


class ComplaintCategory(StrEnum):
    """Complaint categories per Galderma taxonomy."""
    PACKAGING = "PACKAGING"
    QUALITY = "QUALITY"
    EFFICACY = "EFFICACY"
    SAFETY = "SAFETY"
    DOCUMENTATION = "DOCUMENTATION"
    SHIPPING = "SHIPPING"
    OTHER = "OTHER"


class ReporterType(StrEnum):
    """Who reported the complaint."""
    CONSUMER = "CONSUMER"
    HCP = "HCP"
    SALES_REP = "SALES_REP"
    DISTRIBUTOR = "DISTRIBUTOR"


class ReceivedChannel(StrEnum):
    """Channel through which complaint was received."""
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    WEB = "WEB"
    SOCIAL_MEDIA = "SOCIAL_MEDIA"
    IN_PERSON = "IN_PERSON"


class RegulatoryClassification(StrEnum):
    """Regulatory classification of the complaint."""
    NONE = "NONE"
    MDR = "MDR"
    MIR = "MIR"
    FIELD_ALERT = "FIELD_ALERT"
    SERIOUS_AE = "SERIOUS_AE"


class InvestigationStatus(StrEnum):
    """Investigation status of the case."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    NOT_REQUIRED = "NOT_REQUIRED"


class EventType(StrEnum):
    """Event types emitted by TrackWise Simulator."""
    CASE_CREATED = "CaseCreated"
    CASE_UPDATED = "CaseUpdated"
    CASE_CLOSED = "CaseClosed"
    FACTORY_COMPLAINT_CLOSED = "FactoryComplaintClosed"
    BATCH_CREATED = "BatchCreated"


# ============================================
# Galderma Product Taxonomy
# ============================================
GALDERMA_PRODUCTS = {
    "CETAPHIL": [
        "Gentle Skin Cleanser",
        "Moisturizing Lotion",
        "Daily Facial Moisturizer SPF 15",
        "PRO Oil Removing Foam Wash",
        "Restoraderm Eczema Calming Body Wash",
        "Rich Hydrating Night Cream",
        "Bright Healthy Radiance Serum",
    ],
    "DIFFERIN": [
        "Adapalene Gel 0.1%",
        "Adapalene Gel 0.3%",
        "Daily Deep Cleanser",
        "Oil Absorbing Moisturizer SPF 30",
        "Soothing Moisturizer",
    ],
    "EPIDUO": [
        "Epiduo Gel",
        "Epiduo Forte Gel",
    ],
    "RESTYLANE": [
        "Restylane",
        "Restylane Lyft",
        "Restylane Silk",
        "Restylane Defyne",
        "Restylane Refyne",
        "Restylane Kysse",
        "Restylane Contour",
    ],
    "DYSPORT": [
        "Dysport (abobotulinumtoxinA)",
    ],
    "SCULPTRA": [
        "Sculptra Aesthetic",
    ],
    "SOOLANTRA": [
        "Soolantra Cream 1%",
    ],
    "ORACEA": [
        "Oracea Capsules 40mg",
    ],
    "BENZAC": [
        "Benzac AC Gel 2.5%",
        "Benzac AC Gel 5%",
        "Benzac AC Gel 10%",
        "Benzac AC Wash",
    ],
    "LOCERYL": [
        "Loceryl Nail Lacquer",
    ],
}


# ============================================
# Case Models
# ============================================
class CaseBase(BaseModel):
    """Base case model with common fields."""
    product_brand: str = Field(description="Galderma product brand")
    product_name: str = Field(description="Specific product name")
    complaint_text: str = Field(description="Customer complaint description")
    customer_name: str = Field(description="Customer name")
    customer_email: str | None = Field(default=None, description="Customer email")
    customer_phone: str | None = Field(default=None, description="Customer phone")
    case_type: CaseType = Field(default=CaseType.COMPLAINT, description="Type of case")
    category: ComplaintCategory | None = Field(default=None, description="Complaint category")
    severity: CaseSeverity | None = Field(default=None, description="Override severity (computed if None)")
    lot_number: str | None = Field(default=None, description="Product lot/batch number")
    linked_case_id: str | None = Field(default=None, description="ID of linked case (for inquiries)")
    # Reporter & intake
    reporter_type: ReporterType | None = Field(default=None, description="Who reported the complaint")
    reporter_country: str | None = Field(default=None, description="Country of reporter")
    received_channel: ReceivedChannel | None = Field(default=None, description="Intake channel")
    received_date: datetime | None = Field(default=None, description="Date complaint was received")
    # Product traceability
    manufacturing_site: str | None = Field(default=None, description="Manufacturing facility")
    expiry_date: str | None = Field(default=None, description="Product expiry date")
    sample_available: bool | None = Field(default=None, description="Sample available for analysis")
    # Compliance & regulatory
    adverse_event_flag: bool | None = Field(default=None, description="Adverse event implications")
    regulatory_reportable: bool | None = Field(default=None, description="Needs regulatory reporting")
    regulatory_classification: RegulatoryClassification | None = Field(default=None, description="Regulatory classification")
    # Investigation
    investigation_status: InvestigationStatus | None = Field(default=None, description="Investigation status")
    root_cause: str | None = Field(default=None, description="Root cause determination")
    capa_reference: str | None = Field(default=None, description="CAPA reference ID")
    assigned_investigator: str | None = Field(default=None, description="Assigned investigator")
    sla_due_date: str | None = Field(default=None, description="SLA deadline")


class CaseCreate(CaseBase):
    """Model for creating a new case."""
    pass


class CaseUpdate(BaseModel):
    """Model for updating an existing case."""
    status: CaseStatus | None = None
    severity: CaseSeverity | None = None
    category: ComplaintCategory | None = None
    resolution_text: str | None = None
    resolution_text_pt: str | None = None
    resolution_text_en: str | None = None
    resolution_text_es: str | None = None
    resolution_text_fr: str | None = None
    ai_recommendation: str | None = None
    ai_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    guardian_approved: bool | None = None
    processed_by_agent: str | None = None


class Case(CaseBase):
    """Full case model with all fields."""
    case_id: str = Field(default_factory=lambda: f"TW-{generate_ulid()[-8:].upper()}")
    status: CaseStatus = Field(default=CaseStatus.OPEN)
    severity: CaseSeverity = Field(default=CaseSeverity.MEDIUM)

    # Resolution fields
    resolution_text: str | None = None
    resolution_text_pt: str | None = None
    resolution_text_en: str | None = None
    resolution_text_es: str | None = None
    resolution_text_fr: str | None = None

    # AI processing fields
    ai_recommendation: str | None = None
    ai_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    guardian_approved: bool | None = None
    processed_by_agent: str | None = None
    recurring_pattern_id: str | None = Field(default=None, description="Recurring pattern ID if matched")
    run_id: str | None = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: datetime | None = None

    model_config = {"from_attributes": True}


# ============================================
# Event Models
# ============================================
class EventEnvelope(BaseModel):
    """Event envelope for A2A communication."""
    event_id: str = Field(default_factory=lambda: generate_ulid())
    event_type: EventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = Field(default="trackwise-simulator")
    payload: dict[str, Any]

    model_config = {"from_attributes": True}


class CaseEvent(BaseModel):
    """Case-related event payload."""
    case_id: str
    case: Case
    previous_status: CaseStatus | None = None


# ============================================
# Batch Models
# ============================================
class BatchCreate(BaseModel):
    """Model for creating a batch of demo cases."""
    count: int = Field(default=5, ge=1, le=50, description="Number of cases to create")
    include_recurring: bool = Field(default=True, description="Include recurring patterns")
    include_adverse_events: bool = Field(default=False, description="Include adverse events")
    include_linked_inquiries: bool = Field(default=True, description="Include linked inquiries")


class BatchResult(BaseModel):
    """Result of batch case creation."""
    created_count: int
    case_ids: list[str]
    events_emitted: int


# ============================================
# Response Models
# ============================================
class CaseListResponse(BaseModel):
    """Response for case list endpoint."""
    total: int
    cases: list[Case]
    page: int = 1
    page_size: int = 20


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    service: str = "trackwise-simulator"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "0.1.0"

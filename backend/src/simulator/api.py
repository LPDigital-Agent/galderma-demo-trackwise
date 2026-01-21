# ============================================
# Galderma TrackWise AI Autopilot Demo
# TrackWise Simulator - API Operations
# ============================================
#
# In-memory case management for demo purposes.
# Simulates TrackWise Digital CRUD operations.
#
# ============================================

import logging
import random
from datetime import datetime

from .models import (
    GALDERMA_PRODUCTS,
    BatchCreate,
    BatchResult,
    Case,
    CaseCreate,
    CaseListResponse,
    CaseSeverity,
    CaseStatus,
    CaseType,
    CaseUpdate,
    ComplaintCategory,
    EventEnvelope,
    EventType,
)


# ============================================
# Logger
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "service": "simulator", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("simulator")


# ============================================
# Demo Complaint Templates
# ============================================
DEMO_COMPLAINTS = {
    ComplaintCategory.PACKAGING: [
        "The seal on my {product} was broken when I received it.",
        "The pump mechanism on my {product} stopped working after a week.",
        "The packaging of my {product} was damaged during shipping.",
        "The expiration date on my {product} is not clearly visible.",
        "The cap on my {product} doesn't close properly.",
    ],
    ComplaintCategory.QUALITY: [
        "My {product} has a strange texture, different from what I usually get.",
        "The {product} appears to have separated inside the container.",
        "There are small particles floating in my {product}.",
        "The color of my {product} looks different from my previous purchase.",
        "My {product} has a different smell than usual.",
    ],
    ComplaintCategory.EFFICACY: [
        "I've been using {product} for 2 weeks with no visible improvement.",
        "The {product} doesn't seem as effective as before.",
        "My skin condition got worse after using {product}.",
        "The {product} is not providing the results I expected.",
        "I switched to {product} but it's not working for me.",
    ],
    ComplaintCategory.SAFETY: [
        "I experienced a mild rash after using {product}.",
        "My skin became red and irritated after applying {product}.",
        "I had an allergic reaction to {product}.",
        "The {product} caused burning sensation on my skin.",
        "I noticed increased dryness after using {product}.",
    ],
    ComplaintCategory.SHIPPING: [
        "My order of {product} arrived late.",
        "I received the wrong {product} in my shipment.",
        "My {product} was not included in the delivery.",
        "The tracking number for my {product} order doesn't work.",
        "My {product} arrived melted due to heat during shipping.",
    ],
}

DEMO_CUSTOMER_NAMES = [
    "Maria Silva", "João Santos", "Ana Oliveira", "Pedro Costa",
    "Carla Ferreira", "Lucas Almeida", "Julia Ribeiro", "Rafael Pereira",
    "Fernanda Lima", "Bruno Souza", "Patricia Gomes", "Marcos Rodrigues",
    "Beatriz Martins", "Gustavo Carvalho", "Camila Araújo",
]


# ============================================
# Simulator API Class
# ============================================
class SimulatorAPI:
    """In-memory TrackWise Simulator for demo purposes."""

    def __init__(self) -> None:
        """Initialize the simulator with empty case storage."""
        self._cases: dict[str, Case] = {}
        self._events: list[EventEnvelope] = []
        self._event_callback: callable | None = None
        logger.info("TrackWise Simulator initialized")

    def set_event_callback(self, callback: callable) -> None:
        """Set callback function to be called when events are emitted."""
        self._event_callback = callback

    # ============================================
    # Case Operations
    # ============================================
    def create_case(self, case_data: CaseCreate) -> tuple[Case, EventEnvelope]:
        """Create a new case and emit CaseCreated event.

        Args:
            case_data: Case creation data

        Returns:
            Tuple of (created case, emitted event)
        """
        case = Case(
            product_brand=case_data.product_brand,
            product_name=case_data.product_name,
            complaint_text=case_data.complaint_text,
            customer_name=case_data.customer_name,
            customer_email=case_data.customer_email,
            customer_phone=case_data.customer_phone,
            case_type=case_data.case_type,
            category=case_data.category,
            lot_number=case_data.lot_number,
            linked_case_id=case_data.linked_case_id,
        )

        self._cases[case.case_id] = case
        logger.info(f"Case created: {case.case_id}")

        # Emit event
        event = self._emit_event(
            event_type=EventType.CASE_CREATED,
            payload={
                "case_id": case.case_id,
                "case": case.model_dump(mode="json"),
            },
        )

        return case, event

    def get_case(self, case_id: str) -> Case | None:
        """Get a case by ID.

        Args:
            case_id: Case identifier

        Returns:
            Case if found, None otherwise
        """
        return self._cases.get(case_id)

    def update_case(
        self, case_id: str, update_data: CaseUpdate
    ) -> tuple[Case | None, EventEnvelope | None]:
        """Update an existing case.

        Args:
            case_id: Case identifier
            update_data: Fields to update

        Returns:
            Tuple of (updated case, emitted event) or (None, None) if not found
        """
        case = self._cases.get(case_id)
        if not case:
            logger.warning(f"Case not found: {case_id}")
            return None, None

        previous_status = case.status

        # Apply updates
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(case, field, value)

        case.updated_at = datetime.utcnow()

        # Update closed_at if status changed to CLOSED
        if case.status == CaseStatus.CLOSED and previous_status != CaseStatus.CLOSED:
            case.closed_at = datetime.utcnow()

        self._cases[case_id] = case
        logger.info(f"Case updated: {case_id}")

        # Emit event
        event = self._emit_event(
            event_type=EventType.CASE_UPDATED,
            payload={
                "case_id": case.case_id,
                "case": case.model_dump(mode="json"),
                "previous_status": previous_status.value,
            },
        )

        return case, event

    def close_case(
        self,
        case_id: str,
        resolution_text: str,
        resolution_text_pt: str | None = None,
        resolution_text_en: str | None = None,
        resolution_text_es: str | None = None,
        resolution_text_fr: str | None = None,
        processed_by_agent: str | None = None,
    ) -> tuple[Case | None, EventEnvelope | None]:
        """Close a case with resolution.

        Args:
            case_id: Case identifier
            resolution_text: Canonical resolution text
            resolution_text_*: Localized resolution texts
            processed_by_agent: Agent that processed the case

        Returns:
            Tuple of (closed case, emitted event) or (None, None) if not found
        """
        case = self._cases.get(case_id)
        if not case:
            logger.warning(f"Case not found: {case_id}")
            return None, None

        previous_status = case.status
        case.status = CaseStatus.CLOSED
        case.resolution_text = resolution_text
        case.resolution_text_pt = resolution_text_pt
        case.resolution_text_en = resolution_text_en
        case.resolution_text_es = resolution_text_es
        case.resolution_text_fr = resolution_text_fr
        case.processed_by_agent = processed_by_agent
        case.updated_at = datetime.utcnow()
        case.closed_at = datetime.utcnow()

        self._cases[case_id] = case
        logger.info(f"Case closed: {case_id}")

        # Emit appropriate event
        event_type = (
            EventType.FACTORY_COMPLAINT_CLOSED
            if case.case_type == CaseType.COMPLAINT
            else EventType.CASE_CLOSED
        )

        event = self._emit_event(
            event_type=event_type,
            payload={
                "case_id": case.case_id,
                "case": case.model_dump(mode="json"),
                "previous_status": previous_status.value,
            },
        )

        return case, event

    def list_cases(
        self,
        status: CaseStatus | None = None,
        severity: CaseSeverity | None = None,
        case_type: CaseType | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> CaseListResponse:
        """List cases with optional filters.

        Args:
            status: Filter by status
            severity: Filter by severity
            case_type: Filter by type
            page: Page number (1-indexed)
            page_size: Items per page

        Returns:
            Paginated case list response
        """
        cases = list(self._cases.values())

        # Apply filters
        if status:
            cases = [c for c in cases if c.status == status]
        if severity:
            cases = [c for c in cases if c.severity == severity]
        if case_type:
            cases = [c for c in cases if c.case_type == case_type]

        # Sort by created_at descending
        cases.sort(key=lambda c: c.created_at, reverse=True)

        total = len(cases)

        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        cases = cases[start:end]

        return CaseListResponse(
            total=total,
            cases=cases,
            page=page,
            page_size=page_size,
        )

    def delete_case(self, case_id: str) -> bool:
        """Delete a case (for demo reset only).

        Args:
            case_id: Case identifier

        Returns:
            True if deleted, False if not found
        """
        if case_id in self._cases:
            del self._cases[case_id]
            logger.info(f"Case deleted: {case_id}")
            return True
        return False

    # ============================================
    # Batch Operations
    # ============================================
    def create_batch(self, batch_data: BatchCreate) -> BatchResult:
        """Create a batch of demo cases.

        Args:
            batch_data: Batch creation parameters

        Returns:
            Batch creation result
        """
        case_ids: list[str] = []
        events_emitted = 0

        for i in range(batch_data.count):
            case_data = self._generate_demo_case(
                index=i,
                include_recurring=batch_data.include_recurring,
                include_adverse_events=batch_data.include_adverse_events,
                include_linked_inquiries=batch_data.include_linked_inquiries,
            )

            case, event = self.create_case(case_data)
            case_ids.append(case.case_id)
            events_emitted += 1

            # Create linked inquiry if applicable
            if (
                batch_data.include_linked_inquiries
                and case.case_type == CaseType.COMPLAINT
                and random.random() < 0.3
            ):
                inquiry_data = CaseCreate(
                    product_brand=case.product_brand,
                    product_name=case.product_name,
                    complaint_text=f"Follow-up inquiry regarding {case.case_id}",
                    customer_name=case.customer_name,
                    customer_email=case.customer_email,
                    case_type=CaseType.INQUIRY,
                    linked_case_id=case.case_id,
                )
                inquiry, _ = self.create_case(inquiry_data)
                case_ids.append(inquiry.case_id)
                events_emitted += 1

        logger.info(f"Batch created: {len(case_ids)} cases")

        return BatchResult(
            created_count=len(case_ids),
            case_ids=case_ids,
            events_emitted=events_emitted,
        )

    def _generate_demo_case(
        self,
        index: int,
        include_recurring: bool,
        include_adverse_events: bool,
        include_linked_inquiries: bool,
    ) -> CaseCreate:
        """Generate a demo case with realistic data.

        Args:
            index: Case index in batch
            include_recurring: Include recurring patterns
            include_adverse_events: Include adverse events
            include_linked_inquiries: Include inquiries

        Returns:
            Generated case data
        """
        # Select random brand and product
        brand = random.choice(list(GALDERMA_PRODUCTS.keys()))
        product = random.choice(GALDERMA_PRODUCTS[brand])

        # Select category (with recurring patterns)
        if include_recurring and index % 3 == 0:
            # Recurring: always PACKAGING with broken seal
            category = ComplaintCategory.PACKAGING
            complaint = DEMO_COMPLAINTS[category][0].format(product=f"{brand} {product}")
        elif include_adverse_events and random.random() < 0.1:
            # Adverse event: SAFETY category
            category = ComplaintCategory.SAFETY
            complaint = random.choice(DEMO_COMPLAINTS[category]).format(
                product=f"{brand} {product}"
            )
        else:
            # Random category
            category = random.choice(list(ComplaintCategory))
            if category in DEMO_COMPLAINTS:
                complaint = random.choice(DEMO_COMPLAINTS[category]).format(
                    product=f"{brand} {product}"
                )
            else:
                complaint = f"Issue with my {brand} {product}."

        # Customer data
        customer = random.choice(DEMO_CUSTOMER_NAMES)

        # Case type
        case_type = (
            CaseType.ADVERSE_EVENT
            if include_adverse_events and category == ComplaintCategory.SAFETY
            else CaseType.COMPLAINT
        )

        return CaseCreate(
            product_brand=brand,
            product_name=product,
            complaint_text=complaint,
            customer_name=customer,
            customer_email=f"{customer.lower().replace(' ', '.')}@example.com",
            case_type=case_type,
            category=category,
            lot_number=f"LOT-{random.randint(10000, 99999)}",
        )

    # ============================================
    # Demo Reset
    # ============================================
    def reset_demo(self) -> dict[str, int]:
        """Reset all demo data.

        Returns:
            Count of cleared items
        """
        cases_cleared = len(self._cases)
        events_cleared = len(self._events)

        self._cases.clear()
        self._events.clear()

        logger.info(f"Demo reset: {cases_cleared} cases, {events_cleared} events cleared")

        return {
            "cases_cleared": cases_cleared,
            "events_cleared": events_cleared,
        }

    # ============================================
    # Event Management
    # ============================================
    def _emit_event(self, event_type: EventType, payload: dict) -> EventEnvelope:
        """Emit an event and notify callback if set.

        Args:
            event_type: Type of event
            payload: Event payload

        Returns:
            Created event envelope
        """
        event = EventEnvelope(
            event_type=event_type,
            payload=payload,
        )

        self._events.append(event)
        logger.info(f"Event emitted: {event_type.value} - {event.event_id}")

        # Call callback if set (for A2A integration)
        if self._event_callback:
            try:
                self._event_callback(event)
            except Exception as e:
                logger.error(f"Event callback failed: {e}")

        return event

    def get_events(
        self, limit: int = 100, event_type: EventType | None = None
    ) -> list[EventEnvelope]:
        """Get recent events.

        Args:
            limit: Maximum events to return
            event_type: Filter by event type

        Returns:
            List of events (newest first)
        """
        events = self._events.copy()

        if event_type:
            events = [e for e in events if e.event_type == event_type]

        events.sort(key=lambda e: e.timestamp, reverse=True)

        return events[:limit]

    # ============================================
    # Statistics
    # ============================================
    def get_stats(self) -> dict[str, int]:
        """Get simulator statistics.

        Returns:
            Dictionary with counts
        """
        cases = list(self._cases.values())

        return {
            "total_cases": len(cases),
            "open_cases": len([c for c in cases if c.status == CaseStatus.OPEN]),
            "in_progress_cases": len([c for c in cases if c.status == CaseStatus.IN_PROGRESS]),
            "closed_cases": len([c for c in cases if c.status == CaseStatus.CLOSED]),
            "complaints": len([c for c in cases if c.case_type == CaseType.COMPLAINT]),
            "inquiries": len([c for c in cases if c.case_type == CaseType.INQUIRY]),
            "adverse_events": len([c for c in cases if c.case_type == CaseType.ADVERSE_EVENT]),
            "low_severity": len([c for c in cases if c.severity == CaseSeverity.LOW]),
            "medium_severity": len([c for c in cases if c.severity == CaseSeverity.MEDIUM]),
            "high_severity": len([c for c in cases if c.severity == CaseSeverity.HIGH]),
            "critical_severity": len([c for c in cases if c.severity == CaseSeverity.CRITICAL]),
            "total_events": len(self._events),
        }


# ============================================
# Singleton Instance
# ============================================
simulator_api = SimulatorAPI()

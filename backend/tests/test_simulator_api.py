# ============================================
# Galderma TrackWise AI Autopilot Demo
# Backend Tests - Simulator API
# ============================================


from src.simulator.api import SimulatorAPI
from src.simulator.models import (
    BatchCreate,
    CaseCreate,
    CaseSeverity,
    CaseStatus,
    CaseType,
    CaseUpdate,
    ComplaintCategory,
    EventType,
)


class TestSimulatorAPI:
    """Tests for SimulatorAPI class."""

    def test_create_case(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test case creation."""
        case, event = simulator.create_case(sample_case_create)

        assert case.case_id.startswith("TW-")
        assert case.product_brand == "CETAPHIL"
        assert case.status == CaseStatus.OPEN
        assert case.severity == CaseSeverity.MEDIUM
        assert event.event_type == EventType.CASE_CREATED

    def test_get_case(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test getting a case by ID."""
        case, _ = simulator.create_case(sample_case_create)

        retrieved = simulator.get_case(case.case_id)
        assert retrieved is not None
        assert retrieved.case_id == case.case_id

    def test_get_case_not_found(self, simulator: SimulatorAPI):
        """Test getting a non-existent case."""
        retrieved = simulator.get_case("TW-NOTEXIST")
        assert retrieved is None

    def test_update_case(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test updating a case."""
        case, _ = simulator.create_case(sample_case_create)

        update_data = CaseUpdate(
            status=CaseStatus.IN_PROGRESS,
            severity=CaseSeverity.HIGH,
            ai_recommendation="HUMAN_REVIEW",
            ai_confidence=0.75,
        )

        updated, event = simulator.update_case(case.case_id, update_data)

        assert updated is not None
        assert updated.status == CaseStatus.IN_PROGRESS
        assert updated.severity == CaseSeverity.HIGH
        assert updated.ai_confidence == 0.75
        assert event.event_type == EventType.CASE_UPDATED

    def test_close_case(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test closing a case."""
        case, _ = simulator.create_case(sample_case_create)

        closed, event = simulator.close_case(
            case_id=case.case_id,
            resolution_text="Issue resolved - replacement sent.",
            resolution_text_pt="Problema resolvido - substituto enviado.",
            resolution_text_en="Issue resolved - replacement sent.",
            processed_by_agent="writeback",
        )

        assert closed is not None
        assert closed.status == CaseStatus.CLOSED
        assert closed.resolution_text == "Issue resolved - replacement sent."
        assert closed.closed_at is not None
        assert event.event_type == EventType.FACTORY_COMPLAINT_CLOSED

    def test_list_cases_no_filter(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test listing cases without filters."""
        # Create a few cases
        for _ in range(3):
            simulator.create_case(sample_case_create)

        response = simulator.list_cases()

        assert response.total == 3
        assert len(response.cases) == 3

    def test_list_cases_with_status_filter(
        self, simulator: SimulatorAPI, sample_case_create: CaseCreate
    ):
        """Test listing cases with status filter."""
        case1, _ = simulator.create_case(sample_case_create)
        case2, _ = simulator.create_case(sample_case_create)

        # Close one case
        simulator.close_case(case1.case_id, "Resolved")

        open_cases = simulator.list_cases(status=CaseStatus.OPEN)
        closed_cases = simulator.list_cases(status=CaseStatus.CLOSED)

        assert open_cases.total == 1
        assert closed_cases.total == 1

    def test_create_batch(self, simulator: SimulatorAPI):
        """Test batch case creation."""
        batch_data = BatchCreate(
            count=5,
            include_recurring=True,
            include_adverse_events=False,
            include_linked_inquiries=False,
        )

        result = simulator.create_batch(batch_data)

        assert result.created_count >= 5
        assert len(result.case_ids) >= 5
        assert result.events_emitted >= 5

    def test_reset_demo(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test resetting demo data."""
        # Create some cases
        for _ in range(3):
            simulator.create_case(sample_case_create)

        assert len(simulator._cases) == 3

        result = simulator.reset_demo()

        assert result["cases_cleared"] == 3
        assert len(simulator._cases) == 0

    def test_get_stats(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test getting statistics."""
        # Create and close some cases
        case1, _ = simulator.create_case(sample_case_create)
        case2, _ = simulator.create_case(sample_case_create)
        simulator.close_case(case1.case_id, "Resolved")

        stats = simulator.get_stats()

        assert stats["total_cases"] == 2
        assert stats["open_cases"] == 1
        assert stats["closed_cases"] == 1
        assert stats["complaints"] == 2

    def test_event_callback(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test event callback is called."""
        events_received = []

        def callback(event):
            events_received.append(event)

        simulator.set_event_callback(callback)
        simulator.create_case(sample_case_create)

        assert len(events_received) == 1
        assert events_received[0].event_type == EventType.CASE_CREATED


class TestSimulatorAPIIntegration:
    """Integration tests for Simulator API."""

    def test_linked_inquiry_workflow(self, simulator: SimulatorAPI, sample_case_create: CaseCreate):
        """Test creating a complaint and then a linked inquiry."""
        # Create complaint
        complaint, _ = simulator.create_case(sample_case_create)

        # Create linked inquiry
        inquiry_data = CaseCreate(
            product_brand=complaint.product_brand,
            product_name=complaint.product_name,
            complaint_text="Follow-up question about my complaint",
            customer_name=complaint.customer_name,
            case_type=CaseType.INQUIRY,
            linked_case_id=complaint.case_id,
        )
        inquiry, _ = simulator.create_case(inquiry_data)

        assert inquiry.linked_case_id == complaint.case_id
        assert inquiry.case_type == CaseType.INQUIRY

    def test_recurring_pattern_detection(self, simulator: SimulatorAPI):
        """Test that recurring patterns are included in batch creation."""
        batch_data = BatchCreate(
            count=10,
            include_recurring=True,
            include_adverse_events=False,
            include_linked_inquiries=False,
        )

        simulator.create_batch(batch_data)

        # Get all cases
        cases = simulator.list_cases(page_size=100).cases

        # Count packaging complaints (recurring pattern)
        packaging_count = sum(
            1 for c in cases if c.category == ComplaintCategory.PACKAGING
        )

        # At least some should be packaging (recurring pattern is every 3rd)
        assert packaging_count >= 3

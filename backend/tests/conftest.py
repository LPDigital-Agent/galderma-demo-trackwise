# ============================================
# Galderma TrackWise AI Autopilot Demo
# Backend Tests - Fixtures
# ============================================

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.simulator.api import SimulatorAPI
from src.simulator.models import CaseCreate, CaseType, ComplaintCategory


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def simulator():
    """Create a fresh SimulatorAPI instance for testing."""
    return SimulatorAPI()


@pytest.fixture
def sample_case_create():
    """Sample case creation data."""
    return CaseCreate(
        product_brand="CETAPHIL",
        product_name="Gentle Skin Cleanser",
        complaint_text="The seal on my Cetaphil Gentle Skin Cleanser was broken when I received it.",
        customer_name="Maria Silva",
        customer_email="maria.silva@example.com",
        case_type=CaseType.COMPLAINT,
        category=ComplaintCategory.PACKAGING,
        lot_number="LOT-12345",
    )


@pytest.fixture
def sample_inquiry_create(sample_case_create):
    """Sample inquiry creation data (linked to a case)."""
    return CaseCreate(
        product_brand=sample_case_create.product_brand,
        product_name=sample_case_create.product_name,
        complaint_text="Follow-up inquiry regarding my previous complaint.",
        customer_name=sample_case_create.customer_name,
        customer_email=sample_case_create.customer_email,
        case_type=CaseType.INQUIRY,
        linked_case_id="TW-PLACEHOLDER",
    )

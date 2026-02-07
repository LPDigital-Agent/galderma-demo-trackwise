# ============================================
# Galderma TrackWise AI Autopilot Demo
# Backend Tests - SAC Agent Client & Service
# ============================================
#
# Tests for agent_client.py (availability, CaseCreate
# builder, fallback behavior) and service.py integration.
#
# No real LLM calls — all agent behavior is mocked.
#
# ============================================

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

from src.sac.agent_client import (
    _build_case_create,
    is_agent_available,
)
from src.sac.models import SACGenerateRequest, ScenarioType
from src.sac.service import generate_cases, get_status
from src.simulator.api import SimulatorAPI
from src.simulator.models import CaseCreate


# ============================================
# Fixtures
# ============================================
@pytest.fixture
def full_tool_results() -> dict:
    """Complete merged tool results simulating all 7 tools."""
    return {
        # select_product
        "product_brand": "CETAPHIL",
        "product_name": "Gentle Skin Cleanser",
        "is_injectable": False,
        "full_name": "CETAPHIL Gentle Skin Cleanser",
        # generate_customer_profile
        "customer_name": "Maria Silva",
        "customer_email": "maria.silva42@gmail.com",
        "customer_phone": "+55 11 98765-4321",
        "city": "São Paulo",
        "state": "SP",
        "gender": "female",
        "reporter_country": "Brasil",
        # generate_complaint_text
        "valid": True,
        "complaint_id": "SAC-A1B2C3D4",
        "category": "PACKAGING",
        "case_type": "COMPLAINT",
        "complaint_text": (
            "Comprei o produto Cetaphil Gentle Skin Cleanser na Drogaria São Paulo "
            "da Rua Augusta, no dia 15 de janeiro de 2026. Ao abrir a embalagem, "
            "percebi que o selo de segurança estava rompido. O produto parecia ter "
            "sido manipulado, com sinais de vazamento na tampa. "
            "Tenho a embalagem original e a nota fiscal para eventual análise. "
            "Solicito a substituição do produto e investigação sobre o lote."
        ),
        "scenario_type": "RANDOM",
        "char_count": 380,
        # determine_severity
        "severity": "MEDIUM",
        "severity_reason": "PACKAGING complaint requires standard investigation",
        # generate_lot_and_manufacturing
        "lot_number": "LOT-2026-HRT-04521",
        "manufacturing_site": "Hortolândia, SP, Brazil",
        "expiry_date": "2027-06-15",
        "sample_available": True,
        # assess_regulatory_impact
        "adverse_event_flag": False,
        "regulatory_reportable": False,
        "regulatory_classification": "NONE",
        "reporter_type": "CONSUMER",
        "received_channel": "PHONE",
        "received_date": "2026-02-07T10:30:00+00:00",
        "sla_due_date": "2026-02-17",
        # generate_investigation_data
        "investigation_valid": True,
        "investigation_status": "COMPLETED",
        "root_cause": (
            "Análise de causa raiz via metodologia 5 Porquês: "
            "degradação do adesivo de selagem causada por temperatura acima de 30°C "
            "durante transporte rodoviário no trecho Hortolândia-SP."
        ),
        "capa_reference": "CAPA-2026-0042",
        "assigned_investigator": "Eng. Carlos Alberto Mendes",
    }


@pytest.fixture
def simulator():
    """Fresh SimulatorAPI instance."""
    return SimulatorAPI()


# ============================================
# Agent Availability Tests
# ============================================
class TestAgentAvailability:
    """Tests for is_agent_available()."""

    def test_available_with_key(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "test-api-key-123")
        assert is_agent_available() is True

    def test_unavailable_without_key(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        assert is_agent_available() is False

    def test_unavailable_with_empty_key(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "")
        assert is_agent_available() is False

    def test_unavailable_with_whitespace_key(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "   ")
        assert is_agent_available() is False


# ============================================
# CaseCreate Builder Tests
# ============================================
class TestBuildCaseCreate:
    """Tests for _build_case_create()."""

    def test_builds_complete_case(self, full_tool_results):
        case = _build_case_create(full_tool_results)

        assert isinstance(case, CaseCreate)
        assert case.product_brand == "CETAPHIL"
        assert case.product_name == "Gentle Skin Cleanser"
        assert case.customer_name == "Maria Silva"
        assert case.customer_email == "maria.silva42@gmail.com"
        assert case.customer_phone == "+55 11 98765-4321"
        assert case.category == "PACKAGING"
        assert case.case_type == "COMPLAINT"
        assert case.severity == "MEDIUM"
        assert case.lot_number == "LOT-2026-HRT-04521"
        assert case.manufacturing_site == "Hortolândia, SP, Brazil"
        assert case.sample_available is True
        assert case.adverse_event_flag is False
        assert case.regulatory_classification == "NONE"
        assert case.reporter_country == "Brasil"
        assert case.investigation_status == "COMPLETED"
        assert case.root_cause is not None
        assert case.capa_reference == "CAPA-2026-0042"
        assert case.assigned_investigator == "Eng. Carlos Alberto Mendes"
        assert case.sla_due_date == "2026-02-17"

    def test_handles_missing_optional_fields(self):
        minimal_results = {
            "product_brand": "DIFFERIN",
            "product_name": "Adapalene Gel 0.1%",
            "complaint_text": "Reclamação sobre o gel.",
            "customer_name": "Pedro Santos",
        }
        case = _build_case_create(minimal_results)

        assert case.product_brand == "DIFFERIN"
        assert case.customer_email is None
        assert case.lot_number is None
        assert case.root_cause is None

    def test_parses_received_date_iso(self, full_tool_results):
        case = _build_case_create(full_tool_results)
        assert case.received_date is not None
        assert isinstance(case.received_date, datetime)


# ============================================
# Service Integration Tests
# ============================================
class TestServiceAgentIntegration:
    """Tests for service.py generate_cases() with agent."""

    @pytest.mark.asyncio
    async def test_uses_agent_when_available(self, simulator, full_tool_results):
        """When agent is available, generation_method should be 'gemini_agent'."""
        mock_case_create = _build_case_create(full_tool_results)

        with (
            patch("src.sac.service.agent_client") as mock_client,
        ):
            mock_client.is_agent_available.return_value = True
            mock_client.generate_case_via_agent = AsyncMock(
                return_value=mock_case_create,
            )

            request = SACGenerateRequest(
                count=1,
                scenario_type=ScenarioType.RANDOM,
                use_agent=True,
            )
            response = await generate_cases(request, simulator)

        assert response.success is True
        assert response.generated_count == 1
        assert response.generation_method == "gemini_agent"
        assert len(response.case_ids) == 1
        mock_client.generate_case_via_agent.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_falls_back_to_template_when_no_key(self, simulator):
        """When agent is not available, should use template fallback."""
        with patch("src.sac.service.agent_client") as mock_client:
            mock_client.is_agent_available.return_value = False

            request = SACGenerateRequest(
                count=1,
                scenario_type=ScenarioType.RANDOM,
                use_agent=True,
            )
            response = await generate_cases(request, simulator)

        assert response.success is True
        assert response.generation_method == "template_fallback"

    @pytest.mark.asyncio
    async def test_falls_back_when_agent_fails(self, simulator):
        """When agent returns None, should fall back to template."""
        with patch("src.sac.service.agent_client") as mock_client:
            mock_client.is_agent_available.return_value = True
            mock_client.generate_case_via_agent = AsyncMock(return_value=None)

            request = SACGenerateRequest(
                count=1,
                scenario_type=ScenarioType.RANDOM,
                use_agent=True,
            )
            response = await generate_cases(request, simulator)

        assert response.success is True
        assert response.generation_method == "gemini_agent_partial"

    @pytest.mark.asyncio
    async def test_use_agent_false_skips_agent(self, simulator):
        """When use_agent=False, should not attempt agent generation."""
        with patch("src.sac.service.agent_client") as mock_client:
            mock_client.is_agent_available.return_value = True

            request = SACGenerateRequest(
                count=1,
                scenario_type=ScenarioType.RANDOM,
                use_agent=False,
            )
            response = await generate_cases(request, simulator)

        assert response.generation_method == "template_fallback"
        mock_client.generate_case_via_agent.assert_not_called()

    @pytest.mark.asyncio
    async def test_multiple_cases_all_agent(self, simulator, full_tool_results):
        """Multiple cases should all be generated via agent."""
        mock_case_create = _build_case_create(full_tool_results)

        with patch("src.sac.service.agent_client") as mock_client:
            mock_client.is_agent_available.return_value = True
            mock_client.generate_case_via_agent = AsyncMock(
                return_value=mock_case_create,
            )

            request = SACGenerateRequest(
                count=3,
                scenario_type=ScenarioType.RANDOM,
                use_agent=True,
            )
            response = await generate_cases(request, simulator)

        assert response.generated_count == 3
        assert response.generation_method == "gemini_agent"
        assert mock_client.generate_case_via_agent.await_count == 3


# ============================================
# Status Endpoint Tests
# ============================================
class TestGetStatus:
    """Tests for get_status()."""

    def test_status_reflects_agent_availability(self, monkeypatch):
        with patch("src.sac.service.agent_client") as mock_client:
            mock_client.is_agent_available.return_value = True
            status = get_status()
            assert status.agent_available is True
            assert status.fallback_mode is False

    def test_status_reflects_no_agent(self, monkeypatch):
        with patch("src.sac.service.agent_client") as mock_client:
            mock_client.is_agent_available.return_value = False
            status = get_status()
            assert status.agent_available is False
            assert status.fallback_mode is True


# ============================================
# SimulatorAPI Field Pass-Through Test
# ============================================
class TestSimulatorFieldPassThrough:
    """Verify create_case passes ALL CaseCreate fields through."""

    def test_all_investigation_fields_pass_through(self, simulator):
        """Regression test for the model_dump fix in api.py."""
        case_create = CaseCreate(
            product_brand="RESTYLANE",
            product_name="Restylane Lyft",
            complaint_text="Reação adversa após aplicação de Restylane.",
            customer_name="Ana Ferreira",
            customer_email="ana@test.com",
            customer_phone="+55 11 91234-5678",
            case_type="ADVERSE_EVENT",
            category="SAFETY",
            severity="CRITICAL",
            lot_number="LOT-2026-UPS-00123",
            manufacturing_site="Uppsala, Sweden",
            expiry_date="2027-03-01",
            sample_available=True,
            adverse_event_flag=True,
            regulatory_reportable=True,
            regulatory_classification="SERIOUS_AE",
            reporter_type="HCP",
            reporter_country="Brasil",
            received_channel="PHONE",
            sla_due_date="2026-02-10",
            investigation_status="IN_PROGRESS",
            root_cause="Análise em andamento — suspeita de lote com variação de cross-linking.",
            capa_reference="CAPA-2026-0099",
            assigned_investigator="Dra. Juliana Oliveira",
        )

        case, event = simulator.create_case(case_create)

        # Verify ALL fields pass through (not just the 11 original ones)
        assert case.root_cause == case_create.root_cause
        assert case.capa_reference == "CAPA-2026-0099"
        assert case.assigned_investigator == "Dra. Juliana Oliveira"
        assert case.investigation_status == "IN_PROGRESS"
        assert case.manufacturing_site == "Uppsala, Sweden"
        assert case.expiry_date == "2027-03-01"
        assert case.sample_available is True
        assert case.adverse_event_flag is True
        assert case.regulatory_reportable is True
        assert case.regulatory_classification == "SERIOUS_AE"
        assert case.reporter_type == "HCP"
        assert case.reporter_country == "Brasil"
        assert case.received_channel == "PHONE"
        assert case.sla_due_date == "2026-02-10"
        assert case.severity == "CRITICAL"

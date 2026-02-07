# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Module - Service Orchestrator
# ============================================
#
# Follows the Sandwich Pattern: CODE -> LLM -> CODE
# Uses Strands Agent (Gemini 3 Pro) when available,
# falls back to deterministic templates otherwise.
#
# ============================================

import logging
import time
from datetime import UTC, datetime

from src.sac import agent_client
from src.sac.models import (
    SACConfigureRequest,
    SACGenerateRequest,
    SACGenerateResponse,
    SACStatus,
    ScenarioTemplate,
    ScenarioType,
)
from src.sac.templates import generate_from_template
from src.simulator.api import SimulatorAPI
from src.simulator.models import CaseCreate, CaseType


logger = logging.getLogger(__name__)

# ============================================
# Multi-language inquiry follow-up text
# ============================================
INQUIRY_FOLLOWUP_TEXT: dict[str, str] = {
    "pt": (
        "Consulta de acompanhamento referente a reclamacao {case_id}. "
        "Cliente solicita atualizacao sobre o status da investigacao."
    ),
    "en": (
        "Follow-up inquiry regarding complaint {case_id}. "
        "Customer requests an update on the investigation status."
    ),
    "es": (
        "Consulta de seguimiento sobre la reclamacion {case_id}. "
        "El cliente solicita una actualizacion del estado de la investigacion."
    ),
    "fr": (
        "Demande de suivi concernant la reclamation {case_id}. "
        "Le client demande une mise a jour sur l'etat de l'enquete."
    ),
}

# ============================================
# Module-level session state
# ============================================
_sac_state: dict = {
    "total_generated": 0,
    "last_generation_at": None,
    "dynamo_enabled": False,
    "agent_available": None,  # Dynamically resolved via agent_client
    "default_scenario": None,
    "gemini_temperature": 0.8,
}

# ============================================
# Scenario Catalog
# ============================================
SCENARIO_CATALOG: list[ScenarioTemplate] = [
    ScenarioTemplate(
        scenario_type=ScenarioType.RECURRING_COMPLAINT,
        name_pt="Reclamacao Recorrente",
        name_en="Recurring Complaint",
        description_pt="Padrao detectavel pelo Detector de Recorrencia",
        description_en="Detectable pattern for the Recurring Detector agent",
        demo_impact="Triggers auto-close via pattern matching (confidence >= 0.90)",
        typical_count=3,
        triggers_agents=[
            "observer",
            "case_understanding",
            "recurring_detector",
            "compliance_guardian",
            "resolution_composer",
            "writeback",
        ],
    ),
    ScenarioTemplate(
        scenario_type=ScenarioType.ADVERSE_EVENT_HIGH,
        name_pt="Evento Adverso (Alta Severidade)",
        name_en="Adverse Event (High Severity)",
        description_pt="Caso de seguranca que exige Human-in-the-Loop",
        description_en="Safety case requiring Human-in-the-Loop escalation",
        demo_impact="Triggers HIL escalation — agent halts with PENDING_REVIEW",
        typical_count=1,
        triggers_agents=[
            "observer",
            "case_understanding",
            "compliance_guardian",
        ],
    ),
    ScenarioTemplate(
        scenario_type=ScenarioType.LINKED_INQUIRY,
        name_pt="Consulta Vinculada",
        name_en="Linked Inquiry",
        description_pt="Reclamacao + consulta vinculada — cascata do Inquiry Bridge",
        description_en="Complaint + linked inquiry — Inquiry Bridge cascade closure",
        demo_impact="Demonstrates auto-cascade: closing complaint auto-closes inquiry",
        typical_count=2,
        triggers_agents=[
            "observer",
            "case_understanding",
            "inquiry_bridge",
            "resolution_composer",
            "writeback",
        ],
    ),
    ScenarioTemplate(
        scenario_type=ScenarioType.MISSING_DATA,
        name_pt="Dados Incompletos",
        name_en="Missing Data",
        description_pt="Caso sem categoria e lote — agente deve solicitar informacoes",
        description_en="Case without category and lot — agent must request info",
        demo_impact="Triggers data enrichment flow and customer outreach",
        typical_count=1,
        triggers_agents=[
            "observer",
            "case_understanding",
        ],
    ),
    ScenarioTemplate(
        scenario_type=ScenarioType.MULTI_PRODUCT_BATCH,
        name_pt="Lote Multi-Produto",
        name_en="Multi-Product Batch",
        description_pt="Multiplos produtos aleatorios — estresse de volume",
        description_en="Multiple random products — volume stress test",
        demo_impact="Tests parallel processing and agent throughput",
        typical_count=5,
        triggers_agents=[
            "observer",
            "case_understanding",
            "recurring_detector",
            "compliance_guardian",
            "resolution_composer",
            "writeback",
        ],
    ),
    ScenarioTemplate(
        scenario_type=ScenarioType.RANDOM,
        name_pt="Aleatorio",
        name_en="Random",
        description_pt="Cenario completamente aleatorio para testes gerais",
        description_en="Fully random scenario for general testing",
        demo_impact="Unpredictable input — tests agent adaptability",
        typical_count=1,
        triggers_agents=[
            "observer",
            "case_understanding",
        ],
    ),
]


# ============================================
# Service Functions
# ============================================
async def generate_cases(
    request: SACGenerateRequest,
    simulator_api: SimulatorAPI,
) -> SACGenerateResponse:
    """Generate SAC cases using Strands Agent or template fallback.

    Follows Sandwich Pattern:
    - CODE Layer 1: Decide generation method (agent vs template)
    - LLM Layer: Strands Agent (Gemini 3 Pro) orchestrates 7 tools
    - CODE Layer 2: Validate + persist via SimulatorAPI pipeline

    Args:
        request: Generation request parameters.
        simulator_api: The simulator API instance for case creation.

    Returns:
        Response with generated case details.
    """
    start_time = time.monotonic()
    generated = []
    last_lang = "pt"

    # Decide generation method
    use_agent = request.use_agent and agent_client.is_agent_available()
    generation_method = "gemini_agent" if use_agent else "template_fallback"

    for i in range(request.count):
        case_create = None

        # Try agent generation first
        if use_agent:
            logger.info(
                "Generating case %d/%d via Strands agent (scenario=%s, brand=%s)",
                i + 1,
                request.count,
                request.scenario_type.value,
                request.product_brand,
            )
            case_create = await agent_client.generate_case_via_agent(
                scenario_type=request.scenario_type.value,
                product_brand=request.product_brand,
            )
            if case_create is None:
                logger.warning(
                    "Agent failed for case %d/%d, falling back to template",
                    i + 1,
                    request.count,
                )
                generation_method = "gemini_agent_partial"

        # Fallback to template if agent not used or failed
        if case_create is None:
            case_create, lang = generate_from_template(
                scenario_type=request.scenario_type.value,
                product_brand=request.product_brand,
            )
            last_lang = lang

        # CODE Layer 2: Create via existing pipeline (triggers WebSocket, events)
        case, _event = simulator_api.create_case(case_create)
        generated.append(case)

    # Handle LINKED_INQUIRY: create a second inquiry case linked to the first
    if request.scenario_type == ScenarioType.LINKED_INQUIRY and generated:
        first_case = generated[0]
        followup_text = INQUIRY_FOLLOWUP_TEXT.get(last_lang, INQUIRY_FOLLOWUP_TEXT["pt"])
        inquiry_create = CaseCreate(
            product_brand=first_case.product_brand,
            product_name=first_case.product_name,
            complaint_text=followup_text.format(case_id=first_case.case_id),
            customer_name=first_case.customer_name,
            customer_email=first_case.customer_email,
            case_type=CaseType.INQUIRY,
            category=first_case.category,
            linked_case_id=first_case.case_id,
        )
        inquiry_case, _event = simulator_api.create_case(inquiry_create)
        generated.append(inquiry_case)

    elapsed_ms = int((time.monotonic() - start_time) * 1000)
    _sac_state["total_generated"] += len(generated)
    _sac_state["last_generation_at"] = datetime.now(UTC)

    return SACGenerateResponse(
        success=True,
        generated_count=len(generated),
        case_ids=[c.case_id for c in generated],
        scenario_type=request.scenario_type.value,
        generation_method=generation_method,
        generation_time_ms=elapsed_ms,
        cases=[c.model_dump(mode="json") for c in generated],
    )


def get_status() -> SACStatus:
    """Get current SAC module status.

    Dynamically resolves agent availability by checking
    GEMINI_API_KEY presence via agent_client.

    Returns:
        SACStatus with agent availability and generation stats.
    """
    available = agent_client.is_agent_available()
    return SACStatus(
        agent_available=available,
        total_generated=_sac_state["total_generated"],
        last_generation_at=_sac_state["last_generation_at"],
        fallback_mode=not available,
        dynamo_enabled=_sac_state["dynamo_enabled"],
    )


def get_scenarios() -> list[ScenarioTemplate]:
    """Get the full scenario catalog.

    Returns:
        List of all available ScenarioTemplate definitions.
    """
    return SCENARIO_CATALOG


def configure(request: SACConfigureRequest) -> SACStatus:
    """Update SAC module configuration.

    Args:
        request: Configuration parameters to apply.

    Returns:
        Updated SACStatus reflecting new configuration.
    """
    _sac_state["dynamo_enabled"] = request.dynamo_enabled
    if request.default_scenario is not None:
        _sac_state["default_scenario"] = request.default_scenario.value
    _sac_state["gemini_temperature"] = request.gemini_temperature

    logger.info(
        "SAC configured: dynamo=%s, temperature=%.2f",
        request.dynamo_enabled,
        request.gemini_temperature,
    )

    return get_status()

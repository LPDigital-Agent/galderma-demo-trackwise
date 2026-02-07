# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Agent - In-Process Strands Agent Client
# ============================================
#
# Wraps a lightweight Strands Agent (Gemini 3 Pro)
# that calls 7 tools to generate complete SAC cases.
#
# Pattern: Lazy init + shared dict accumulator
#   - Agent created on first call, not at import
#   - Tools write to _current_generation dict
#   - Client reads merged results after execution
#   - Falls back to None on any failure (template
#     fallback handled by service.py)
#
# ============================================

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime
from typing import Any

from src.sac.agent_prompts import SYSTEM_PROMPT, build_generation_prompt
from src.sac.agent_tools import (
    assess_regulatory_impact,
    determine_severity,
    generate_complaint_text,
    generate_customer_profile,
    generate_investigation_data,
    generate_lot_and_manufacturing,
    get_generation_results,
    reset_generation,
    select_product,
)
from src.simulator.models import CaseCreate


logger = logging.getLogger(__name__)

# ============================================
# Agent Singleton (lazy init)
# ============================================
_agent_instance = None
_agent_init_error: str | None = None

# Timeout for a single agent generation call (seconds)
AGENT_TIMEOUT_SECONDS = 45


def is_agent_available() -> bool:
    """Check if the Gemini agent can be used.

    Returns True when GEMINI_API_KEY is set in environment.
    Does NOT initialize the agent — that happens on first call.
    """
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    return len(key) > 0


def _get_or_create_agent():
    """Lazy-init the Strands Agent with all 7 SAC tools.

    Returns the agent instance or raises on failure.
    Thread-safe in practice because FastAPI runs in a
    single-threaded asyncio loop for in-process calls.
    """
    global _agent_instance, _agent_init_error

    if _agent_instance is not None:
        return _agent_instance

    if _agent_init_error is not None:
        raise RuntimeError(f"Agent init previously failed: {_agent_init_error}")

    try:
        from strands import Agent
        from strands.models.gemini import GeminiModel

        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key.strip():
            msg = "GEMINI_API_KEY not set"
            _agent_init_error = msg
            raise RuntimeError(msg)

        model = GeminiModel(
            client_args={"api_key": api_key},
            model_id="gemini-3-pro-preview",
            params={
                "temperature": 0.8,
                "max_output_tokens": 4096,
                "top_p": 0.95,
            },
        )

        _agent_instance = Agent(
            name="sac_generator_backend",
            system_prompt=SYSTEM_PROMPT,
            model=model,
            tools=[
                select_product,
                generate_customer_profile,
                generate_lot_and_manufacturing,
                generate_complaint_text,
                determine_severity,
                assess_regulatory_impact,
                generate_investigation_data,
            ],
        )

        logger.info("SAC Strands Agent initialized (Gemini 3 Pro, temp=0.8)")
        return _agent_instance

    except Exception as exc:
        _agent_init_error = str(exc)
        logger.error("Failed to initialize SAC agent: %s", exc)
        raise


def _build_case_create(results: dict[str, Any]) -> CaseCreate:
    """Map merged tool results to a CaseCreate Pydantic model.

    The results dict contains keys from all 7 tools, merged via
    _current_generation. This function maps them to CaseCreate
    field names, handling any key differences.

    Args:
        results: Merged dict from get_generation_results().

    Returns:
        A fully populated CaseCreate ready for SimulatorAPI.
    """
    # Map investigation_status string to the enum-compatible value
    inv_status = results.get("investigation_status", "NOT_STARTED")

    # Build CaseCreate with all available fields
    return CaseCreate(
        # Core fields (from select_product + generate_complaint_text)
        product_brand=results["product_brand"],
        product_name=results["product_name"],
        complaint_text=results["complaint_text"],
        case_type=results.get("case_type", "COMPLAINT"),
        category=results.get("category"),
        # Customer (from generate_customer_profile)
        customer_name=results["customer_name"],
        customer_email=results.get("customer_email"),
        customer_phone=results.get("customer_phone"),
        # Severity (from determine_severity)
        severity=results.get("severity"),
        # Manufacturing (from generate_lot_and_manufacturing)
        lot_number=results.get("lot_number"),
        manufacturing_site=results.get("manufacturing_site"),
        expiry_date=results.get("expiry_date"),
        sample_available=results.get("sample_available"),
        # Regulatory (from assess_regulatory_impact)
        adverse_event_flag=results.get("adverse_event_flag"),
        regulatory_reportable=results.get("regulatory_reportable"),
        regulatory_classification=results.get("regulatory_classification"),
        reporter_type=results.get("reporter_type"),
        reporter_country=results.get("reporter_country"),
        received_channel=results.get("received_channel"),
        received_date=(
            datetime.fromisoformat(results["received_date"])
            if results.get("received_date")
            else None
        ),
        sla_due_date=results.get("sla_due_date"),
        # Investigation (from generate_investigation_data)
        investigation_status=inv_status,
        root_cause=results.get("root_cause"),
        capa_reference=results.get("capa_reference"),
        assigned_investigator=results.get("assigned_investigator"),
    )


def _run_agent_sync(prompt: str) -> dict[str, Any]:
    """Run the Strands agent synchronously and return tool results.

    Strands Agent.__call__ is synchronous (blocking I/O to Gemini API).
    This function handles the reset → call → collect cycle.

    Args:
        prompt: The generation prompt for this case.

    Returns:
        Merged dict of all tool results.

    Raises:
        RuntimeError: If agent fails or produces no results.
    """
    agent = _get_or_create_agent()

    # Clear accumulator before the new generation
    reset_generation()

    # Call the agent — Strands handles the tool-call loop internally
    agent(prompt)

    # Collect all tool-written results
    gen_results = get_generation_results()

    # Validate minimum required fields are present
    required_keys = {"product_brand", "product_name", "complaint_text", "customer_name"}
    missing = required_keys - gen_results.keys()
    if missing:
        raise RuntimeError(
            f"Agent did not produce required fields: {missing}. "
            f"Got keys: {list(gen_results.keys())}"
        )

    logger.info(
        "Agent generated case: brand=%s, product=%s, category=%s, severity=%s, "
        "investigation=%s, fields=%d",
        gen_results.get("product_brand"),
        gen_results.get("product_name"),
        gen_results.get("category"),
        gen_results.get("severity"),
        gen_results.get("investigation_status"),
        len(gen_results),
    )

    return gen_results


async def generate_case_via_agent(
    scenario_type: str,
    product_brand: str | None = None,
) -> CaseCreate | None:
    """Generate a single case using the Strands agent.

    This is the main entry point called by service.py.
    Runs the synchronous agent call in an executor thread
    to avoid blocking the FastAPI event loop, with a timeout.

    Args:
        scenario_type: ScenarioType value (e.g., 'RANDOM').
        product_brand: Optional brand filter.

    Returns:
        CaseCreate on success, None on any failure.
    """
    try:
        prompt = build_generation_prompt(scenario_type, product_brand)

        # Run sync agent in thread pool with timeout
        loop = asyncio.get_running_loop()
        gen_results = await asyncio.wait_for(
            loop.run_in_executor(None, _run_agent_sync, prompt),
            timeout=AGENT_TIMEOUT_SECONDS,
        )

        case_create = _build_case_create(gen_results)
        return case_create

    except TimeoutError:
        logger.warning(
            "Agent timed out after %ds for scenario=%s brand=%s",
            AGENT_TIMEOUT_SECONDS,
            scenario_type,
            product_brand,
        )
        return None

    except Exception:
        logger.exception(
            "Agent generation failed for scenario=%s brand=%s",
            scenario_type,
            product_brand,
        )
        return None

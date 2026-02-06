# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Generator Agent - Strands Agent with Gemini 3 Pro
# ============================================
#
# Generates realistic Brazilian consumer complaint
# cases for the Galderma product portfolio.
#
# Model: Gemini 3 Pro (via Strands GeminiModel provider)
# Memory Access: None (stateless generator)
#
# Sandwich Pattern:
#   CODE layer: tools.py (deterministic product/customer/severity)
#   LLM layer:  Gemini 3 Pro (complaint text generation in PT-BR)
#   CODE layer: tools.py (validation + structuring)
#
# ============================================

from __future__ import annotations

import json
import logging
import os
from typing import Any

from strands import Agent
from strands.models.gemini import GeminiModel

from sac_generator.prompts import SYSTEM_PROMPT
from sac_generator.scenarios import SCENARIO_PROMPTS, ScenarioType
from sac_generator.tools import (
    determine_severity,
    generate_complaint_text,
    generate_customer_profile,
    select_product,
)


# ============================================
# Configuration
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "agent": "sac_generator", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("sac_generator")


# ============================================
# Gemini 3 Pro Model Provider
# ============================================
def _build_gemini_model() -> GeminiModel:
    """Build the Gemini 3 Pro model provider.

    Returns:
        Configured GeminiModel instance.

    Raises:
        ValueError: If GEMINI_API_KEY environment variable is not set.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set — agent will fail on invocation")

    return GeminiModel(
        client_args={"api_key": api_key},
        model_id="gemini-3-pro",
        params={
            "temperature": 0.8,
            "max_output_tokens": 4096,
            "top_p": 0.95,
        },
    )


gemini_model = _build_gemini_model()


# ============================================
# Create the Strands Agent
# ============================================
sac_generator = Agent(
    name="sac_generator",
    system_prompt=SYSTEM_PROMPT,
    model=gemini_model,
    tools=[
        generate_complaint_text,
        generate_customer_profile,
        determine_severity,
        select_product,
    ],
)


# ============================================
# Prompt Builder
# ============================================
def _build_prompt(
    scenario_type: str,
    product_brand: str | None,
    count: int,
) -> str:
    """Build the generation prompt from parameters.

    Args:
        scenario_type: ScenarioType value or string.
        product_brand: Optional brand filter (e.g., 'CETAPHIL').
        count: Number of complaints to generate.

    Returns:
        Formatted prompt string for the agent.
    """
    # Resolve scenario prompt fragment
    try:
        scenario = ScenarioType(scenario_type)
    except ValueError:
        scenario = ScenarioType.RANDOM

    scenario_instruction = SCENARIO_PROMPTS[scenario]

    brand_line = f"Product brand filter: {product_brand}" if product_brand else "Product: Select randomly from the Galderma portfolio"
    count_word = "complaint" if count == 1 else "complaints"

    return f"""Generate {count} realistic Galderma SAC {count_word}.

## Scenario
{scenario_instruction}

## Constraints
{brand_line}
Scenario type: {scenario.value}

## Steps (for EACH complaint):
1. Call `select_product` to choose a Galderma product{' from brand ' + product_brand if product_brand else ''}
2. Call `generate_customer_profile` to create a Brazilian customer
3. Write a realistic complaint text in PT-BR (2-5 sentences, natural consumer language)
4. Call `generate_complaint_text` with the product info, category, scenario type, and your generated text
5. Call `determine_severity` with the category, case type, and symptom flags

Return ALL generated cases with their complete data."""


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Invoke the SAC Generator agent.

    Args:
        payload: Dict with keys:
            - scenario_type: ScenarioType value (default: 'RANDOM')
            - product_brand: Optional brand filter (e.g., 'CETAPHIL')
            - count: Number of cases to generate (default: 1, max: 10)

    Returns:
        Dict with success flag, generated case data, and metadata.
    """
    scenario_type = payload.get("scenario_type", ScenarioType.RANDOM)
    product_brand = payload.get("product_brand")
    count = min(max(int(payload.get("count", 1)), 1), 10)

    logger.info(
        json.dumps({
            "event": "invoke_start",
            "scenario_type": str(scenario_type),
            "product_brand": product_brand,
            "count": count,
        })
    )

    prompt = _build_prompt(scenario_type, product_brand, count)

    try:
        result = sac_generator(prompt)

        output = result.message if hasattr(result, "message") else str(result)

        logger.info(
            json.dumps({
                "event": "invoke_success",
                "scenario_type": str(scenario_type),
                "output_length": len(str(output)),
            })
        )

        return {
            "success": True,
            "scenario_type": str(scenario_type),
            "count_requested": count,
            "result": output,
        }

    except Exception as e:
        logger.error(f"SAC Generator failed: {e!s}")
        return {
            "success": False,
            "error": str(e),
            "scenario_type": str(scenario_type),
        }


# ============================================
# Main (for local testing)
# ============================================
if __name__ == "__main__":
    test_payload = {
        "scenario_type": "RANDOM",
        "product_brand": "CETAPHIL",
        "count": 1,
    }

    result = invoke(test_payload)
    print(json.dumps(result, indent=2, ensure_ascii=False))

# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Generator - Scenario Definitions
# ============================================
#
# Defines scenario types and their corresponding
# prompt fragments used by the LLM to generate
# contextually appropriate complaint texts.
#
# ============================================

from enum import StrEnum


class ScenarioType(StrEnum):
    """Scenario types for SAC complaint generation."""

    RECURRING_COMPLAINT = "RECURRING_COMPLAINT"
    ADVERSE_EVENT_HIGH = "ADVERSE_EVENT_HIGH"
    LINKED_INQUIRY = "LINKED_INQUIRY"
    MISSING_DATA = "MISSING_DATA"
    MULTI_PRODUCT_BATCH = "MULTI_PRODUCT_BATCH"
    RANDOM = "RANDOM"


SCENARIO_PROMPTS: dict[ScenarioType, str] = {
    ScenarioType.RECURRING_COMPLAINT: (
        "Generate a complaint about broken packaging seal or damaged container. "
        "The customer has experienced this issue MULTIPLE TIMES with the same product line. "
        "Include frustration language and mention of previous occurrences. "
        "Category MUST be PACKAGING."
    ),
    ScenarioType.ADVERSE_EVENT_HIGH: (
        "Generate an adverse event report with physical symptoms (skin irritation, redness, "
        "swelling, allergic reaction). The customer describes a SERIOUS adverse reaction "
        "after using the product. Include specific symptoms, timeline of onset, and body area "
        "affected. Category MUST be SAFETY. This is high severity."
    ),
    ScenarioType.LINKED_INQUIRY: (
        "Generate a complaint that also contains a question or inquiry. The customer is "
        "reporting an issue AND asking about product compatibility, usage instructions, or "
        "alternative products. The complaint should naturally blend a question into the "
        "complaint narrative. Category should be EFFICACY or QUALITY."
    ),
    ScenarioType.MISSING_DATA: (
        "Generate a complaint with intentionally vague or missing details. The customer "
        "does NOT mention the specific product name, lot number, or purchase date. "
        "The complaint is short (1-2 sentences) and lacks actionable information. "
        "Category should be OTHER."
    ),
    ScenarioType.MULTI_PRODUCT_BATCH: (
        "Generate a complaint involving MULTIPLE Galderma products used together. "
        "The customer describes an issue that arose from combining two or more products "
        "from the same or different brands (e.g., cleanser + moisturizer). "
        "Category should be EFFICACY or SAFETY."
    ),
    ScenarioType.RANDOM: (
        "Generate a realistic consumer complaint about any issue: packaging defect, "
        "product quality concern, efficacy doubt, shipping damage, documentation problem, "
        "or safety concern. Choose a realistic scenario that a Brazilian consumer would "
        "report to a pharmaceutical SAC hotline."
    ),
}

# ============================================
# Galderma TrackWise AI Autopilot Demo
# Case Understanding Agent - Classifier
# ============================================
#
# The Case Understanding agent is the FIRST SPECIALIST in the workflow.
# It receives events from Observer and performs deep case analysis.
#
# Responsibilities:
# - Extract product, category, severity from case data
# - Classify complaint type using Galderma taxonomy
# - Query PolicyKnowledge memory for classification rules
# - Emit structured CaseAnalysis to Recurring Detector
#
# Model: Claude 4.5 Haiku (fast classification)
# Memory Access: PolicyKnowledge (READ only)
# ============================================

import json
import logging
import os
from datetime import datetime
from typing import Any, Optional

from strands import Agent, tool
from strands.agent.hooks import AfterInvocationEvent, BeforeInvocationEvent
from ulid import ULID

from shared.config import AgentConfig, GALDERMA_PRODUCTS, get_product_line
from shared.models.analysis import CaseAnalysis, SeverityLevel, RecommendedAction
from shared.models.case import CaseType, CaseSnapshot
from shared.tools.memory import memory_query
from shared.tools.a2a import call_specialist_agent, get_agent_card
from shared.tools.ledger import write_ledger_entry

# ============================================
# Configuration
# ============================================
config = AgentConfig(name="case_understanding")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "case_understanding", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("case_understanding")

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Case Understanding Agent for the Galderma TrackWise AI Autopilot system.

Your role is to ANALYZE and CLASSIFY incoming TrackWise cases with high accuracy.

## Your Responsibilities:
1. OBSERVE: Receive case data from Observer agent
2. THINK: Extract key information and classify the case
3. LEARN: Query PolicyKnowledge memory for classification rules
4. ACT: Emit CaseAnalysis to Recurring Detector

## Galderma Product Taxonomy:

### CETAPHIL (Skincare)
- Cetaphil Gentle Skin Cleanser
- Cetaphil Moisturizing Lotion
- Cetaphil Daily Facial Cleanser
- Cetaphil Moisturizing Cream
- Cetaphil PRO

### DIFFERIN (Acne Treatment)
- Differin Gel 0.1%
- Differin Cleanser
- Differin Moisturizer
- Differin Dark Spot Corrector

### EPIDUO (Prescription Acne)
- Epiduo Gel
- Epiduo Forte

### ALASTIN (Professional Skincare)
- Alastin Skincare Restorative Skin Complex
- Alastin HydraTint Pro Mineral Sunscreen
- Alastin Gentle Cleanser

### RESTYLANE (Injectable Fillers)
- Restylane
- Restylane Lyft
- Restylane Silk
- Restylane Defyne
- Restylane Refyne

## Complaint Categories:
- PACKAGING: Damaged packaging, seal issues, labeling problems
- QUALITY: Product consistency, color, texture, smell issues
- EFFICACY: Product not working as expected
- ADVERSE_REACTION: Skin reaction, irritation, allergic response
- CONTAMINATION: Foreign material, contamination suspected
- SHIPPING: Delivery issues, wrong product, missing items
- OTHER: Any other complaint type

## Severity Assessment Rules:

| Severity | Criteria |
|----------|----------|
| LOW | Packaging issues, minor shipping problems, cosmetic defects |
| MEDIUM | Quality concerns, efficacy questions, non-serious reactions |
| HIGH | Adverse reactions requiring medical attention, contamination |
| CRITICAL | Serious adverse events, hospitalization, life-threatening |

## Automatic Escalation Triggers:
- Keywords: "hospital", "emergency", "allergic", "swelling", "breathing"
- Product: RESTYLANE (injectable) with any adverse reaction
- Any mention of medical professional involvement

## Tools Available:
- classify_product: Identify Galderma product from description
- assess_severity: Determine severity level
- extract_complaint_category: Classify complaint type
- memory_query: Query PolicyKnowledge for classification rules
- call_specialist_agent: Route to Recurring Detector
- write_ledger_entry: Log classification decision

## Output Format:
Always produce a structured CaseAnalysis with:
- product: Galderma product name
- product_line: CETAPHIL, DIFFERIN, EPIDUO, ALASTIN, or RESTYLANE
- category: Complaint category
- severity: LOW, MEDIUM, HIGH, or CRITICAL
- confidence: 0.0-1.0 classification confidence
- key_phrases: Important phrases extracted
- requires_escalation: Boolean
- escalation_reason: If escalation needed
- recommendation: AUTO_CLOSE, HUMAN_REVIEW, or ESCALATE

## Important Rules:
- ALWAYS classify severity conservatively (when in doubt, go higher)
- ALWAYS check for adverse reaction keywords
- ALWAYS query PolicyKnowledge for product-specific rules
- NEVER auto-recommend closure for HIGH/CRITICAL severity
- INJECTABLE products (Restylane) require extra scrutiny

You are the first line of intelligent triage. Classify accurately and safely.
"""


# ============================================
# Case Understanding Tools
# ============================================
@tool
def classify_product(description: str) -> dict[str, Any]:
    """Identify the Galderma product from case description.

    Args:
        description: Case description text

    Returns:
        Product classification with confidence
    """
    description_lower = description.lower()

    # Check each product line
    for line, products in GALDERMA_PRODUCTS.items():
        # Check product line name
        if line.lower() in description_lower:
            # Find specific product
            for product in products:
                if product.lower() in description_lower:
                    return {
                        "found": True,
                        "product": product,
                        "product_line": line,
                        "confidence": 0.95,
                    }
            # Line found but not specific product
            return {
                "found": True,
                "product": products[0],  # Default to first in line
                "product_line": line,
                "confidence": 0.75,
            }

        # Check individual products
        for product in products:
            if product.lower() in description_lower:
                return {
                    "found": True,
                    "product": product,
                    "product_line": line,
                    "confidence": 0.90,
                }

    return {
        "found": False,
        "product": "Unknown Product",
        "product_line": "UNKNOWN",
        "confidence": 0.0,
    }


@tool
def assess_severity(
    description: str,
    product_line: str,
    category: str,
) -> dict[str, Any]:
    """Assess the severity level of a complaint.

    Args:
        description: Case description
        product_line: Galderma product line
        category: Complaint category

    Returns:
        Severity assessment with reasoning
    """
    description_lower = description.lower()

    # Critical keywords - immediate escalation
    critical_keywords = [
        "hospital", "emergency", "life-threatening", "died", "death",
        "anaphylaxis", "anaphylactic", "difficulty breathing", "cant breathe",
        "heart", "seizure", "unconscious", "coma"
    ]

    # High severity keywords
    high_keywords = [
        "allergic reaction", "severe reaction", "swelling", "blisters",
        "medical attention", "doctor", "urgent care", "burning sensation",
        "infection", "hospitalized", "er visit", "emergency room"
    ]

    # Medium severity keywords
    medium_keywords = [
        "rash", "irritation", "redness", "itching", "discomfort",
        "not working", "ineffective", "disappointed", "quality issue"
    ]

    # Check for critical indicators
    for keyword in critical_keywords:
        if keyword in description_lower:
            return {
                "severity": "CRITICAL",
                "confidence": 0.95,
                "reasoning": f"Critical keyword detected: {keyword}",
                "requires_immediate_escalation": True,
            }

    # Restylane (injectable) with any adverse reaction is HIGH minimum
    if product_line == "RESTYLANE":
        adverse_keywords = ["reaction", "swelling", "pain", "bruise", "lump", "infection"]
        for keyword in adverse_keywords:
            if keyword in description_lower:
                return {
                    "severity": "HIGH",
                    "confidence": 0.90,
                    "reasoning": f"Injectable product with adverse indicator: {keyword}",
                    "requires_immediate_escalation": True,
                }

    # Check for high severity
    for keyword in high_keywords:
        if keyword in description_lower:
            return {
                "severity": "HIGH",
                "confidence": 0.85,
                "reasoning": f"High severity keyword detected: {keyword}",
                "requires_immediate_escalation": False,
            }

    # Check for medium severity
    for keyword in medium_keywords:
        if keyword in description_lower:
            return {
                "severity": "MEDIUM",
                "confidence": 0.80,
                "reasoning": f"Medium severity indicator: {keyword}",
                "requires_immediate_escalation": False,
            }

    # Adverse reaction category always starts at MEDIUM minimum
    if category == "ADVERSE_REACTION":
        return {
            "severity": "MEDIUM",
            "confidence": 0.75,
            "reasoning": "Adverse reaction category requires at least MEDIUM severity",
            "requires_immediate_escalation": False,
        }

    # Default to LOW
    return {
        "severity": "LOW",
        "confidence": 0.85,
        "reasoning": "No elevated severity indicators found",
        "requires_immediate_escalation": False,
    }


@tool
def extract_complaint_category(description: str) -> dict[str, Any]:
    """Extract the complaint category from description.

    Args:
        description: Case description text

    Returns:
        Category with confidence
    """
    description_lower = description.lower()

    # Category keywords mapping
    categories = {
        "CONTAMINATION": [
            "contaminated", "foreign object", "foreign material", "mold",
            "bacteria", "dirty", "unclean", "particle", "debris"
        ],
        "ADVERSE_REACTION": [
            "reaction", "allergic", "rash", "irritation", "swelling",
            "burning", "itching", "redness", "breakout", "hives"
        ],
        "PACKAGING": [
            "packaging", "seal", "broken seal", "damaged", "leak",
            "label", "cap", "pump", "dispenser", "container"
        ],
        "QUALITY": [
            "consistency", "texture", "color", "smell", "odor",
            "separated", "expired", "changed", "different"
        ],
        "EFFICACY": [
            "not working", "ineffective", "no results", "doesn't work",
            "no improvement", "waste of money", "disappointed"
        ],
        "SHIPPING": [
            "shipping", "delivery", "wrong product", "missing",
            "late", "damaged in transit", "never received"
        ],
    }

    # Check each category
    category_scores: dict[str, int] = {}
    for category, keywords in categories.items():
        score = sum(1 for kw in keywords if kw in description_lower)
        if score > 0:
            category_scores[category] = score

    if category_scores:
        best_category = max(category_scores, key=category_scores.get)
        confidence = min(0.95, 0.60 + (category_scores[best_category] * 0.10))
        return {
            "category": best_category,
            "confidence": confidence,
            "matches": category_scores,
        }

    return {
        "category": "OTHER",
        "confidence": 0.50,
        "matches": {},
    }


@tool
def extract_key_phrases(description: str) -> dict[str, Any]:
    """Extract important key phrases from description.

    Args:
        description: Case description text

    Returns:
        List of key phrases
    """
    # Important phrase patterns
    phrases = []

    # Product mentions
    for line, products in GALDERMA_PRODUCTS.items():
        for product in products:
            if product.lower() in description.lower():
                phrases.append(f"Product: {product}")

    # Severity indicators
    severity_words = [
        "severe", "serious", "emergency", "urgent", "immediately",
        "hospital", "doctor", "allergic", "reaction"
    ]
    for word in severity_words:
        if word in description.lower():
            phrases.append(f"Severity indicator: {word}")

    # Time references
    time_words = ["today", "yesterday", "last week", "recently", "just"]
    for word in time_words:
        if word in description.lower():
            phrases.append(f"Time reference: {word}")

    return {
        "key_phrases": phrases[:10],  # Limit to 10
        "total_found": len(phrases),
    }


@tool
def create_case_analysis(
    case_id: str,
    run_id: str,
    product: str,
    product_line: str,
    category: str,
    severity: str,
    confidence: float,
    key_phrases: list[str],
    requires_escalation: bool,
    escalation_reason: Optional[str] = None,
) -> dict[str, Any]:
    """Create structured CaseAnalysis output.

    Args:
        case_id: TrackWise case ID
        run_id: Current run ID
        product: Galderma product name
        product_line: Product line (CETAPHIL, etc.)
        category: Complaint category
        severity: Severity level
        confidence: Overall confidence score
        key_phrases: Extracted key phrases
        requires_escalation: Whether escalation is needed
        escalation_reason: Reason for escalation if required

    Returns:
        Structured CaseAnalysis
    """
    # Determine recommendation based on severity and confidence
    if severity in ["HIGH", "CRITICAL"] or requires_escalation:
        recommendation = "ESCALATE"
    elif confidence >= 0.85 and severity == "LOW":
        recommendation = "AUTO_CLOSE"
    else:
        recommendation = "HUMAN_REVIEW"

    analysis = {
        "case_id": case_id,
        "run_id": run_id,
        "product": product,
        "product_line": product_line,
        "category": category,
        "severity": severity,
        "confidence": confidence,
        "key_phrases": key_phrases,
        "requires_escalation": requires_escalation,
        "escalation_reason": escalation_reason,
        "recommendation": recommendation,
        "analyzed_at": datetime.utcnow().isoformat(),
        "agent": "case_understanding",
    }

    return {
        "success": True,
        "analysis": analysis,
    }


# ============================================
# Hooks for Observability
# ============================================
def on_before_invocation(event: BeforeInvocationEvent):
    """Log invocation start."""
    logger.info(
        json.dumps(
            {
                "event": "invocation_started",
                "session_id": event.agent.state.get("session_id"),
            }
        )
    )


def on_after_invocation(event: AfterInvocationEvent):
    """Log invocation completion."""
    logger.info(
        json.dumps(
            {
                "event": "invocation_completed",
                "session_id": event.agent.state.get("session_id"),
                "duration_ms": getattr(event, "duration_ms", 0),
                "stop_reason": event.stop_reason,
            }
        )
    )


# ============================================
# Create Agent
# ============================================
case_understanding = Agent(
    name="case_understanding",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model_id(),
    tools=[
        classify_product,
        assess_severity,
        extract_complaint_category,
        extract_key_phrases,
        create_case_analysis,
        memory_query,
        call_specialist_agent,
        get_agent_card,
        write_ledger_entry,
    ],
    state={
        "agent_name": "case_understanding",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
case_understanding.on("before_invocation", on_before_invocation)
case_understanding.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with case data

    Returns:
        CaseAnalysis result
    """
    try:
        # Extract case from payload
        case_data = payload.get("case") or payload.get("inputText", "")
        run_id = payload.get("run_id", str(ULID()))

        if isinstance(case_data, dict):
            case_json = json.dumps(case_data)
        else:
            case_json = case_data

        # Create session ID for tracing
        session_id = str(ULID())
        case_understanding.state.set("session_id", session_id)
        case_understanding.state.set("run_id", run_id)

        # Invoke agent with the case
        prompt = f"""Analyze the following TrackWise case:

{case_json}

Run ID: {run_id}

1. Classify the product using classify_product
2. Extract the complaint category using extract_complaint_category
3. Assess severity using assess_severity
4. Extract key phrases using extract_key_phrases
5. Query PolicyKnowledge memory for any product-specific rules
6. Create structured CaseAnalysis using create_case_analysis
7. Log the analysis to the decision ledger
8. Route to recurring_detector agent

Report the complete CaseAnalysis."""

        result = case_understanding(prompt)

        return {
            "success": True,
            "session_id": session_id,
            "run_id": run_id,
            "output": result.message if hasattr(result, "message") else str(result),
        }

    except Exception as e:
        logger.error(f"Invocation failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
        }


# ============================================
# Main (for local testing)
# ============================================
if __name__ == "__main__":
    # Test case
    test_case = {
        "case_id": "TW-2026-001234",
        "case_type": "COMPLAINT",
        "product": "Cetaphil Moisturizing Lotion",
        "description": "The packaging seal was broken when I received the product. The pump also doesn't work properly.",
        "severity": "LOW",
        "status": "OPEN",
    }

    result = invoke({"case": test_case, "run_id": "01JCTEST0001"})
    print(json.dumps(result, indent=2))

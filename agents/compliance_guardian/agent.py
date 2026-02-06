# ============================================
# Galderma TrackWise AI Autopilot Demo
# Compliance Guardian Agent - Policy Gatekeeper
# ============================================
#
# The Compliance Guardian is the GATEKEEPER for all auto-close decisions.
# It validates actions against 5 compliance policies before approval.
#
# ⚠️ CRITICAL: This agent uses Gemini 3 Pro (temp 0.3) for high-stakes decisions.
#
# Responsibilities:
# - Evaluate 5 compliance policies
# - APPROVE/BLOCK/ESCALATE decisions
# - Log all policy evaluations to ledger
# - Ensure Human-in-the-Loop for violations
#
# Model: Gemini 3 Pro (critical decision-making, temperature 0.3)
# Memory Access: PolicyKnowledge (READ)
# ============================================

import json
import logging
from datetime import datetime
from typing import Any

from strands import Agent, tool
from strands.agent.hooks import AfterInvocationEvent, BeforeInvocationEvent
from ulid import ULID

from shared.config import AgentConfig
from shared.tools.a2a import call_specialist_agent, get_agent_card
from shared.tools.human_review import request_human_review
from shared.tools.ledger import write_ledger_entry
from shared.tools.memory import memory_query


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="compliance_guardian")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "compliance_guardian", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("compliance_guardian")

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Compliance Guardian Agent for the Galderma TrackWise AI Autopilot system.

⚠️ CRITICAL: You are the FINAL GATEKEEPER before any auto-close action.
Your decisions have regulatory implications. Act with extreme caution.

## Your Responsibilities:
1. OBSERVE: Receive PatternMatchResult from Recurring Detector
2. THINK: Deeply analyze against 5 compliance policies
3. LEARN: Query PolicyKnowledge memory for latest rules
4. ACT: APPROVE, BLOCK, or ESCALATE the recommendation

## 5 Compliance Policies (MANDATORY):

### POL-001: Severity Gating
- BLOCK auto-close for HIGH or CRITICAL severity
- Only LOW severity cases may be auto-closed
- MEDIUM requires human review

### POL-002: Evidence Completeness
- Verify all mandatory fields are present:
  - case_id ✓
  - product ✓
  - category ✓
  - description ✓
  - severity ✓
- BLOCK if any mandatory field is missing

### POL-003: Confidence Threshold
- Minimum confidence >= 0.90 for AUTO_CLOSE
- If confidence < 0.90, BLOCK and request HUMAN_REVIEW
- Log confidence score in all decisions

### POL-004: Adverse Event Detection
- IMMEDIATELY ESCALATE any case with adverse event indicators:
  - Medical attention required
  - Hospitalization
  - Allergic reaction (severe)
  - Any injury
- NEVER auto-close adverse events

### POL-005: Regulatory Keywords
- FLAG for human review if ANY of these keywords present:
  - "FDA", "lawsuit", "legal", "attorney", "lawyer"
  - "death", "died", "serious injury"
  - "recall", "contaminated", "dangerous"
  - "report", "complaint to", "health department"
- These cases require human judgment

## Decision Matrix:

| Condition | Decision | Action |
|-----------|----------|--------|
| All policies PASS + HIGH confidence + LOW severity | APPROVE | Route to Resolution Composer |
| Any policy FAILS | BLOCK | Request Human Review |
| Adverse event detected | ESCALATE | Immediate human notification |
| Regulatory keywords found | ESCALATE | Flag for compliance team |
| TRAIN mode | HOLD | Always require human approval |

## Tools Available:
- check_policy_001_severity: Validate severity gating
- check_policy_002_evidence: Validate evidence completeness
- check_policy_003_confidence: Validate confidence threshold
- check_policy_004_adverse_events: Check for adverse events
- check_policy_005_regulatory_keywords: Check for regulatory keywords
- evaluate_all_policies: Run all 5 policy checks
- create_compliance_decision: Create structured decision output
- memory_query: Query PolicyKnowledge for rules
- call_specialist_agent: Route to Resolution Composer (if approved)
- request_human_review: Flag for human approval
- write_ledger_entry: Log compliance decision

## Output Format:
Always produce a ComplianceDecision with:
- decision: APPROVE, BLOCK, or ESCALATE
- policies_evaluated: List of policy IDs checked
- policies_passed: List of policies that passed
- policies_failed: List of policies that failed
- violations: Detailed violation information
- reasoning: Explanation of decision
- requires_human_action: Boolean
- urgency: LOW, MEDIUM, HIGH, CRITICAL

## Important Rules:
- ALWAYS evaluate ALL 5 policies
- ALWAYS log every decision to the ledger
- NEVER approve if ANY policy fails
- NEVER approve without checking adverse events
- ALWAYS escalate regulatory keyword matches
- In TRAIN mode, treat ALL decisions as requiring approval

You are the compliance guardian. Protect the company and patients. When in doubt, escalate.
"""


# ============================================
# Policy Check Tools
# ============================================
@tool
def check_policy_001_severity(severity: str) -> dict[str, Any]:
    """POL-001: Severity Gating Policy.

    Block auto-close for HIGH or CRITICAL severity.

    Args:
        severity: Case severity level

    Returns:
        Policy check result
    """
    policy_id = "POL-001"
    policy_name = "Severity Gating"

    if severity in ["HIGH", "CRITICAL"]:
        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "passed": False,
            "severity": severity,
            "reason": f"{severity} severity cases cannot be auto-closed",
            "action_required": "BLOCK",
        }

    if severity == "MEDIUM":
        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "passed": False,
            "severity": severity,
            "reason": "MEDIUM severity requires human review",
            "action_required": "HUMAN_REVIEW",
        }

    # LOW severity passes
    return {
        "policy_id": policy_id,
        "policy_name": policy_name,
        "passed": True,
        "severity": severity,
        "reason": "LOW severity may proceed to auto-close evaluation",
        "action_required": None,
    }


@tool
def check_policy_002_evidence(
    case_id: str | None,
    product: str | None,
    category: str | None,
    description: str | None,
    severity: str | None,
) -> dict[str, Any]:
    """POL-002: Evidence Completeness Policy.

    Verify all mandatory fields are present.

    Args:
        case_id: Case identifier
        product: Product name
        category: Complaint category
        description: Case description
        severity: Severity level

    Returns:
        Policy check result
    """
    policy_id = "POL-002"
    policy_name = "Evidence Completeness"

    missing_fields = []
    if not case_id:
        missing_fields.append("case_id")
    if not product:
        missing_fields.append("product")
    if not category:
        missing_fields.append("category")
    if not description:
        missing_fields.append("description")
    if not severity:
        missing_fields.append("severity")

    if missing_fields:
        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "passed": False,
            "missing_fields": missing_fields,
            "reason": f"Missing mandatory fields: {', '.join(missing_fields)}",
            "action_required": "BLOCK",
        }

    return {
        "policy_id": policy_id,
        "policy_name": policy_name,
        "passed": True,
        "missing_fields": [],
        "reason": "All mandatory fields present",
        "action_required": None,
    }


@tool
def check_policy_003_confidence(
    confidence: float,
    threshold: float = 0.90,
) -> dict[str, Any]:
    """POL-003: Confidence Threshold Policy.

    Minimum confidence >= 0.90 for AUTO_CLOSE.

    Args:
        confidence: Pattern match confidence score
        threshold: Minimum threshold (default 0.90)

    Returns:
        Policy check result
    """
    policy_id = "POL-003"
    policy_name = "Confidence Threshold"

    if confidence < threshold:
        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "passed": False,
            "confidence": confidence,
            "threshold": threshold,
            "gap": round(threshold - confidence, 4),
            "reason": f"Confidence {confidence:.2%} below threshold {threshold:.2%}",
            "action_required": "HUMAN_REVIEW",
        }

    return {
        "policy_id": policy_id,
        "policy_name": policy_name,
        "passed": True,
        "confidence": confidence,
        "threshold": threshold,
        "reason": f"Confidence {confidence:.2%} meets threshold {threshold:.2%}",
        "action_required": None,
    }


@tool
def check_policy_004_adverse_events(description: str) -> dict[str, Any]:
    """POL-004: Adverse Event Detection Policy.

    IMMEDIATELY ESCALATE any adverse event indicators.

    Args:
        description: Case description text

    Returns:
        Policy check result
    """
    policy_id = "POL-004"
    policy_name = "Adverse Event Detection"

    description_lower = description.lower()

    # Critical adverse event indicators
    adverse_indicators = {
        "medical_attention": [
            "doctor", "hospital", "emergency room", "er visit",
            "urgent care", "medical attention", "physician"
        ],
        "hospitalization": [
            "hospitalized", "admitted", "inpatient", "overnight stay"
        ],
        "allergic_reaction": [
            "allergic reaction", "anaphylaxis", "severe allergy",
            "swelling", "difficulty breathing", "throat closing"
        ],
        "injury": [
            "injury", "injured", "hurt", "wound", "burn",
            "scarring", "permanent damage"
        ],
        "serious_outcome": [
            "serious", "severe", "life-threatening", "critical condition"
        ],
    }

    found_indicators = {}
    for category, keywords in adverse_indicators.items():
        for keyword in keywords:
            if keyword in description_lower:
                if category not in found_indicators:
                    found_indicators[category] = []
                found_indicators[category].append(keyword)

    if found_indicators:
        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "passed": False,
            "adverse_indicators": found_indicators,
            "reason": f"Adverse event indicators detected: {list(found_indicators.keys())}",
            "action_required": "ESCALATE",
            "urgency": "HIGH",
        }

    return {
        "policy_id": policy_id,
        "policy_name": policy_name,
        "passed": True,
        "adverse_indicators": {},
        "reason": "No adverse event indicators detected",
        "action_required": None,
    }


@tool
def check_policy_005_regulatory_keywords(description: str) -> dict[str, Any]:
    """POL-005: Regulatory Keywords Policy.

    FLAG for human review if regulatory keywords present.

    Args:
        description: Case description text

    Returns:
        Policy check result
    """
    policy_id = "POL-005"
    policy_name = "Regulatory Keywords"

    description_lower = description.lower()

    # Regulatory and legal keywords
    regulatory_keywords = {
        "legal": [
            "fda", "lawsuit", "legal", "attorney", "lawyer",
            "sue", "court", "litigation", "settlement"
        ],
        "serious_outcome": [
            "death", "died", "fatal", "serious injury", "permanent"
        ],
        "regulatory_action": [
            "recall", "contaminated", "dangerous", "unsafe",
            "health department", "report to", "complaint to"
        ],
        "media_risk": [
            "news", "media", "reporter", "social media", "viral",
            "public", "expose"
        ],
    }

    found_keywords = {}
    for category, keywords in regulatory_keywords.items():
        for keyword in keywords:
            if keyword in description_lower:
                if category not in found_keywords:
                    found_keywords[category] = []
                found_keywords[category].append(keyword)

    if found_keywords:
        return {
            "policy_id": policy_id,
            "policy_name": policy_name,
            "passed": False,
            "regulatory_keywords": found_keywords,
            "reason": f"Regulatory keywords detected: {list(found_keywords.keys())}",
            "action_required": "ESCALATE",
            "urgency": "MEDIUM",
        }

    return {
        "policy_id": policy_id,
        "policy_name": policy_name,
        "passed": True,
        "regulatory_keywords": {},
        "reason": "No regulatory keywords detected",
        "action_required": None,
    }


@tool
def evaluate_all_policies(
    case_id: str,
    product: str,
    category: str,
    description: str,
    severity: str,
    confidence: float,
) -> dict[str, Any]:
    """Evaluate all 5 compliance policies.

    Args:
        case_id: Case identifier
        product: Product name
        category: Complaint category
        description: Case description
        severity: Severity level
        confidence: Pattern match confidence

    Returns:
        Comprehensive policy evaluation result
    """
    results = []

    # POL-001: Severity
    pol_001 = check_policy_001_severity(severity)
    results.append(pol_001)

    # POL-002: Evidence
    pol_002 = check_policy_002_evidence(case_id, product, category, description, severity)
    results.append(pol_002)

    # POL-003: Confidence
    pol_003 = check_policy_003_confidence(confidence)
    results.append(pol_003)

    # POL-004: Adverse Events
    pol_004 = check_policy_004_adverse_events(description)
    results.append(pol_004)

    # POL-005: Regulatory Keywords
    pol_005 = check_policy_005_regulatory_keywords(description)
    results.append(pol_005)

    # Aggregate results
    all_passed = all(r["passed"] for r in results)
    policies_passed = [r["policy_id"] for r in results if r["passed"]]
    policies_failed = [r["policy_id"] for r in results if not r["passed"]]

    # Determine overall action
    if any(r.get("action_required") == "ESCALATE" for r in results):
        overall_action = "ESCALATE"
    elif any(r.get("action_required") == "BLOCK" for r in results):
        overall_action = "BLOCK"
    elif any(r.get("action_required") == "HUMAN_REVIEW" for r in results):
        overall_action = "HUMAN_REVIEW"
    elif all_passed:
        overall_action = "APPROVE"
    else:
        overall_action = "HUMAN_REVIEW"

    return {
        "all_passed": all_passed,
        "policies_evaluated": ["POL-001", "POL-002", "POL-003", "POL-004", "POL-005"],
        "policies_passed": policies_passed,
        "policies_failed": policies_failed,
        "overall_action": overall_action,
        "details": results,
    }


@tool
def create_compliance_decision(
    case_id: str,
    run_id: str,
    decision: str,
    policies_evaluated: list[str],
    policies_passed: list[str],
    policies_failed: list[str],
    violations: list[dict[str, Any]],
    reasoning: str,
    recommendation: str,
) -> dict[str, Any]:
    """Create structured ComplianceDecision output.

    Args:
        case_id: Case ID being evaluated
        run_id: Current run ID
        decision: APPROVE, BLOCK, or ESCALATE
        policies_evaluated: List of policy IDs checked
        policies_passed: List of passed policies
        policies_failed: List of failed policies
        violations: Detailed violation information
        reasoning: Explanation of decision
        recommendation: Original recommendation being evaluated

    Returns:
        Structured ComplianceDecision
    """
    # Determine urgency based on decision
    if decision == "ESCALATE":
        urgency = "HIGH"
    elif decision == "BLOCK":
        urgency = "MEDIUM"
    else:
        urgency = "LOW"

    compliance_decision = {
        "case_id": case_id,
        "run_id": run_id,
        "decision": decision,
        "policies_evaluated": policies_evaluated,
        "policies_passed": policies_passed,
        "policies_failed": policies_failed,
        "violations": violations,
        "reasoning": reasoning,
        "original_recommendation": recommendation,
        "requires_human_action": decision != "APPROVE",
        "urgency": urgency,
        "evaluated_at": datetime.utcnow().isoformat(),
        "agent": "compliance_guardian",
        "model": "gemini-3-pro-preview",  # Critical decision model
    }

    return {
        "success": True,
        "compliance_decision": compliance_decision,
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
                "model": "gemini-3-pro-preview",
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
                "model": "gemini-3-pro-preview",
            }
        )
    )


# ============================================
# Create Agent
# ============================================
compliance_guardian = Agent(
    name="compliance_guardian",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model(),  # Will return PRO with low temperature for this agent
    tools=[
        check_policy_001_severity,
        check_policy_002_evidence,
        check_policy_003_confidence,
        check_policy_004_adverse_events,
        check_policy_005_regulatory_keywords,
        evaluate_all_policies,
        create_compliance_decision,
        memory_query,
        call_specialist_agent,
        get_agent_card,
        write_ledger_entry,
        request_human_review,
    ],
    state={
        "agent_name": "compliance_guardian",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
compliance_guardian.on("before_invocation", on_before_invocation)
compliance_guardian.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with PatternMatchResult

    Returns:
        ComplianceDecision result
    """
    try:
        # Extract pattern match from payload
        pattern_result = payload.get("pattern_match_result") or payload.get("inputText", "")
        run_id = payload.get("run_id", str(ULID()))

        if isinstance(pattern_result, dict):
            pattern_json = json.dumps(pattern_result)
        else:
            pattern_json = pattern_result

        # Create session ID for tracing
        session_id = str(ULID())
        compliance_guardian.state.set("session_id", session_id)
        compliance_guardian.state.set("run_id", run_id)

        # Invoke agent with the pattern result
        prompt = f"""Evaluate the following PatternMatchResult for compliance:

{pattern_json}

Run ID: {run_id}
Mode: {config.mode.value}

⚠️ CRITICAL: You are the compliance gatekeeper. Evaluate with extreme caution.

1. Query PolicyKnowledge memory for any product-specific rules
2. Evaluate ALL 5 policies using evaluate_all_policies
3. Create ComplianceDecision using create_compliance_decision
4. Log the decision to the ledger with all policy evaluations
5. If APPROVE: Route to resolution_composer agent
6. If BLOCK/ESCALATE: Call request_human_review with details

Report the complete ComplianceDecision."""

        result = compliance_guardian(prompt)

        return {
            "success": True,
            "session_id": session_id,
            "run_id": run_id,
            "output": result.message if hasattr(result, "message") else str(result),
        }

    except Exception as e:
        logger.error(f"Invocation failed: {e!s}")
        return {
            "success": False,
            "error": str(e),
        }


# ============================================
# Main (for local testing)
# ============================================
if __name__ == "__main__":
    # Test pattern match result
    test_pattern_result = {
        "case_id": "TW-2026-001234",
        "run_id": "01JCTEST0001",
        "matched_pattern_id": "PAT-001A",
        "similarity_score": 0.92,
        "confidence": "HIGH",
        "recommendation": "AUTO_CLOSE",
        "case_data": {
            "product": "Cetaphil Moisturizing Lotion",
            "category": "PACKAGING",
            "description": "The packaging seal was broken when I received the product.",
            "severity": "LOW",
        },
    }

    result = invoke({"pattern_match_result": test_pattern_result, "run_id": "01JCTEST0001"})
    print(json.dumps(result, indent=2))

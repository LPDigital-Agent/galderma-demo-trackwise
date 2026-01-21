# ============================================
# Galderma TrackWise AI Autopilot Demo
# Inquiry Bridge Agent - Linked Case Handler
# ============================================
#
# The Inquiry Bridge handles FactoryComplaintClosed events
# and manages the relationship between complaints and inquiries.
#
# Responsibilities:
# - Detect inquiry-linked complaints
# - Handle FactoryComplaintClosed → linked inquiry closure
# - Coordinate cascade closures
# - Query RecurringPatterns for linked resolutions
#
# Model: Claude 4.5 Haiku (fast coordination)
# Memory Access: RecurringPatterns (READ)
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
from shared.tools.simulator import get_case, list_cases


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="inquiry_bridge")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "inquiry_bridge", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("inquiry_bridge")

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Inquiry Bridge Agent for the Galderma TrackWise AI Autopilot system.

Your role is to COORDINATE linked cases between complaints and inquiries.

## Your Responsibilities:
1. OBSERVE: Receive FactoryComplaintClosed events
2. THINK: Determine if there are linked inquiries
3. LEARN: Query RecurringPatterns for linked resolution patterns
4. ACT: Trigger cascade closure if appropriate

## TrackWise Case Relationships:

In TrackWise, cases can be linked:
- Complaint → Inquiry (customer inquiry leads to formal complaint)
- Factory Complaint → Consumer Complaint (factory investigates, then closes)
- Parent Case → Child Cases (hierarchical relationship)

## Event Handling:

### FactoryComplaintClosed Event
When a factory complaint is closed:
1. Check for linked consumer inquiries
2. If linked inquiry exists and is still OPEN:
   - Inherit resolution from factory complaint
   - Route to compliance_guardian for approval
   - Then to resolution_composer for customer communication
3. If no linked inquiry, log and complete

### InquiryClosed Event
When an inquiry is closed directly:
1. Check for linked complaints
2. If complaint exists, ensure it's also addressed
3. Log the closure chain

## Linked Case Detection:

Cases are linked via:
- linked_case_id field
- parent_case_id field
- reference_id field
- Similar product + customer + timeframe

## Tools Available:
- get_linked_cases: Find all cases linked to a given case
- check_closure_eligibility: Determine if linked case can be closed
- create_cascade_closure_request: Request closure of linked cases
- get_case: Get case details from TrackWise Simulator
- list_cases: List cases with filters
- memory_query: Query RecurringPatterns for linked patterns
- call_specialist_agent: Route to other agents
- request_human_review: Flag for human approval
- write_ledger_entry: Log bridge decisions

## Output Format:
Always produce a BridgeDecision with:
- source_case_id: The triggering case
- linked_cases: List of linked case IDs
- cascade_action: CLOSE_LINKED, HOLD, ESCALATE
- resolutions_to_apply: Resolutions for each linked case
- requires_human_approval: Boolean

## Important Rules:
- ALWAYS check for linked cases before completing
- ALWAYS verify linked case status before cascade closure
- NEVER cascade close HIGH/CRITICAL severity cases automatically
- ALWAYS use the factory complaint's resolution for linked inquiries
- ALWAYS log the entire closure chain

You are the bridge between internal and external case workflows. Coordinate carefully.
"""


# ============================================
# Inquiry Bridge Tools
# ============================================
@tool
def get_linked_cases(case_id: str) -> dict[str, Any]:
    """Find all cases linked to a given case.

    Args:
        case_id: Source case ID

    Returns:
        List of linked cases with their relationship type
    """
    try:
        # Get the source case
        source = get_case(case_id)
        if not source.get("success"):
            return {
                "success": False,
                "error": f"Failed to get source case: {case_id}",
                "linked_cases": [],
            }

        source_case = source.get("case", {})
        linked_cases = []

        # Check for explicit links
        linked_case_id = source_case.get("linked_case_id")
        if linked_case_id:
            linked = get_case(linked_case_id)
            if linked.get("success"):
                linked_cases.append({
                    "case_id": linked_case_id,
                    "relationship": "LINKED",
                    "case_data": linked.get("case"),
                })

        # Check for parent case
        parent_case_id = source_case.get("parent_case_id")
        if parent_case_id:
            parent = get_case(parent_case_id)
            if parent.get("success"):
                linked_cases.append({
                    "case_id": parent_case_id,
                    "relationship": "PARENT",
                    "case_data": parent.get("case"),
                })

        # Search for cases referencing this one
        reference_search = list_cases(limit=10)
        if reference_search.get("success"):
            for case in reference_search.get("cases", []):
                if case.get("linked_case_id") == case_id:
                    linked_cases.append({
                        "case_id": case.get("case_id"),
                        "relationship": "CHILD",
                        "case_data": case,
                    })

        return {
            "success": True,
            "source_case_id": case_id,
            "linked_cases": linked_cases,
            "total_linked": len(linked_cases),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "linked_cases": [],
        }


@tool
def check_closure_eligibility(
    case_id: str,
    case_type: str,
    status: str,
    severity: str,
) -> dict[str, Any]:
    """Check if a linked case is eligible for cascade closure.

    Args:
        case_id: Case to check
        case_type: Type of case (COMPLAINT, INQUIRY)
        status: Current status
        severity: Case severity

    Returns:
        Eligibility result with reasoning
    """
    # Must be OPEN to close
    if status not in ["OPEN", "IN_PROGRESS"]:
        return {
            "eligible": False,
            "case_id": case_id,
            "reason": f"Case status '{status}' is not closeable",
        }

    # HIGH/CRITICAL require human approval
    if severity in ["HIGH", "CRITICAL"]:
        return {
            "eligible": False,
            "case_id": case_id,
            "reason": f"Severity '{severity}' requires human approval for cascade closure",
            "requires_human_approval": True,
        }

    # INQUIRY can be auto-closed if linked complaint resolved
    if case_type == "INQUIRY" and severity in ["LOW", "MEDIUM"]:
        return {
            "eligible": True,
            "case_id": case_id,
            "reason": "Inquiry eligible for cascade closure from resolved complaint",
        }

    # COMPLAINT requires more scrutiny
    if case_type == "COMPLAINT":
        return {
            "eligible": False,
            "case_id": case_id,
            "reason": "Complaints require individual review even when linked",
            "requires_human_approval": True,
        }

    return {
        "eligible": True,
        "case_id": case_id,
        "reason": "Case eligible for cascade closure",
    }


@tool
def create_cascade_closure_request(
    source_case_id: str,
    source_resolution: str,
    source_resolution_code: str,
    linked_cases: list[dict[str, Any]],
) -> dict[str, Any]:
    """Create a request to cascade close linked cases.

    Args:
        source_case_id: The triggering case (already closed)
        source_resolution: Resolution from source case
        source_resolution_code: Resolution code from source
        linked_cases: List of linked cases to potentially close

    Returns:
        Cascade closure request with actions per case
    """
    closure_actions = []

    for linked in linked_cases:
        case_data = linked.get("case_data", {})
        case_id = linked.get("case_id")
        relationship = linked.get("relationship")

        # Check eligibility
        eligibility = check_closure_eligibility(
            case_id=case_id,
            case_type=case_data.get("case_type", "UNKNOWN"),
            status=case_data.get("status", "UNKNOWN"),
            severity=case_data.get("severity", "UNKNOWN"),
        )

        # Customize resolution for linked case
        linked_resolution = f"{source_resolution} (Resolved via linked case {source_case_id})"

        action = {
            "case_id": case_id,
            "relationship": relationship,
            "current_status": case_data.get("status"),
            "severity": case_data.get("severity"),
            "eligible": eligibility.get("eligible"),
            "reason": eligibility.get("reason"),
            "proposed_resolution": linked_resolution if eligibility.get("eligible") else None,
            "proposed_resolution_code": source_resolution_code if eligibility.get("eligible") else None,
            "requires_human_approval": eligibility.get("requires_human_approval", False),
        }
        closure_actions.append(action)

    # Determine overall action
    all_eligible = all(a["eligible"] for a in closure_actions) if closure_actions else False
    any_requires_approval = any(a.get("requires_human_approval") for a in closure_actions)

    if not closure_actions:
        cascade_action = "NO_LINKED_CASES"
    elif all_eligible and not any_requires_approval:
        cascade_action = "CLOSE_LINKED"
    elif any_requires_approval:
        cascade_action = "REQUIRES_APPROVAL"
    else:
        cascade_action = "HOLD"

    return {
        "success": True,
        "source_case_id": source_case_id,
        "cascade_action": cascade_action,
        "closure_actions": closure_actions,
        "total_linked": len(closure_actions),
        "eligible_count": sum(1 for a in closure_actions if a["eligible"]),
        "requires_approval": any_requires_approval,
    }


@tool
def create_bridge_decision(
    run_id: str,
    source_case_id: str,
    event_type: str,
    linked_cases: list[dict[str, Any]],
    cascade_action: str,
    closure_actions: list[dict[str, Any]],
    requires_human_approval: bool,
) -> dict[str, Any]:
    """Create structured BridgeDecision output.

    Args:
        run_id: Current run ID
        source_case_id: Triggering case ID
        event_type: Type of triggering event
        linked_cases: List of linked cases found
        cascade_action: Determined action
        closure_actions: Actions per linked case
        requires_human_approval: Whether approval needed

    Returns:
        Structured BridgeDecision
    """
    bridge_decision = {
        "run_id": run_id,
        "source_case_id": source_case_id,
        "event_type": event_type,
        "linked_cases": [lc.get("case_id") for lc in linked_cases],
        "total_linked": len(linked_cases),
        "cascade_action": cascade_action,
        "closure_actions": closure_actions,
        "requires_human_approval": requires_human_approval,
        "decided_at": datetime.utcnow().isoformat(),
        "agent": "inquiry_bridge",
    }

    return {
        "success": True,
        "bridge_decision": bridge_decision,
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
inquiry_bridge = Agent(
    name="inquiry_bridge",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model_id(),
    tools=[
        get_linked_cases,
        check_closure_eligibility,
        create_cascade_closure_request,
        create_bridge_decision,
        get_case,
        list_cases,
        memory_query,
        call_specialist_agent,
        get_agent_card,
        write_ledger_entry,
        request_human_review,
    ],
    state={
        "agent_name": "inquiry_bridge",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
inquiry_bridge.on("before_invocation", on_before_invocation)
inquiry_bridge.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with event data

    Returns:
        BridgeDecision result
    """
    try:
        # Extract event from payload
        event_data = payload.get("event") or payload.get("inputText", "")
        run_id = payload.get("run_id", str(ULID()))

        event_json = json.dumps(event_data) if isinstance(event_data, dict) else event_data

        # Create session ID for tracing
        session_id = str(ULID())
        inquiry_bridge.state.set("session_id", session_id)
        inquiry_bridge.state.set("run_id", run_id)

        # Invoke agent with the event
        prompt = f"""Process the following event for linked case handling:

{event_json}

Run ID: {run_id}

1. Identify the source case from the event
2. Find all linked cases using get_linked_cases
3. For each linked case, check closure eligibility
4. If FactoryComplaintClosed, create cascade closure request
5. Query RecurringPatterns for similar linked resolutions
6. Create BridgeDecision using create_bridge_decision
7. Log the decision to the ledger
8. If cascade closure approved, route linked cases to compliance_guardian
9. If requires approval, call request_human_review

Report the complete BridgeDecision."""

        result = inquiry_bridge(prompt)

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
    # Test event
    test_event = {
        "event_type": "FactoryComplaintClosed",
        "case_id": "FC-2026-001234",
        "resolution": "Investigation complete. No product defect found. Packaging issue in transit.",
        "resolution_code": "FC-PKG-TRANSIT-001",
        "linked_case_id": "INQ-2026-005678",
    }

    result = invoke({"event": test_event, "run_id": "01JCTEST0001"})
    print(json.dumps(result, indent=2))

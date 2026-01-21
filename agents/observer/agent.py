# ============================================
# Galderma TrackWise AI Autopilot Demo
# Observer Agent - Orchestrator
# ============================================
#
# The Observer is the ORCHESTRATOR in the Multi-Agent pattern.
# It receives TrackWise events and routes them to specialist agents.
#
# Responsibilities:
# - Validate incoming EventEnvelope
# - Determine event type and routing
# - Invoke specialist agents via A2A
# - Track run lifecycle
#
# Model: Claude 4.5 Haiku (fast routing decisions)
# Memory Access: None (stateless router)
# ============================================

import json
import logging
from datetime import datetime
from typing import Any

from strands import Agent, tool
from strands.agent.hooks import AfterInvocationEvent, BeforeInvocationEvent
from ulid import ULID

from shared.config import AgentConfig
from shared.models.event import EventEnvelope, EventType
from shared.models.run import Run, RunStatus
from shared.tools.a2a import call_specialist_agent, get_agent_card
from shared.tools.ledger import write_ledger_entry


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="observer")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "observer", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("observer")

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Observer Agent for the Galderma TrackWise AI Autopilot system.

Your role is to ORCHESTRATE the processing of TrackWise events by routing them to specialist agents.

## Your Responsibilities:
1. OBSERVE: Receive and validate incoming TrackWise events
2. THINK: Determine the appropriate routing based on event type
3. LEARN: N/A (you are a stateless router)
4. ACT: Invoke the correct specialist agent via A2A

## Event Routing Rules:

| Event Type | Route To | Priority |
|------------|----------|----------|
| ComplaintCreated | case_understanding | HIGH |
| ComplaintUpdated | case_understanding | MEDIUM |
| ComplaintClosed | writeback | LOW |
| FactoryComplaintClosed | inquiry_bridge | HIGH |
| InquiryCreated | case_understanding | MEDIUM |
| InquiryClosed | writeback | LOW |
| CaseCreated | case_understanding | MEDIUM |
| CaseUpdated | case_understanding | LOW |
| CaseClosed | writeback | LOW |

## Processing Flow:

1. For new complaints (ComplaintCreated):
   - Route to case_understanding for analysis
   - Case Understanding will then route to recurring_detector
   - Flow continues: compliance_guardian → resolution_composer → writeback

2. For factory complaint closure (FactoryComplaintClosed):
   - Route to inquiry_bridge to check for linked inquiries
   - May trigger additional closure workflow

3. For direct closures:
   - Route to writeback for final processing

## Tools Available:
- call_specialist_agent: Invoke any specialist agent
- get_agent_card: Get agent capabilities
- write_ledger_entry: Log routing decisions
- create_run: Create a new run record
- update_run: Update run status

## Important Rules:
- ALWAYS validate the event envelope before routing
- ALWAYS log routing decisions to the ledger
- ALWAYS create a run record for new events
- NEVER process events directly - delegate to specialists
- NEVER skip compliance_guardian for auto-close decisions

You are the traffic controller of the agent mesh. Route efficiently and accurately.
"""


# ============================================
# Observer-Specific Tools
# ============================================
@tool
def validate_event(event_json: str) -> dict[str, Any]:
    """Validate an incoming TrackWise event envelope.

    Args:
        event_json: JSON string of the event envelope

    Returns:
        Validation result with parsed event or errors
    """
    try:
        # Parse JSON
        data = json.loads(event_json)

        # Parse as EventEnvelope
        envelope = EventEnvelope(**data)

        return {
            "valid": True,
            "envelope_id": envelope.envelope_id,
            "event_type": envelope.event.event_type.value,
            "case_id": envelope.event.case_id,
            "priority": envelope.priority,
            "requires_opus": envelope.requires_opus,
            "parsed_event": envelope.model_dump(),
        }

    except json.JSONDecodeError as e:
        return {
            "valid": False,
            "error": f"Invalid JSON: {e!s}",
        }
    except Exception as e:
        return {
            "valid": False,
            "error": f"Validation failed: {e!s}",
        }


@tool
def create_run(
    case_id: str,
    event_type: str,
    mode: str = "ACT",
) -> dict[str, Any]:
    """Create a new run record for event processing.

    Args:
        case_id: TrackWise case ID
        event_type: Type of event triggering this run
        mode: Execution mode (OBSERVE, TRAIN, ACT)

    Returns:
        Created run with run_id
    """
    try:
        import boto3

        run_id = str(ULID())
        timestamp = datetime.utcnow()

        run = Run(
            run_id=run_id,
            case_id=case_id,
            status=RunStatus.STARTED,
            mode=mode,
            created_at=timestamp,
            agents_invoked=["observer"],
        )

        # Write to DynamoDB
        dynamodb = boto3.resource("dynamodb", region_name=config.aws_region)
        table = dynamodb.Table(config.runs_table_name or "galderma-trackwise-dev-runs")

        item = run.model_dump()
        item["created_at"] = run.created_at.isoformat()
        item["status"] = run.status.value

        table.put_item(Item=item)

        return {
            "success": True,
            "run_id": run_id,
            "case_id": case_id,
            "status": "STARTED",
            "mode": mode,
            "created_at": timestamp.isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@tool
def determine_routing(event_type: str) -> dict[str, Any]:
    """Determine which agent to route an event to.

    Args:
        event_type: TrackWise event type

    Returns:
        Routing decision with target agent
    """
    # Routing table
    routing_table = {
        EventType.COMPLAINT_CREATED.value: {
            "target": "case_understanding",
            "priority": 2,
            "reason": "New complaint requires classification and analysis",
        },
        EventType.COMPLAINT_UPDATED.value: {
            "target": "case_understanding",
            "priority": 4,
            "reason": "Updated complaint may need re-classification",
        },
        EventType.COMPLAINT_CLOSED.value: {
            "target": "writeback",
            "priority": 6,
            "reason": "Closed complaint needs ledger update",
        },
        EventType.FACTORY_COMPLAINT_CLOSED.value: {
            "target": "inquiry_bridge",
            "priority": 1,
            "reason": "Factory closure may trigger linked inquiry closure",
        },
        EventType.INQUIRY_CREATED.value: {
            "target": "case_understanding",
            "priority": 5,
            "reason": "New inquiry needs classification",
        },
        EventType.INQUIRY_CLOSED.value: {
            "target": "writeback",
            "priority": 7,
            "reason": "Closed inquiry needs ledger update",
        },
        EventType.CASE_CREATED.value: {
            "target": "case_understanding",
            "priority": 4,
            "reason": "New case needs classification",
        },
        EventType.CASE_UPDATED.value: {
            "target": "case_understanding",
            "priority": 6,
            "reason": "Updated case may need re-evaluation",
        },
        EventType.CASE_CLOSED.value: {
            "target": "writeback",
            "priority": 7,
            "reason": "Closed case needs final logging",
        },
    }

    route = routing_table.get(event_type)

    if route:
        return {
            "found": True,
            "target_agent": route["target"],
            "priority": route["priority"],
            "reason": route["reason"],
        }
    else:
        return {
            "found": False,
            "error": f"Unknown event type: {event_type}",
            "known_types": list(routing_table.keys()),
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
observer = Agent(
    name="observer",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model_id(),
    tools=[
        validate_event,
        create_run,
        determine_routing,
        call_specialist_agent,
        get_agent_card,
        write_ledger_entry,
    ],
    state={
        "agent_name": "observer",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
observer.on("before_invocation", on_before_invocation)
observer.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with event data

    Returns:
        Processing result
    """
    try:
        # Extract event from payload
        event_json = payload.get("event") or payload.get("inputText", "")

        if isinstance(event_json, dict):
            event_json = json.dumps(event_json)

        # Create session ID for tracing
        session_id = str(ULID())
        observer.state.set("session_id", session_id)

        # Invoke agent with the event
        prompt = f"""Process the following TrackWise event:

{event_json}

1. Validate the event
2. Create a run record
3. Determine routing
4. Call the appropriate specialist agent
5. Log the routing decision to the ledger

Report the result."""

        result = observer(prompt)

        return {
            "success": True,
            "session_id": session_id,
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
        "envelope_id": "01JCTEST0001",
        "timestamp": datetime.utcnow().isoformat(),
        "event": {
            "event_type": "ComplaintCreated",
            "case_id": "TW-2026-001234",
            "case_snapshot": {
                "case_type": "COMPLAINT",
                "product": "Cetaphil Moisturizing Lotion",
                "description": "Packaging seal was broken on arrival",
                "severity": "LOW",
            },
        },
    }

    result = invoke({"event": test_event})
    print(json.dumps(result, indent=2))

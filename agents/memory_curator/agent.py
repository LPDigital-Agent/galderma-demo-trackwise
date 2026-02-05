# ============================================
# Galderma TrackWise AI Autopilot Demo
# Memory Curator Agent - Learning Orchestrator
# ============================================
#
# The Memory Curator manages the learning cycle.
# It processes human feedback to improve pattern matching.
#
# Responsibilities:
# - Process APPROVE/REJECT/CORRECT feedback
# - Update confidence scores based on feedback
# - Write new patterns when approved
# - Maintain memory version history
#
# Model: Claude 4.5 Haiku (fast processing)
# Memory Access: ALL (READ + WRITE)
# ============================================

import json
import logging
from datetime import datetime
from typing import Any

from strands import Agent, tool
from strands.agent.hooks import AfterInvocationEvent, BeforeInvocationEvent
from ulid import ULID

from shared.config import AgentConfig
from shared.tools.ledger import write_ledger_entry
from shared.tools.memory import memory_delete, memory_query, memory_write


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="memory_curator")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "memory_curator", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("memory_curator")

# ============================================
# Confidence Adjustment Constants
# ============================================
CONFIDENCE_BOOST_APPROVE = 0.05  # +5% on approval
CONFIDENCE_PENALTY_REJECT = -0.10  # -10% on rejection
CONFIDENCE_RESET_CORRECT = 0.50  # Reset to 50% on correction
MIN_CONFIDENCE = 0.10
MAX_CONFIDENCE = 0.99

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Memory Curator Agent for the Galderma TrackWise AI Autopilot system.

Your role is to MANAGE THE LEARNING CYCLE through memory updates.

## Your Responsibilities:
1. OBSERVE: Receive feedback events from human reviewers
2. THINK: Analyze feedback impact on patterns
3. LEARN: Query existing patterns, compute confidence delta
4. ACT: Write/update memory entries

## Feedback Types:

### APPROVE
- Human approves AI recommendation
- Confidence boost: +5%
- Pattern strengthened

### REJECT
- Human rejects AI recommendation
- Confidence penalty: -10%
- Pattern weakened

### CORRECT
- Human provides corrected recommendation
- Confidence reset to 50%
- Pattern updated with correction

## Memory Strategies:

| Strategy | Purpose | Actions |
|----------|---------|---------|
| RecurringPatterns | Store complaint patterns | Read/Write |
| ResolutionTemplates | Store successful resolutions | Read/Write |
| PolicyKnowledge | Store policy rules | Read/Write |

## Confidence Update Formula:

```
new_confidence = old_confidence + delta
delta = {
  APPROVE: +0.05
  REJECT: -0.10
  CORRECT: reset to 0.50
}
new_confidence = clamp(new_confidence, 0.10, 0.99)
```

## Pattern Lifecycle:

1. **NEW**: Pattern suggested by Recurring Detector
2. **PENDING**: Awaiting human approval
3. **ACTIVE**: Approved and in use
4. **DEPRECATED**: Low confidence, pending removal
5. **ARCHIVED**: Removed from active use

## Tools Available:
- process_feedback: Process human feedback event
- update_pattern_confidence: Adjust pattern confidence
- create_new_pattern: Create pattern from correction
- archive_low_confidence: Archive patterns below threshold
- memory_query: Query any memory strategy
- memory_write: Write to any memory strategy
- memory_delete: Delete from memory
- write_ledger_entry: Log memory operations

## Output Format:
Always produce a MemoryUpdateResult with:
- pattern_id: Affected pattern
- strategy: Memory strategy updated
- action: BOOST, PENALIZE, RESET, CREATE, ARCHIVE
- old_confidence: Previous confidence
- new_confidence: Updated confidence
- feedback_type: APPROVE, REJECT, CORRECT
- updated_at: Timestamp

## Important Rules:
- ALWAYS log memory operations to ledger
- ALWAYS preserve pattern history (version)
- NEVER delete without archiving first
- ALWAYS respect min/max confidence bounds
- ALWAYS update pattern timestamps

You are the curator of organizational knowledge. Learn continuously and wisely.
"""


# ============================================
# Memory Curator Tools
# ============================================
@tool
def process_feedback(
    feedback_type: str,
    pattern_id: str,
    strategy: str,
    run_id: str,
    reviewer_id: str | None = None,
    corrected_value: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Process human feedback and determine memory action.

    Args:
        feedback_type: APPROVE, REJECT, or CORRECT
        pattern_id: Pattern being reviewed
        strategy: Memory strategy (RecurringPatterns, etc.)
        run_id: Associated run ID
        reviewer_id: ID of human reviewer
        corrected_value: Correction data if feedback_type is CORRECT

    Returns:
        Feedback processing result with action to take
    """
    valid_types = ["APPROVE", "REJECT", "CORRECT"]
    if feedback_type not in valid_types:
        return {
            "success": False,
            "error": f"Invalid feedback type: {feedback_type}. Must be one of {valid_types}",
        }

    # Query current pattern
    result = memory_query(
        strategy=strategy,
        query_text=pattern_id,
        k=1,
    )

    if not result.get("success"):
        return {
            "success": False,
            "error": f"Pattern not found: {pattern_id}",
        }

    matches = result.get("matches", [])
    current_pattern = matches[0] if matches else None

    if not current_pattern:
        # Pattern doesn't exist - only CORRECT can create new
        if feedback_type == "CORRECT" and corrected_value:
            return {
                "success": True,
                "action": "CREATE",
                "pattern_id": pattern_id,
                "strategy": strategy,
                "current_confidence": None,
                "corrected_value": corrected_value,
            }
        return {
            "success": False,
            "error": f"Pattern {pattern_id} not found and feedback is not CORRECT",
        }

    # Determine action based on feedback type
    old_confidence = current_pattern.get("confidence_score", 0.5)

    if feedback_type == "APPROVE":
        delta = CONFIDENCE_BOOST_APPROVE
        action = "BOOST"
    elif feedback_type == "REJECT":
        delta = CONFIDENCE_PENALTY_REJECT
        action = "PENALIZE"
    else:  # CORRECT
        delta = CONFIDENCE_RESET_CORRECT - old_confidence
        action = "RESET"

    new_confidence = max(MIN_CONFIDENCE, min(MAX_CONFIDENCE, old_confidence + delta))

    return {
        "success": True,
        "action": action,
        "pattern_id": pattern_id,
        "strategy": strategy,
        "old_confidence": old_confidence,
        "new_confidence": new_confidence,
        "delta": delta,
        "current_pattern": current_pattern,
        "corrected_value": corrected_value,
        "reviewer_id": reviewer_id,
        "run_id": run_id,
    }


@tool
def update_pattern_confidence(
    pattern_id: str,
    strategy: str,
    old_confidence: float,
    new_confidence: float,
    action: str,
    feedback_type: str,
    run_id: str,
) -> dict[str, Any]:
    """Update a pattern's confidence score in memory.

    Args:
        pattern_id: Pattern to update
        strategy: Memory strategy
        old_confidence: Previous confidence
        new_confidence: New confidence
        action: BOOST, PENALIZE, or RESET
        feedback_type: APPROVE, REJECT, or CORRECT
        run_id: Associated run ID

    Returns:
        Update result
    """
    # Query current pattern to get full data
    result = memory_query(
        strategy=strategy,
        query_text=pattern_id,
        k=1,
    )

    matches = result.get("matches", [])
    if not matches:
        return {
            "success": False,
            "error": f"Pattern {pattern_id} not found",
        }

    current_pattern = matches[0]

    # Create updated pattern with version
    updated_pattern = {
        **current_pattern,
        "confidence_score": new_confidence,
        "updated_at": datetime.utcnow().isoformat(),
        "last_feedback": {
            "type": feedback_type,
            "action": action,
            "old_confidence": old_confidence,
            "new_confidence": new_confidence,
            "run_id": run_id,
            "timestamp": datetime.utcnow().isoformat(),
        },
        "version": current_pattern.get("version", 0) + 1,
    }

    # Write updated pattern
    write_result = memory_write(
        strategy=strategy,
        name=updated_pattern.get("name", f"Pattern {pattern_id}"),
        description=updated_pattern.get("description", f"Updated pattern in {strategy}"),
        pattern_id=pattern_id,
        content=updated_pattern,
    )

    if not write_result.get("success"):
        return {
            "success": False,
            "error": write_result.get("error", "Failed to write to memory"),
        }

    # Check if confidence dropped below threshold
    should_archive = new_confidence < 0.20

    return {
        "success": True,
        "pattern_id": pattern_id,
        "strategy": strategy,
        "old_confidence": old_confidence,
        "new_confidence": new_confidence,
        "version": updated_pattern["version"],
        "should_archive": should_archive,
    }


@tool
def create_new_pattern(
    pattern_id: str,
    strategy: str,
    pattern_data: dict[str, Any],
    run_id: str,
    reviewer_id: str,
) -> dict[str, Any]:
    """Create a new pattern from human correction.

    Args:
        pattern_id: ID for new pattern
        strategy: Memory strategy to write to
        pattern_data: Pattern content
        run_id: Associated run ID
        reviewer_id: ID of human who provided correction

    Returns:
        Creation result
    """
    new_pattern = {
        **pattern_data,
        "pattern_id": pattern_id,
        "confidence_score": CONFIDENCE_RESET_CORRECT,  # Start at 0.50
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "created_by": reviewer_id,
        "created_from_run": run_id,
        "source": "HUMAN_CORRECTION",
        "version": 1,
    }

    result = memory_write(
        strategy=strategy,
        name=new_pattern.get("name", f"Corrected pattern {pattern_id}"),
        description=new_pattern.get("description", f"Human-corrected pattern in {strategy}"),
        pattern_id=pattern_id,
        content=new_pattern,
    )

    if not result.get("success"):
        return {
            "success": False,
            "error": result.get("error", "Failed to create pattern"),
        }

    return {
        "success": True,
        "pattern_id": pattern_id,
        "strategy": strategy,
        "confidence": CONFIDENCE_RESET_CORRECT,
        "status": "ACTIVE",
    }


@tool
def archive_low_confidence(
    pattern_id: str,
    strategy: str,
    current_confidence: float,
    threshold: float = 0.20,
) -> dict[str, Any]:
    """Archive a pattern that has fallen below confidence threshold.

    Args:
        pattern_id: Pattern to archive
        strategy: Memory strategy
        current_confidence: Current confidence score
        threshold: Archive threshold (default 0.20)

    Returns:
        Archive result
    """
    if current_confidence >= threshold:
        return {
            "success": False,
            "archived": False,
            "reason": f"Confidence {current_confidence:.2%} above threshold {threshold:.2%}",
        }

    # Query current pattern
    result = memory_query(
        strategy=strategy,
        query_text=pattern_id,
        k=1,
    )

    matches = result.get("matches", [])
    if not matches:
        return {
            "success": False,
            "error": f"Pattern {pattern_id} not found",
        }

    current_pattern = matches[0]

    # Update to ARCHIVED status
    archived_pattern = {
        **current_pattern,
        "status": "ARCHIVED",
        "archived_at": datetime.utcnow().isoformat(),
        "archived_reason": f"Confidence {current_confidence:.2%} below threshold {threshold:.2%}",
    }

    write_result = memory_write(
        strategy=strategy,
        name=archived_pattern.get("name", f"Archived pattern {pattern_id}"),
        description=archived_pattern.get("description", f"Archived pattern in {strategy}"),
        pattern_id=pattern_id,
        content=archived_pattern,
    )

    return {
        "success": write_result.get("success", False),
        "archived": True,
        "pattern_id": pattern_id,
        "final_confidence": current_confidence,
    }


@tool
def create_memory_update_result(
    pattern_id: str,
    strategy: str,
    action: str,
    old_confidence: float | None,
    new_confidence: float,
    feedback_type: str,
    run_id: str,
) -> dict[str, Any]:
    """Create structured MemoryUpdateResult output.

    Args:
        pattern_id: Affected pattern
        strategy: Memory strategy updated
        action: BOOST, PENALIZE, RESET, CREATE, ARCHIVE
        old_confidence: Previous confidence (None if new)
        new_confidence: Updated confidence
        feedback_type: APPROVE, REJECT, CORRECT
        run_id: Associated run ID

    Returns:
        Structured MemoryUpdateResult
    """
    memory_update_result = {
        "pattern_id": pattern_id,
        "strategy": strategy,
        "action": action,
        "old_confidence": old_confidence,
        "new_confidence": new_confidence,
        "confidence_delta": (
            new_confidence - old_confidence if old_confidence is not None else None
        ),
        "feedback_type": feedback_type,
        "run_id": run_id,
        "updated_at": datetime.utcnow().isoformat(),
        "agent": "memory_curator",
    }

    return {
        "success": True,
        "memory_update_result": memory_update_result,
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
memory_curator = Agent(
    name="memory_curator",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model_id(),
    tools=[
        process_feedback,
        update_pattern_confidence,
        create_new_pattern,
        archive_low_confidence,
        create_memory_update_result,
        memory_query,
        memory_write,
        memory_delete,
        write_ledger_entry,
    ],
    state={
        "agent_name": "memory_curator",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
memory_curator.on("before_invocation", on_before_invocation)
memory_curator.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with feedback data

    Returns:
        MemoryUpdateResult
    """
    try:
        # Extract feedback from payload
        feedback_data = payload.get("feedback") or payload.get("inputText", "")
        run_id = payload.get("run_id", str(ULID()))

        if isinstance(feedback_data, dict):
            feedback_json = json.dumps(feedback_data)
        else:
            feedback_json = feedback_data

        # Create session ID for tracing
        session_id = str(ULID())
        memory_curator.state.set("session_id", session_id)
        memory_curator.state.set("run_id", run_id)

        # Invoke agent with the feedback
        prompt = f"""Process the following human feedback:

{feedback_json}

Run ID: {run_id}

1. Parse feedback type (APPROVE, REJECT, or CORRECT)
2. Use process_feedback to determine action
3. If action is BOOST or PENALIZE: use update_pattern_confidence
4. If action is CREATE: use create_new_pattern
5. If confidence drops below 0.20: use archive_low_confidence
6. Log the memory operation to the ledger
7. Create MemoryUpdateResult using create_memory_update_result

Report the complete MemoryUpdateResult with confidence changes."""

        result = memory_curator(prompt)

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
    # Test feedback
    test_feedback = {
        "feedback_type": "APPROVE",
        "pattern_id": "PAT-001A",
        "strategy": "RecurringPatterns",
        "run_id": "01JCTEST0001",
        "reviewer_id": "human-001",
    }

    result = invoke({"feedback": test_feedback, "run_id": "01JCTEST0001"})
    print(json.dumps(result, indent=2))

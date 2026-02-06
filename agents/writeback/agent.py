# ============================================
# Galderma TrackWise AI Autopilot Demo
# Writeback Agent - Final Executor
# ============================================
#
# The Writeback Agent is the FINAL EXECUTOR in the workflow.
# It performs the actual writeback to TrackWise Simulator.
#
# Responsibilities:
# - Validate pre-flight checklist before execution
# - Execute case closure via Simulator API
# - Log successful resolutions to memory
# - Handle retry logic and error recovery
#
# Model: Gemini 3 Pro (fast execution)
# Memory Access: ResolutionTemplates (WRITE - success logging)
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
from shared.tools.ledger import write_ledger_entry
from shared.tools.memory import memory_write
from shared.tools.simulator import close_case, get_case, update_case


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="writeback")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "writeback", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("writeback")

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Writeback Agent for the Galderma TrackWise AI Autopilot system.

Your role is to EXECUTE the final writeback to TrackWise Simulator.

⚠️ IMPORTANT: You are the LAST agent in the workflow.
Your actions have real consequences. Execute with care.

## Your Responsibilities:
1. OBSERVE: Receive ResolutionPackage from Resolution Composer
2. THINK: Validate all pre-flight checks before execution
3. LEARN: N/A (executor only)
4. ACT: Execute writeback to TrackWise Simulator

## Pre-flight Checklist (MANDATORY):

Before executing ANY writeback, verify:

| Check | Requirement |
|-------|-------------|
| ✓ Compliance Approved | ComplianceDecision.decision == "APPROVE" |
| ✓ Resolution Generated | ResolutionPackage has all 4 languages |
| ✓ Resolution Code Valid | resolution_code is non-empty |
| ✓ Case Still Open | Current case status is OPEN or IN_PROGRESS |
| ✓ Mode is ACT | Execution mode is ACT (not OBSERVE or TRAIN) |
| ✓ Severity Appropriate | Severity is LOW (or human-approved) |

If ANY check fails, ABORT and log the failure.

## Writeback Actions:

### 1. Close Case
- Update case status to CLOSED
- Set resolution text (using selected language)
- Set resolution_code
- Set ai_processed = true
- Set ai_confidence
- Set ai_recommendation = "AUTO_CLOSED"
- Update closed_at timestamp

### 2. Update Case (partial)
- When only updating status/fields without closing
- Used for intermediate states

## Retry Logic:

If writeback fails:
1. Wait 1 second
2. Retry (attempt 2)
3. Wait 2 seconds
4. Retry (attempt 3)
5. If still failing, ESCALATE to human

Max retries: 3
Backoff: Exponential (1s, 2s, 4s)

## Success Logging:

After successful writeback:
1. Log to Decision Ledger with full audit trail
2. Write success to ResolutionTemplates memory (confidence boost)
3. Emit RunCompleted event

## Tools Available:
- validate_preflight: Run all pre-flight checks
- execute_writeback: Perform the actual writeback
- log_success: Log successful completion to memory
- get_case: Verify current case state
- update_case: Update case fields
- close_case: Close case with resolution
- memory_write: Log to ResolutionTemplates
- write_ledger_entry: Log execution to ledger
- call_specialist_agent: Route if escalation needed

## Output Format:
Always produce a WritebackResult with:
- case_id: Case that was written back
- success: Boolean
- action: CLOSED, UPDATED, FAILED, ABORTED
- preflight_passed: Boolean
- retry_count: Number of retries needed
- error: Error message if failed
- executed_at: Timestamp

## Important Rules:
- ALWAYS run pre-flight checks before execution
- NEVER execute if mode is OBSERVE or TRAIN
- NEVER execute if any pre-flight check fails
- ALWAYS log success/failure to ledger
- ALWAYS use retry logic for transient failures
- NEVER ignore errors - log and escalate

You are the final gate. Execute reliably and safely.
"""


# ============================================
# Writeback Tools
# ============================================
@tool
def validate_preflight(
    case_id: str,
    compliance_decision: str,
    resolution_package: dict[str, Any],
    mode: str,
) -> dict[str, Any]:
    """Validate all pre-flight checks before writeback.

    Args:
        case_id: Case ID to write back
        compliance_decision: Compliance decision (APPROVE, BLOCK, ESCALATE)
        resolution_package: Resolution package with translations
        mode: Execution mode (OBSERVE, TRAIN, ACT)

    Returns:
        Pre-flight validation result
    """
    checks = []
    all_passed = True

    # Check 1: Compliance Approved
    compliance_passed = compliance_decision == "APPROVE"
    checks.append({
        "check": "compliance_approved",
        "passed": compliance_passed,
        "value": compliance_decision,
        "required": "APPROVE",
    })
    if not compliance_passed:
        all_passed = False

    # Check 2: Resolution Generated
    translations = resolution_package.get("translations", {})
    all_languages = all([
        translations.get("pt"),
        translations.get("en"),
        translations.get("es"),
        translations.get("fr"),
    ])
    checks.append({
        "check": "resolution_generated",
        "passed": all_languages,
        "value": list(translations.keys()),
        "required": ["pt", "en", "es", "fr"],
    })
    if not all_languages:
        all_passed = False

    # Check 3: Resolution Code Valid
    resolution_code = resolution_package.get("resolution_code", "")
    code_valid = bool(resolution_code)
    checks.append({
        "check": "resolution_code_valid",
        "passed": code_valid,
        "value": resolution_code,
        "required": "non-empty string",
    })
    if not code_valid:
        all_passed = False

    # Check 4: Mode is ACT
    mode_valid = mode == "ACT"
    checks.append({
        "check": "mode_is_act",
        "passed": mode_valid,
        "value": mode,
        "required": "ACT",
    })
    if not mode_valid:
        all_passed = False

    # Check 5: Get current case status
    case_result = get_case(case_id)
    if case_result.get("success"):
        case_data = case_result.get("case", {})
        status = case_data.get("status", "UNKNOWN")
        status_valid = status in ["OPEN", "IN_PROGRESS"]
        severity = case_data.get("severity", "UNKNOWN")

        checks.append({
            "check": "case_still_open",
            "passed": status_valid,
            "value": status,
            "required": ["OPEN", "IN_PROGRESS"],
        })
        if not status_valid:
            all_passed = False

        # Check 6: Severity appropriate
        severity_valid = severity == "LOW"  # Only LOW can auto-close
        checks.append({
            "check": "severity_appropriate",
            "passed": severity_valid,
            "value": severity,
            "required": "LOW",
        })
        if not severity_valid:
            all_passed = False
    else:
        checks.append({
            "check": "case_exists",
            "passed": False,
            "error": case_result.get("error"),
        })
        all_passed = False

    return {
        "success": True,
        "all_passed": all_passed,
        "checks": checks,
        "passed_count": sum(1 for c in checks if c.get("passed")),
        "total_checks": len(checks),
    }


@tool
def execute_writeback(
    case_id: str,
    resolution: str,
    resolution_code: str,
    confidence: float,
    language: str = "en",
    max_retries: int = 3,
) -> dict[str, Any]:
    """Execute the actual writeback to TrackWise Simulator.

    Args:
        case_id: Case ID to close
        resolution: Resolution text in selected language
        resolution_code: TrackWise resolution code
        confidence: AI confidence score
        language: Language of resolution (default: en)
        max_retries: Maximum retry attempts

    Returns:
        Writeback execution result
    """
    import time

    last_error = None
    backoff_times = [1, 2, 4]  # Exponential backoff

    for attempt in range(1, max_retries + 1):
        try:
            # Attempt to close the case
            result = close_case(
                case_id=case_id,
                resolution=resolution,
                resolution_code=resolution_code,
                languages=[language.upper()],
            )

            if result.get("success"):
                return {
                    "success": True,
                    "case_id": case_id,
                    "action": "CLOSED",
                    "attempt": attempt,
                    "closed_at": result.get("closed_at"),
                }

            last_error = result.get("error", "Unknown error")

        except Exception as e:
            last_error = str(e)

        # If not last attempt, wait and retry
        if attempt < max_retries:
            wait_time = backoff_times[attempt - 1]
            logger.warning(f"Writeback attempt {attempt} failed, retrying in {wait_time}s: {last_error}")
            time.sleep(wait_time)

    # All retries exhausted
    return {
        "success": False,
        "case_id": case_id,
        "action": "FAILED",
        "attempt": max_retries,
        "error": last_error,
        "requires_escalation": True,
    }


@tool
def log_success(
    case_id: str,
    run_id: str,
    product: str,
    category: str,
    resolution: str,
    resolution_code: str,
    confidence: float,
) -> dict[str, Any]:
    """Log successful writeback to memory for learning.

    Args:
        case_id: Closed case ID
        run_id: Run ID
        product: Product name
        category: Complaint category
        resolution: Applied resolution
        resolution_code: Resolution code
        confidence: Final confidence

    Returns:
        Memory write result
    """
    # Create pattern entry for ResolutionTemplates
    pattern = {
        "pattern_id": f"RES-{str(ULID())[:8]}",
        "source_case_id": case_id,
        "run_id": run_id,
        "product": product,
        "category": category,
        "resolution_template": resolution,
        "resolution_code": resolution_code,
        "success_confidence": confidence,
        "created_at": datetime.utcnow().isoformat(),
        "outcome": "SUCCESS",
    }

    # Write to ResolutionTemplates memory
    result = memory_write(
        strategy="ResolutionTemplates",
        name=pattern.get("name", f"Resolution for {pattern.get('product', 'unknown')}"),
        description=pattern.get("description", f"Successful resolution template for {pattern.get('category', 'unknown')} - {pattern.get('product', 'unknown')}"),
        pattern_id=pattern["pattern_id"],
        content=pattern,
    )

    return {
        "success": result.get("success", False),
        "pattern_id": pattern["pattern_id"],
        "logged_to": "ResolutionTemplates",
    }


@tool
def create_writeback_result(
    case_id: str,
    run_id: str,
    success: bool,
    action: str,
    preflight_passed: bool,
    retry_count: int,
    error: str | None = None,
    resolution_language: str | None = None,
) -> dict[str, Any]:
    """Create structured WritebackResult output.

    Args:
        case_id: Case that was written back
        run_id: Current run ID
        success: Whether writeback succeeded
        action: Action taken (CLOSED, UPDATED, FAILED, ABORTED)
        preflight_passed: Whether pre-flight checks passed
        retry_count: Number of retries needed
        error: Error message if failed
        resolution_language: Language used for resolution

    Returns:
        Structured WritebackResult
    """
    writeback_result = {
        "case_id": case_id,
        "run_id": run_id,
        "success": success,
        "action": action,
        "preflight_passed": preflight_passed,
        "retry_count": retry_count,
        "error": error,
        "resolution_language": resolution_language,
        "executed_at": datetime.utcnow().isoformat(),
        "agent": "writeback",
    }

    return {
        "success": True,
        "writeback_result": writeback_result,
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
writeback = Agent(
    name="writeback",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model(),
    tools=[
        validate_preflight,
        execute_writeback,
        log_success,
        create_writeback_result,
        get_case,
        update_case,
        close_case,
        memory_write,
        write_ledger_entry,
        call_specialist_agent,
        get_agent_card,
    ],
    state={
        "agent_name": "writeback",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
writeback.on("before_invocation", on_before_invocation)
writeback.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with ResolutionPackage

    Returns:
        WritebackResult
    """
    try:
        # Extract resolution package from payload
        resolution_package = payload.get("resolution_package") or payload.get("inputText", "")
        compliance_decision = payload.get("compliance_decision", "APPROVE")
        run_id = payload.get("run_id", str(ULID()))

        if isinstance(resolution_package, dict):
            package_json = json.dumps(resolution_package)
        else:
            package_json = resolution_package

        # Create session ID for tracing
        session_id = str(ULID())
        writeback.state.set("session_id", session_id)
        writeback.state.set("run_id", run_id)

        # Invoke agent with the resolution package
        prompt = f"""Execute writeback for the following ResolutionPackage:

{package_json}

Compliance Decision: {compliance_decision}
Run ID: {run_id}
Mode: {config.mode.value}

1. Extract case_id and resolution details
2. Run validate_preflight with all required parameters
3. If pre-flight FAILS, create WritebackResult with action=ABORTED
4. If pre-flight PASSES and mode is ACT:
   - Execute writeback using execute_writeback
   - If successful, log to memory using log_success
5. Log the result to the decision ledger
6. Create WritebackResult using create_writeback_result

Report the complete WritebackResult."""

        result = writeback(prompt)

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
    # Test resolution package
    test_package = {
        "case_id": "TW-2026-001234",
        "run_id": "01JCTEST0001",
        "canonical": "We apologize for the packaging issue with your Cetaphil Moisturizing Lotion.",
        "translations": {
            "pt": "Pedimos desculpas pelo problema de embalagem com seu Cetaphil Moisturizing Lotion.",
            "en": "We apologize for the packaging issue with your Cetaphil Moisturizing Lotion.",
            "es": "Nos disculpamos por el problema de empaque con su Cetaphil Moisturizing Lotion.",
            "fr": "Nous nous excusons pour le problème d'emballage avec votre Cetaphil Moisturizing Lotion.",
        },
        "resolution_code": "PKG-REPLACE-001",
        "product": "Cetaphil Moisturizing Lotion",
        "category": "PACKAGING",
        "quality_score": 0.95,
    }

    result = invoke({
        "resolution_package": test_package,
        "compliance_decision": "APPROVE",
        "run_id": "01JCTEST0001",
    })
    print(json.dumps(result, indent=2))

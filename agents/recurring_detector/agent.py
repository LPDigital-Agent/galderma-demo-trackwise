# ============================================
# Galderma TrackWise AI Autopilot Demo
# Recurring Detector Agent - Pattern Matcher
# ============================================
#
# The Recurring Detector is the KEY MEMORY AGENT.
# It detects recurring patterns in complaints using AgentCore Memory.
#
# Responsibilities:
# - Query RecurringPatterns memory for similar cases
# - Calculate pattern similarity scores
# - Recommend action based on confidence thresholds
# - Write new patterns when approved (TRAIN mode)
#
# Model: Gemini 3 Pro (fast pattern matching)
# Memory Access: RecurringPatterns (READ + WRITE)
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
from shared.tools.memory import memory_query, memory_write


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="recurring_detector")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "recurring_detector", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("recurring_detector")

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Recurring Detector Agent for the Galderma TrackWise AI Autopilot system.

Your role is to DETECT RECURRING PATTERNS in complaints using memory-based similarity matching.

## Your Responsibilities:
1. OBSERVE: Receive CaseAnalysis from Case Understanding agent
2. THINK: Determine if this matches known recurring patterns
3. LEARN: Query RecurringPatterns memory, compute similarity
4. ACT: Recommend action based on confidence thresholds

## Memory Strategy: RecurringPatterns

The RecurringPatterns memory stores:
- Pattern ID (unique identifier)
- Product line
- Category
- Description pattern
- Resolution template reference
- Success count (how many times this pattern was resolved)
- Confidence score (updated by feedback)
- Last updated timestamp

## Similarity Matching Algorithm:

1. **Product Match** (40% weight):
   - Same product line: 1.0
   - Same brand family: 0.7
   - Different brand: 0.0

2. **Category Match** (30% weight):
   - Same category: 1.0
   - Related category: 0.5
   - Different category: 0.0

3. **Semantic Similarity** (30% weight):
   - Computed via AgentCore Memory semantic search
   - Based on description embedding comparison

**Final Score** = (product * 0.4) + (category * 0.3) + (semantic * 0.3)

## Confidence Thresholds:

| Similarity Score | Confidence | Recommendation |
|------------------|------------|----------------|
| >= 0.90 | HIGH | AUTO_CLOSE (if severity LOW) |
| 0.75 - 0.89 | MEDIUM | HUMAN_REVIEW |
| 0.50 - 0.74 | LOW | HUMAN_REVIEW with note |
| < 0.50 | VERY_LOW | NEW_PATTERN candidate |

## Pattern Learning:

When a NEW_PATTERN is detected:
1. If MODE == TRAIN: Suggest pattern, await human approval
2. If MODE == ACT and confidence >= 0.85: Write pattern automatically
3. If MODE == OBSERVE: Log suggestion only, no write

## Tools Available:
- query_recurring_patterns: Query memory for similar patterns
- calculate_similarity: Compute weighted similarity score
- write_new_pattern: Write new pattern to memory (requires approval in TRAIN mode)
- memory_query: Direct memory query
- memory_write: Direct memory write
- call_specialist_agent: Route to Compliance Guardian
- request_human_review: Flag for human approval
- write_ledger_entry: Log pattern match decision

## Output Format:
Always produce a PatternMatchResult with:
- matched_pattern_id: ID of matched pattern (or null)
- similarity_score: 0.0-1.0
- confidence: HIGH, MEDIUM, LOW, VERY_LOW
- recommendation: AUTO_CLOSE, HUMAN_REVIEW, NEW_PATTERN
- resolution_template_ref: Reference to use (if matched)
- is_new_pattern: Boolean
- suggested_pattern: If new, the suggested pattern data

## Important Rules:
- ALWAYS query memory before making recommendations
- ALWAYS consider severity from CaseAnalysis in final recommendation
- HIGH/CRITICAL severity NEVER gets AUTO_CLOSE, regardless of similarity
- NEW_PATTERN suggestions must be logged for learning
- In TRAIN mode, ALL recommendations require human approval

You are the pattern recognition brain. Match accurately and learn continuously.
"""


# ============================================
# Recurring Detector Tools
# ============================================
@tool
def query_recurring_patterns(
    product_line: str,
    category: str,
    description: str,
    limit: int = 5,
) -> dict[str, Any]:
    """Query RecurringPatterns memory for similar cases.

    Args:
        product_line: Galderma product line
        category: Complaint category
        description: Case description for semantic search
        limit: Maximum patterns to return

    Returns:
        List of matched patterns with similarity scores
    """
    try:
        # Query AgentCore Memory
        result = memory_query(
            strategy="RecurringPatterns",
            query_text=f"{product_line} {category} {description}",
            k=limit,
        )

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "Memory query failed"),
                "matches": [],
            }

        # Process matches
        matches = result.get("matches", [])
        processed_matches = []

        for match in matches:
            processed_matches.append({
                "pattern_id": match.get("pattern_id"),
                "product_line": match.get("product_line"),
                "category": match.get("category"),
                "description_pattern": match.get("description_pattern"),
                "resolution_template_ref": match.get("resolution_template_ref"),
                "success_count": match.get("success_count", 0),
                "confidence_score": match.get("confidence_score", 0.5),
                "semantic_similarity": match.get("score", 0.0),
            })

        return {
            "success": True,
            "matches": processed_matches,
            "total_found": len(processed_matches),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "matches": [],
        }


@tool
def calculate_similarity(
    input_product_line: str,
    input_category: str,
    pattern_product_line: str,
    pattern_category: str,
    semantic_similarity: float,
) -> dict[str, Any]:
    """Calculate weighted similarity score between input and pattern.

    Args:
        input_product_line: Input case product line
        input_category: Input case category
        pattern_product_line: Pattern product line
        pattern_category: Pattern category
        semantic_similarity: Semantic similarity from memory (0.0-1.0)

    Returns:
        Calculated similarity score with breakdown
    """
    # Product match (40% weight)
    if input_product_line == pattern_product_line:
        product_score = 1.0
    elif input_product_line[:3] == pattern_product_line[:3]:  # Same family prefix
        product_score = 0.7
    else:
        product_score = 0.0

    # Category match (30% weight)
    if input_category == pattern_category:
        category_score = 1.0
    elif _are_related_categories(input_category, pattern_category):
        category_score = 0.5
    else:
        category_score = 0.0

    # Semantic similarity (30% weight)
    semantic_score = min(1.0, max(0.0, semantic_similarity))

    # Calculate final score
    final_score = (
        (product_score * 0.4) +
        (category_score * 0.3) +
        (semantic_score * 0.3)
    )

    # Determine confidence level
    if final_score >= 0.90:
        confidence = "HIGH"
    elif final_score >= 0.75:
        confidence = "MEDIUM"
    elif final_score >= 0.50:
        confidence = "LOW"
    else:
        confidence = "VERY_LOW"

    return {
        "final_score": round(final_score, 4),
        "confidence": confidence,
        "breakdown": {
            "product_score": product_score,
            "product_weight": 0.4,
            "category_score": category_score,
            "category_weight": 0.3,
            "semantic_score": semantic_score,
            "semantic_weight": 0.3,
        },
    }


def _are_related_categories(cat1: str, cat2: str) -> bool:
    """Check if two categories are related."""
    related_groups = [
        {"PACKAGING", "SHIPPING"},
        {"QUALITY", "EFFICACY"},
        {"ADVERSE_REACTION", "CONTAMINATION"},
    ]
    return any(cat1 in group and cat2 in group for group in related_groups)


@tool
def determine_recommendation(
    similarity_score: float,
    confidence: str,
    severity: str,
    mode: str,
) -> dict[str, Any]:
    """Determine the recommended action based on analysis.

    Args:
        similarity_score: Calculated similarity score
        confidence: Confidence level (HIGH, MEDIUM, LOW, VERY_LOW)
        severity: Case severity from CaseAnalysis
        mode: Execution mode (OBSERVE, TRAIN, ACT)

    Returns:
        Recommendation with reasoning
    """
    # CRITICAL/HIGH severity NEVER gets AUTO_CLOSE
    if severity in ["HIGH", "CRITICAL"]:
        return {
            "recommendation": "ESCALATE",
            "reasoning": f"Severity {severity} requires escalation regardless of pattern match",
            "requires_human_review": True,
            "can_auto_execute": False,
        }

    # TRAIN mode always requires human review
    if mode == "TRAIN":
        if confidence == "HIGH":
            rec = "AUTO_CLOSE"
        elif confidence in ["MEDIUM", "LOW"]:
            rec = "HUMAN_REVIEW"
        else:
            rec = "NEW_PATTERN"

        return {
            "recommendation": rec,
            "reasoning": f"TRAIN mode: {rec} suggested but requires human approval",
            "requires_human_review": True,
            "can_auto_execute": False,
        }

    # OBSERVE mode never executes
    if mode == "OBSERVE":
        return {
            "recommendation": "OBSERVE_ONLY",
            "reasoning": "OBSERVE mode: Logging recommendation without execution",
            "requires_human_review": False,
            "can_auto_execute": False,
        }

    # ACT mode with pattern matching
    if confidence == "HIGH" and severity == "LOW":
        return {
            "recommendation": "AUTO_CLOSE",
            "reasoning": f"High confidence ({similarity_score:.2%}) pattern match with LOW severity",
            "requires_human_review": False,
            "can_auto_execute": True,
        }

    if confidence in ["MEDIUM", "LOW"]:
        return {
            "recommendation": "HUMAN_REVIEW",
            "reasoning": f"{confidence} confidence requires human review",
            "requires_human_review": True,
            "can_auto_execute": False,
        }

    # VERY_LOW confidence = new pattern candidate
    return {
        "recommendation": "NEW_PATTERN",
        "reasoning": "No matching pattern found, suggest creating new pattern",
        "requires_human_review": True,
        "can_auto_execute": False,
    }


@tool
def suggest_new_pattern(
    case_id: str,
    product_line: str,
    category: str,
    description: str,
    severity: str,
) -> dict[str, Any]:
    """Suggest a new recurring pattern from this case.

    Args:
        case_id: Source case ID
        product_line: Product line
        category: Complaint category
        description: Case description to extract pattern
        severity: Case severity

    Returns:
        Suggested pattern for review/approval
    """
    pattern_id = f"PAT-{str(ULID())[:8]}"

    # Extract pattern from description (simplified version)
    # In production, this would use more sophisticated NLP
    words = description.lower().split()
    pattern_words = [w for w in words if len(w) > 3][:10]
    description_pattern = " ".join(pattern_words)

    suggested_pattern = {
        "pattern_id": pattern_id,
        "product_line": product_line,
        "category": category,
        "description_pattern": description_pattern,
        "source_case_id": case_id,
        "severity_baseline": severity,
        "success_count": 0,
        "confidence_score": 0.50,  # Start at neutral confidence
        "suggested_at": datetime.utcnow().isoformat(),
        "status": "PENDING_APPROVAL",
    }

    return {
        "success": True,
        "suggested_pattern": suggested_pattern,
        "message": "New pattern suggested, requires human approval to add to memory",
    }


@tool(context=True)
def write_new_pattern(
    pattern: dict[str, Any],
    approved_by: str | None = None,
    tool_context=None,
) -> dict[str, Any]:
    """Write a new pattern to RecurringPatterns memory.

    This tool should only be called after human approval in TRAIN mode,
    or automatically if confidence >= 0.85 in ACT mode.

    Args:
        pattern: Pattern data to write
        approved_by: ID of approving human (required in TRAIN mode)

    Returns:
        Written pattern confirmation
    """
    try:
        # Get current mode
        mode = "ACT"
        if tool_context and hasattr(tool_context, "agent"):
            mode = tool_context.agent.state.get("mode", "ACT")

        # In TRAIN mode, require approval
        if mode == "TRAIN" and not approved_by:
            return {
                "success": False,
                "error": "TRAIN mode requires human approval (approved_by) to write patterns",
            }

        # Add metadata
        pattern["created_at"] = datetime.utcnow().isoformat()
        pattern["approved_by"] = approved_by
        pattern["status"] = "ACTIVE"

        # Write to AgentCore Memory
        result = memory_write(
            strategy="RecurringPatterns",
            name=pattern.get("name", f"Recurring pattern {pattern.get('pattern_id', 'unknown')}"),
            description=pattern.get("description", f"Recurring complaint pattern for {pattern.get('product', 'unknown')}"),
            pattern_id=pattern["pattern_id"],
            content=pattern,
        )

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "Failed to write to memory"),
            }

        return {
            "success": True,
            "pattern_id": pattern["pattern_id"],
            "message": f"Pattern {pattern['pattern_id']} written to RecurringPatterns memory",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@tool
def create_pattern_match_result(
    case_id: str,
    run_id: str,
    matched_pattern_id: str | None,
    similarity_score: float,
    confidence: str,
    recommendation: str,
    resolution_template_ref: str | None = None,
    is_new_pattern: bool = False,
    suggested_pattern: dict[str, Any] | None = None,
    requires_human_review: bool = False,
) -> dict[str, Any]:
    """Create structured PatternMatchResult output.

    Args:
        case_id: Case ID being analyzed
        run_id: Current run ID
        matched_pattern_id: ID of matched pattern (or None)
        similarity_score: Calculated similarity
        confidence: Confidence level
        recommendation: Recommended action
        resolution_template_ref: Template reference (if matched)
        is_new_pattern: Whether this is a new pattern candidate
        suggested_pattern: Suggested pattern data (if new)
        requires_human_review: Whether human review is needed

    Returns:
        Structured PatternMatchResult
    """
    result = {
        "case_id": case_id,
        "run_id": run_id,
        "matched_pattern_id": matched_pattern_id,
        "similarity_score": similarity_score,
        "confidence": confidence,
        "recommendation": recommendation,
        "resolution_template_ref": resolution_template_ref,
        "is_new_pattern": is_new_pattern,
        "suggested_pattern": suggested_pattern,
        "requires_human_review": requires_human_review,
        "analyzed_at": datetime.utcnow().isoformat(),
        "agent": "recurring_detector",
    }

    return {
        "success": True,
        "pattern_match_result": result,
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
recurring_detector = Agent(
    name="recurring_detector",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model(),
    tools=[
        query_recurring_patterns,
        calculate_similarity,
        determine_recommendation,
        suggest_new_pattern,
        write_new_pattern,
        create_pattern_match_result,
        memory_query,
        memory_write,
        call_specialist_agent,
        get_agent_card,
        write_ledger_entry,
        request_human_review,
    ],
    state={
        "agent_name": "recurring_detector",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
recurring_detector.on("before_invocation", on_before_invocation)
recurring_detector.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with CaseAnalysis data

    Returns:
        PatternMatchResult
    """
    try:
        # Extract analysis from payload
        analysis = payload.get("analysis") or payload.get("inputText", "")
        run_id = payload.get("run_id", str(ULID()))

        analysis_json = json.dumps(analysis) if isinstance(analysis, dict) else analysis

        # Create session ID for tracing
        session_id = str(ULID())
        recurring_detector.state.set("session_id", session_id)
        recurring_detector.state.set("run_id", run_id)

        # Invoke agent with the analysis
        prompt = f"""Analyze the following CaseAnalysis for recurring patterns:

{analysis_json}

Run ID: {run_id}
Mode: {config.mode.value}

1. Query RecurringPatterns memory using query_recurring_patterns
2. For each match, calculate similarity using calculate_similarity
3. Determine recommendation using determine_recommendation
4. If no match (VERY_LOW confidence), suggest new pattern using suggest_new_pattern
5. Create PatternMatchResult using create_pattern_match_result
6. Log the decision to the ledger
7. Route to compliance_guardian agent (unless OBSERVE mode)

Report the complete PatternMatchResult."""

        result = recurring_detector(prompt)

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
    # Test analysis
    test_analysis = {
        "case_id": "TW-2026-001234",
        "run_id": "01JCTEST0001",
        "product": "Cetaphil Moisturizing Lotion",
        "product_line": "CETAPHIL",
        "category": "PACKAGING",
        "severity": "LOW",
        "confidence": 0.90,
        "key_phrases": ["packaging seal", "broken", "pump doesn't work"],
        "requires_escalation": False,
        "recommendation": "HUMAN_REVIEW",
    }

    result = invoke({"analysis": test_analysis, "run_id": "01JCTEST0001"})
    print(json.dumps(result, indent=2))

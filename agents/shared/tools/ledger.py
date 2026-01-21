# ============================================
# Galderma TrackWise AI Autopilot Demo
# Ledger Tools - Decision Ledger Operations
# ============================================
#
# These tools interact with the immutable Decision Ledger.
# Ledger is stored in DynamoDB for audit trail.
# ============================================

import os
from datetime import datetime
from typing import Any, Optional

import boto3
from strands import tool
from ulid import ULID

from ..models.ledger import BeforeAfterState, LedgerAction, LedgerEntry


def _get_dynamodb_client():
    """Get DynamoDB client."""
    return boto3.resource(
        "dynamodb",
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def _get_ledger_table_name() -> str:
    """Get ledger table name from environment."""
    return os.environ.get("LEDGER_TABLE_NAME", "galderma-trackwise-dev-ledger")


@tool
def write_ledger_entry(
    run_id: str,
    case_id: str,
    agent_name: str,
    action: str,
    action_description: str,
    decision: Optional[str] = None,
    confidence: Optional[float] = None,
    reasoning: Optional[str] = None,
    state_changes: Optional[list[dict[str, Any]]] = None,
    policies_evaluated: Optional[list[str]] = None,
    policy_violations: Optional[list[str]] = None,
    memory_strategy: Optional[str] = None,
    memory_pattern_id: Optional[str] = None,
    requires_human_action: bool = False,
    model_id: Optional[str] = None,
    tokens_used: Optional[int] = None,
    latency_ms: Optional[int] = None,
) -> dict[str, Any]:
    """Write an entry to the immutable decision ledger.

    Every significant decision must be logged for audit compliance.
    Entries cannot be modified after creation (append-only).

    Args:
        run_id: Current run ID
        case_id: Case being processed
        agent_name: Agent making the decision
        action: Action type (see LedgerAction enum)
        action_description: Human-readable description
        decision: Decision made (APPROVE, REJECT, etc.)
        confidence: Confidence score for decision
        reasoning: Explanation of decision
        state_changes: List of before/after state changes
        policies_evaluated: List of policy IDs checked
        policy_violations: List of violated policies
        memory_strategy: Memory strategy used
        memory_pattern_id: Pattern ID if memory was accessed
        requires_human_action: Whether human action is needed
        model_id: LLM model used
        tokens_used: Tokens consumed
        latency_ms: Operation latency

    Returns:
        Ledger entry ID and status
    """
    try:
        # Validate action
        try:
            action_enum = LedgerAction(action)
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid action: {action}",
                "valid_actions": [a.value for a in LedgerAction],
            }

        # Generate ledger entry ID
        ledger_id = str(ULID())
        timestamp = datetime.utcnow()

        # Build state changes
        changes = []
        if state_changes:
            for change in state_changes:
                changes.append(
                    BeforeAfterState(
                        field=change.get("field", "unknown"),
                        before=change.get("before"),
                        after=change.get("after"),
                    )
                )

        # Create entry
        entry = LedgerEntry(
            ledger_id=ledger_id,
            timestamp=timestamp,
            run_id=run_id,
            case_id=case_id,
            agent_name=agent_name,
            action=action_enum,
            action_description=action_description,
            decision=decision,
            confidence=confidence,
            reasoning=reasoning,
            state_changes=changes,
            policies_evaluated=policies_evaluated,
            policy_violations=policy_violations,
            memory_strategy=memory_strategy,
            memory_pattern_id=memory_pattern_id,
            requires_human_action=requires_human_action,
            model_id=model_id,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
        )

        # Write to DynamoDB
        dynamodb = _get_dynamodb_client()
        table = dynamodb.Table(_get_ledger_table_name())

        # Convert to DynamoDB item
        item = entry.model_dump()
        item["timestamp"] = entry.timestamp.isoformat()
        item["action"] = entry.action.value

        # Convert state changes to serializable format
        item["state_changes"] = [
            {"field": c.field, "before": c.before, "after": c.after}
            for c in entry.state_changes
        ]

        table.put_item(Item=item)

        return {
            "success": True,
            "ledger_id": ledger_id,
            "timestamp": timestamp.isoformat(),
            "action": action_enum.value,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@tool
def get_ledger_entries(
    run_id: Optional[str] = None,
    case_id: Optional[str] = None,
    agent_name: Optional[str] = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Get ledger entries with optional filters.

    Args:
        run_id: Filter by run ID
        case_id: Filter by case ID
        agent_name: Filter by agent name
        limit: Maximum entries to return

    Returns:
        List of ledger entries matching filters
    """
    try:
        dynamodb = _get_dynamodb_client()
        table = dynamodb.Table(_get_ledger_table_name())

        # Build query/scan parameters
        if run_id:
            # Use GSI on run_id
            response = table.query(
                IndexName="run_id-timestamp-index",
                KeyConditionExpression="run_id = :rid",
                ExpressionAttributeValues={":rid": run_id},
                Limit=limit,
                ScanIndexForward=False,  # Newest first
            )
        elif agent_name:
            # Use GSI on agent_name
            response = table.query(
                IndexName="agent_name-timestamp-index",
                KeyConditionExpression="agent_name = :aname",
                ExpressionAttributeValues={":aname": agent_name},
                Limit=limit,
                ScanIndexForward=False,
            )
        else:
            # Scan with filter
            scan_params = {"Limit": limit}
            if case_id:
                scan_params["FilterExpression"] = "case_id = :cid"
                scan_params["ExpressionAttributeValues"] = {":cid": case_id}

            response = table.scan(**scan_params)

        entries = response.get("Items", [])

        return {
            "success": True,
            "entries": entries,
            "count": len(entries),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "entries": [],
        }

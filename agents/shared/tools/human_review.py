# ============================================
# Galderma TrackWise AI Autopilot Demo
# Human Review Tools - Human-in-the-Loop
# ============================================
#
# These tools implement Human-in-the-Loop checkpoints.
# Required for high-severity cases and low-confidence decisions.
# ============================================

import os
from datetime import datetime
from typing import Any, Optional

import boto3
from strands import tool
from ulid import ULID


def _get_dynamodb_client():
    """Get DynamoDB client."""
    return boto3.resource(
        "dynamodb",
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def _get_runs_table_name() -> str:
    """Get runs table name from environment."""
    return os.environ.get("RUNS_TABLE_NAME", "galderma-trackwise-dev-runs")


@tool(context=True)
def request_human_review(
    reason: str,
    case_id: str,
    run_id: str,
    severity: str,
    confidence: float,
    recommendation: str,
    context_data: Optional[dict[str, Any]] = None,
    tool_context=None,
) -> dict[str, Any]:
    """Request human review for a decision.

    This tool flags the current run as requiring human review.
    Execution pauses until human provides feedback.

    Triggers:
    - Severity HIGH or CRITICAL
    - Confidence < 0.85
    - Policy violations detected
    - TRAIN mode (all decisions)
    - New pattern detection

    Args:
        reason: Why human review is needed
        case_id: Case requiring review
        run_id: Current run ID
        severity: Case severity
        confidence: Current confidence score
        recommendation: AI recommendation being reviewed
        context_data: Additional context for reviewer

    Returns:
        Review request ID and status
    """
    try:
        review_id = str(ULID())
        timestamp = datetime.utcnow()

        # Update run status to PENDING_HUMAN
        dynamodb = _get_dynamodb_client()
        table = dynamodb.Table(_get_runs_table_name())

        # Update run record
        table.update_item(
            Key={"run_id": run_id},
            UpdateExpression="""
                SET #status = :status,
                    required_human_review = :required,
                    human_review_request = :request
            """,
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": "PENDING_HUMAN",
                ":required": True,
                ":request": {
                    "review_id": review_id,
                    "reason": reason,
                    "case_id": case_id,
                    "severity": severity,
                    "confidence": confidence,
                    "recommendation": recommendation,
                    "context": context_data or {},
                    "requested_at": timestamp.isoformat(),
                },
            },
        )

        # Set agent state if context available
        if tool_context and hasattr(tool_context, "agent"):
            tool_context.agent.state.set("requires_human_review", True)
            tool_context.agent.state.set("review_id", review_id)
            tool_context.agent.state.set("review_reason", reason)

        return {
            "success": True,
            "review_id": review_id,
            "status": "PENDING_HUMAN",
            "reason": reason,
            "message": f"Human review requested: {reason}",
            "requested_at": timestamp.isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@tool
def check_human_approval(
    run_id: str,
    review_id: Optional[str] = None,
) -> dict[str, Any]:
    """Check if human has approved/rejected a pending review.

    Use this to poll for human decision after requesting review.

    Args:
        run_id: Run ID to check
        review_id: Optional specific review ID

    Returns:
        Approval status and any feedback provided
    """
    try:
        dynamodb = _get_dynamodb_client()
        table = dynamodb.Table(_get_runs_table_name())

        # Get run record
        response = table.get_item(Key={"run_id": run_id})
        run = response.get("Item")

        if not run:
            return {
                "success": False,
                "error": f"Run not found: {run_id}",
            }

        # Check if human has responded
        human_approved = run.get("human_approved")
        human_feedback = run.get("human_feedback")
        status = run.get("status")

        if status == "PENDING_HUMAN":
            return {
                "success": True,
                "status": "PENDING",
                "approved": None,
                "message": "Waiting for human review",
            }

        if human_approved is not None:
            return {
                "success": True,
                "status": "REVIEWED",
                "approved": human_approved,
                "feedback": human_feedback,
                "reviewed_at": run.get("human_reviewed_at"),
                "reviewed_by": run.get("human_reviewed_by"),
            }

        return {
            "success": True,
            "status": "NO_REVIEW_REQUIRED",
            "approved": None,
            "message": "No human review was required for this run",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@tool
def submit_human_feedback(
    run_id: str,
    approved: bool,
    feedback: Optional[str] = None,
    reviewer_id: Optional[str] = None,
    corrected_recommendation: Optional[str] = None,
) -> dict[str, Any]:
    """Submit human feedback for a pending review.

    Called by the UI when a human reviews a decision.
    Updates run status and triggers memory learning.

    Args:
        run_id: Run being reviewed
        approved: Whether human approves the recommendation
        feedback: Optional feedback text
        reviewer_id: ID of human reviewer
        corrected_recommendation: If rejected, what should happen

    Returns:
        Updated run status
    """
    try:
        timestamp = datetime.utcnow()

        dynamodb = _get_dynamodb_client()
        table = dynamodb.Table(_get_runs_table_name())

        # Determine new status
        if approved:
            new_status = "IN_PROGRESS"  # Continue processing
        else:
            new_status = "PENDING_CORRECTION"  # Needs correction

        # Update run
        table.update_item(
            Key={"run_id": run_id},
            UpdateExpression="""
                SET #status = :status,
                    human_approved = :approved,
                    human_feedback = :feedback,
                    human_reviewed_at = :reviewed_at,
                    human_reviewed_by = :reviewed_by,
                    corrected_recommendation = :correction
            """,
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": new_status,
                ":approved": approved,
                ":feedback": feedback,
                ":reviewed_at": timestamp.isoformat(),
                ":reviewed_by": reviewer_id or "unknown",
                ":correction": corrected_recommendation,
            },
        )

        return {
            "success": True,
            "run_id": run_id,
            "status": new_status,
            "approved": approved,
            "feedback": feedback,
            "reviewed_at": timestamp.isoformat(),
            "message": "Approved - continuing" if approved else "Rejected - needs correction",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }

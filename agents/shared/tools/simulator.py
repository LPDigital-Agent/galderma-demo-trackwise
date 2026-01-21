# ============================================
# Galderma TrackWise AI Autopilot Demo
# Simulator Tools - TrackWise Simulator API
# ============================================
#
# These tools interact with the TrackWise Simulator.
# The simulator runs on AgentCore Runtime (NOT ECS!).
# Accessed via AgentCore Gateway MCP protocol.
# ============================================

import os
from typing import Any, Optional

import boto3
from strands import tool


def _get_gateway_endpoint() -> str:
    """Get AgentCore Gateway endpoint from environment."""
    endpoint = os.environ.get("GATEWAY_ENDPOINT")
    if not endpoint:
        raise ValueError("GATEWAY_ENDPOINT environment variable not set")
    return endpoint


def _invoke_simulator_tool(tool_name: str, params: dict[str, Any]) -> dict[str, Any]:
    """Invoke a tool on the TrackWise Simulator via AgentCore Gateway."""
    client = boto3.client(
        "bedrock-agentcore",
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )

    # Use MCP protocol via Gateway
    response = client.invoke_gateway_tool(
        gatewayEndpoint=_get_gateway_endpoint(),
        targetName="trackwise-simulator",
        toolName=tool_name,
        toolInput=params,
    )

    return response.get("toolOutput", {})


@tool
def get_case(case_id: str) -> dict[str, Any]:
    """Get a case from TrackWise Simulator by ID.

    Args:
        case_id: TrackWise case ID to retrieve

    Returns:
        Full case data including:
        - case_id, case_type, status
        - product, category, severity
        - description, resolution
        - timestamps, AI metadata
    """
    try:
        result = _invoke_simulator_tool(
            "get_case",
            {"case_id": case_id},
        )
        return {
            "success": True,
            "case": result.get("case"),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "case_id": case_id,
        }


@tool
def update_case(
    case_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    resolution: Optional[str] = None,
    resolution_code: Optional[str] = None,
    ai_processed: Optional[bool] = None,
    ai_confidence: Optional[float] = None,
    ai_recommendation: Optional[str] = None,
) -> dict[str, Any]:
    """Update a case in TrackWise Simulator.

    Args:
        case_id: Case ID to update
        status: New status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
        severity: New severity (LOW, MEDIUM, HIGH, CRITICAL)
        category: New category
        resolution: Resolution text
        resolution_code: Resolution code
        ai_processed: Mark as AI processed
        ai_confidence: AI confidence score (0.0-1.0)
        ai_recommendation: AI recommendation (AUTO_CLOSE, HUMAN_REVIEW, ESCALATE)

    Returns:
        Updated case data or error
    """
    try:
        # Build update payload (only include non-None values)
        update_data = {"case_id": case_id}

        if status is not None:
            update_data["status"] = status
        if severity is not None:
            update_data["severity"] = severity
        if category is not None:
            update_data["category"] = category
        if resolution is not None:
            update_data["resolution"] = resolution
        if resolution_code is not None:
            update_data["resolution_code"] = resolution_code
        if ai_processed is not None:
            update_data["ai_processed"] = ai_processed
        if ai_confidence is not None:
            update_data["ai_confidence"] = ai_confidence
        if ai_recommendation is not None:
            update_data["ai_recommendation"] = ai_recommendation

        result = _invoke_simulator_tool("update_case", update_data)

        return {
            "success": True,
            "case": result.get("case"),
            "updated_fields": list(update_data.keys()),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "case_id": case_id,
        }


@tool
def close_case(
    case_id: str,
    resolution: str,
    resolution_code: str,
    languages: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Close a case in TrackWise Simulator with resolution.

    This is the final action after all approvals.
    Should only be called by Writeback agent after Guardian approval.

    Args:
        case_id: Case ID to close
        resolution: Final resolution text (in primary language)
        resolution_code: Resolution code for TrackWise
        languages: List of languages for resolution (default: all)

    Returns:
        Closed case data or error
    """
    try:
        result = _invoke_simulator_tool(
            "close_case",
            {
                "case_id": case_id,
                "resolution": resolution,
                "resolution_code": resolution_code,
                "languages": languages or ["PT", "EN", "ES", "FR"],
            },
        )

        return {
            "success": True,
            "case": result.get("case"),
            "closed_at": result.get("closed_at"),
            "message": f"Case {case_id} closed successfully",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "case_id": case_id,
        }


@tool
def list_cases(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    case_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """List cases from TrackWise Simulator with optional filters.

    Args:
        status: Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
        severity: Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
        case_type: Filter by type (COMPLAINT, INQUIRY)
        limit: Maximum cases to return (default 50)
        offset: Pagination offset (default 0)

    Returns:
        List of cases matching filters
    """
    try:
        params: dict[str, Any] = {
            "limit": limit,
            "offset": offset,
        }

        if status:
            params["status"] = status
        if severity:
            params["severity"] = severity
        if case_type:
            params["case_type"] = case_type

        result = _invoke_simulator_tool("list_cases", params)

        return {
            "success": True,
            "cases": result.get("cases", []),
            "total_count": result.get("total_count", 0),
            "has_more": result.get("has_more", False),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "cases": [],
        }

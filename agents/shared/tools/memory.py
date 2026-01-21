# ============================================
# Galderma TrackWise AI Autopilot Demo
# Memory Tools - AgentCore Memory Integration
# ============================================
#
# These tools integrate with AWS Bedrock AgentCore Memory.
# Used by agents to query and update learned patterns.
# ============================================

import os
from typing import Any, Optional

import boto3
from strands import tool

from ..models.memory import MemoryPattern, MemoryStrategy


# Initialize AgentCore client
def _get_agentcore_client():
    """Get AgentCore client with proper configuration."""
    return boto3.client(
        "bedrock-agentcore",
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def _get_memory_id() -> str:
    """Get Memory ID from environment."""
    memory_id = os.environ.get("MEMORY_ID")
    if not memory_id:
        raise ValueError("MEMORY_ID environment variable not set")
    return memory_id


@tool
def memory_query(
    strategy: str,
    query_text: str,
    category: Optional[str] = None,
    product_line: Optional[str] = None,
    min_confidence: float = 0.0,
    limit: int = 10,
    similarity_threshold: float = 0.75,
) -> dict[str, Any]:
    """Query AgentCore Memory for similar patterns using semantic search.

    This tool performs semantic search across learned patterns in AgentCore Memory.
    Use it to find recurring patterns, successful resolutions, or policy knowledge.

    Args:
        strategy: Memory strategy to query. One of:
                  - RecurringPatterns: Complaint patterns for classification
                  - ResolutionTemplates: Successful resolution templates
                  - PolicyKnowledge: Compliance rules and guidelines
        query_text: Text to search for (will be embedded for semantic matching)
        category: Optional filter by complaint category
        product_line: Optional filter by product line (CETAPHIL, DIFFERIN, etc.)
        min_confidence: Minimum confidence threshold (0.0-1.0)
        limit: Maximum number of results to return (default 10)
        similarity_threshold: Minimum similarity score (default 0.75)

    Returns:
        Dictionary containing:
        - matches: List of matching patterns with similarity scores
        - top_confidence: Highest confidence score found
        - total_matches: Total number of matches
        - query_time_ms: Query execution time
    """
    try:
        # Validate strategy
        try:
            strategy_enum = MemoryStrategy(strategy)
        except ValueError:
            return {
                "error": f"Invalid strategy: {strategy}",
                "valid_strategies": [s.value for s in MemoryStrategy],
                "matches": [],
                "top_confidence": 0.0,
            }

        client = _get_agentcore_client()
        memory_id = _get_memory_id()

        # Build query request
        query_params = {
            "memoryId": memory_id,
            "strategyName": strategy_enum.value,
            "queryText": query_text,
            "maxResults": limit,
            "similarityThreshold": similarity_threshold,
        }

        # Add optional filters
        filters = {}
        if category:
            filters["category"] = category
        if product_line:
            filters["productLine"] = product_line
        if min_confidence > 0:
            filters["minConfidence"] = min_confidence

        if filters:
            query_params["filters"] = filters

        # Execute query
        response = client.query_memory(**query_params)

        # Process results
        matches = []
        top_confidence = 0.0

        for item in response.get("matches", []):
            pattern = {
                "pattern_id": item.get("patternId"),
                "name": item.get("name"),
                "description": item.get("description"),
                "similarity_score": item.get("similarityScore", 0.0),
                "confidence": item.get("confidence", 0.0),
                "match_count": item.get("matchCount", 0),
                "content": item.get("content", {}),
            }
            matches.append(pattern)

            if pattern["confidence"] > top_confidence:
                top_confidence = pattern["confidence"]

        return {
            "matches": matches,
            "top_confidence": top_confidence,
            "total_matches": len(matches),
            "query_time_ms": response.get("queryTimeMs", 0),
            "strategy": strategy_enum.value,
        }

    except Exception as e:
        return {
            "error": str(e),
            "matches": [],
            "top_confidence": 0.0,
            "total_matches": 0,
        }


@tool
def memory_write(
    strategy: str,
    name: str,
    description: str,
    content: dict[str, Any],
    pattern_id: Optional[str] = None,
    category: Optional[str] = None,
    product_line: Optional[str] = None,
    severity: Optional[str] = None,
    initial_confidence: float = 0.5,
    source_case_id: Optional[str] = None,
    source_run_id: Optional[str] = None,
) -> dict[str, Any]:
    """Write or update a pattern in AgentCore Memory.

    This tool creates new patterns or updates existing ones.
    Only use after human approval in TRAIN mode or for success logging.

    Args:
        strategy: Target memory strategy (RecurringPatterns, ResolutionTemplates, PolicyKnowledge)
        name: Human-readable pattern name
        description: Pattern description (used for semantic embedding)
        content: Full pattern content as dictionary
        pattern_id: Existing pattern ID to update (None for new pattern)
        category: Optional complaint category
        product_line: Optional product line
        severity: Optional severity level
        initial_confidence: Starting confidence (0.0-1.0, default 0.5)
        source_case_id: Case ID that generated this pattern
        source_run_id: Run ID that generated this pattern

    Returns:
        Dictionary containing:
        - success: Whether write succeeded
        - pattern_id: ID of created/updated pattern
        - version: New version number
        - message: Status message
    """
    try:
        # Validate strategy
        try:
            strategy_enum = MemoryStrategy(strategy)
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid strategy: {strategy}",
                "valid_strategies": [s.value for s in MemoryStrategy],
            }

        client = _get_agentcore_client()
        memory_id = _get_memory_id()

        # Build write request
        write_params = {
            "memoryId": memory_id,
            "strategyName": strategy_enum.value,
            "pattern": {
                "name": name,
                "description": description,
                "content": content,
                "confidence": initial_confidence,
            },
        }

        if pattern_id:
            write_params["patternId"] = pattern_id

        # Add optional metadata
        metadata = {}
        if category:
            metadata["category"] = category
        if product_line:
            metadata["productLine"] = product_line
        if severity:
            metadata["severity"] = severity
        if source_case_id:
            metadata["sourceCaseId"] = source_case_id
        if source_run_id:
            metadata["sourceRunId"] = source_run_id

        if metadata:
            write_params["pattern"]["metadata"] = metadata

        # Execute write
        response = client.write_memory(**write_params)

        return {
            "success": True,
            "pattern_id": response.get("patternId"),
            "version": response.get("version", 1),
            "strategy": strategy_enum.value,
            "message": "Pattern written successfully",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


@tool
def memory_delete(
    strategy: str,
    pattern_id: str,
    reason: str,
) -> dict[str, Any]:
    """Delete a pattern from AgentCore Memory.

    Use with caution - typically only for removing incorrect patterns.
    Requires explicit reason for audit trail.

    Args:
        strategy: Memory strategy containing the pattern
        pattern_id: ID of pattern to delete
        reason: Reason for deletion (required for audit)

    Returns:
        Dictionary containing:
        - success: Whether deletion succeeded
        - message: Status message
    """
    try:
        # Validate strategy
        try:
            strategy_enum = MemoryStrategy(strategy)
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid strategy: {strategy}",
            }

        client = _get_agentcore_client()
        memory_id = _get_memory_id()

        # Execute delete
        response = client.delete_memory_pattern(
            memoryId=memory_id,
            strategyName=strategy_enum.value,
            patternId=pattern_id,
            reason=reason,
        )

        return {
            "success": True,
            "pattern_id": pattern_id,
            "strategy": strategy_enum.value,
            "message": f"Pattern deleted: {reason}",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }

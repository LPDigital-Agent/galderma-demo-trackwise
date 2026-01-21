# ============================================
# Galderma TrackWise AI Autopilot Demo
# A2A Tools - Agent-to-Agent Communication
# ============================================
#
# These tools implement the Multi-Agent Orchestrator Pattern.
# Observer (orchestrator) uses these to invoke specialist agents.
# Uses IAM-based InvokeAgentRuntime for secure A2A calls.
#
# Docs: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/multi-agent/agent-to-agent/
# ============================================

import json
import os
from typing import Any, Optional

import boto3
from strands import tool


def _get_agentcore_client():
    """Get AgentCore client for A2A calls."""
    return boto3.client(
        "bedrock-agentcore",
        region_name=os.environ.get("AWS_REGION", "us-east-2"),
    )


def _get_agent_arn(agent_type: str) -> Optional[str]:
    """Get agent ARN from environment variable.

    Environment variables are set by Terraform:
    AGENT_CASE_UNDERSTANDING_ARN, AGENT_RECURRING_DETECTOR_ARN, etc.
    """
    # Map agent types to environment variable names
    env_var_map = {
        "case_understanding": "AGENT_CASE_UNDERSTANDING_ARN",
        "recurring_detector": "AGENT_RECURRING_DETECTOR_ARN",
        "compliance_guardian": "AGENT_COMPLIANCE_GUARDIAN_ARN",
        "resolution_composer": "AGENT_RESOLUTION_COMPOSER_ARN",
        "inquiry_bridge": "AGENT_INQUIRY_BRIDGE_ARN",
        "writeback": "AGENT_WRITEBACK_ARN",
        "memory_curator": "AGENT_MEMORY_CURATOR_ARN",
        "csv_pack": "AGENT_CSV_PACK_ARN",
    }

    env_var = env_var_map.get(agent_type.lower().replace("-", "_"))
    if not env_var:
        return None

    return os.environ.get(env_var)


# Valid specialist agent types
SPECIALIST_AGENTS = [
    "case_understanding",
    "recurring_detector",
    "compliance_guardian",
    "resolution_composer",
    "inquiry_bridge",
    "writeback",
    "memory_curator",
    "csv_pack",
]


@tool
def call_specialist_agent(
    query: str,
    agent_type: str,
    context: Optional[dict[str, Any]] = None,
    timeout_seconds: int = 60,
) -> dict[str, Any]:
    """Invoke a specialist agent via A2A protocol (IAM-based).

    This tool is used by the Observer (orchestrator) to delegate work
    to specialist agents. Uses AgentCore InvokeAgentRuntime API.

    Args:
        query: The query or task to send to the specialist agent.
               Should be clear and contain all necessary context.
        agent_type: Type of specialist agent to invoke. One of:
                   - case_understanding: Analyzes and classifies cases
                   - recurring_detector: Finds recurring patterns
                   - compliance_guardian: Validates compliance (OPUS)
                   - resolution_composer: Generates resolutions (OPUS)
                   - inquiry_bridge: Handles inquiry-linked complaints
                   - writeback: Executes writeback to TrackWise
                   - memory_curator: Manages memory updates
                   - csv_pack: Generates CSV compliance packs
        context: Optional additional context data (case snapshot, run info, etc.)
        timeout_seconds: Maximum wait time (default 60 seconds)

    Returns:
        Dictionary containing:
        - success: Whether invocation succeeded
        - result: Agent's response (if success)
        - agent_type: Which agent was called
        - latency_ms: Call duration
        - error: Error message (if failed)
    """
    try:
        # Validate agent type
        normalized_type = agent_type.lower().replace("-", "_")
        if normalized_type not in SPECIALIST_AGENTS:
            return {
                "success": False,
                "error": f"Unknown agent type: {agent_type}",
                "valid_types": SPECIALIST_AGENTS,
            }

        # Get agent ARN from environment
        agent_arn = _get_agent_arn(normalized_type)
        if not agent_arn:
            return {
                "success": False,
                "error": f"Agent ARN not found for: {agent_type}",
                "hint": f"Check environment variable AGENT_{normalized_type.upper()}_ARN",
            }

        # Build input payload
        input_payload = {
            "query": query,
            "context": context or {},
            "source_agent": os.environ.get("AGENT_NAME", "observer"),
        }

        # Invoke agent via AgentCore Runtime
        client = _get_agentcore_client()

        import time

        start_time = time.time()

        response = client.invoke_agent_runtime(
            agentRuntimeArn=agent_arn,
            inputText=json.dumps(input_payload),
            enableTrace=True,  # For observability
        )

        latency_ms = int((time.time() - start_time) * 1000)

        # Parse response
        output_text = response.get("outputText", "")

        # Try to parse as JSON, fallback to raw text
        try:
            result = json.loads(output_text)
        except json.JSONDecodeError:
            result = {"raw_output": output_text}

        return {
            "success": True,
            "result": result,
            "agent_type": normalized_type,
            "agent_arn": agent_arn,
            "latency_ms": latency_ms,
            "trace_id": response.get("traceId"),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "agent_type": agent_type,
        }


@tool
def get_agent_card(agent_type: str) -> dict[str, Any]:
    """Get agent card (metadata) for a specialist agent.

    Useful for understanding agent capabilities before invocation.
    Follows A2A protocol agent card format.

    Args:
        agent_type: Type of agent to get info for

    Returns:
        Dictionary containing agent metadata:
        - name: Agent name
        - description: What the agent does
        - model_id: LLM model used
        - capabilities: List of capabilities
        - input_schema: Expected input format
        - output_schema: Expected output format
    """
    # Static agent cards (in production, would query agent endpoints)
    agent_cards = {
        "case_understanding": {
            "name": "Case Understanding Agent",
            "description": "Analyzes TrackWise cases to extract product, category, severity, and initial classification",
            "model_id": "anthropic.claude-haiku-4-5-20251101",
            "capabilities": [
                "product_classification",
                "severity_assessment",
                "category_detection",
                "adverse_event_detection",
            ],
            "memory_access": ["READ"],
            "memory_strategies": ["PolicyKnowledge"],
        },
        "recurring_detector": {
            "name": "Recurring Detector Agent",
            "description": "Detects recurring complaint patterns using semantic memory search",
            "model_id": "anthropic.claude-haiku-4-5-20251101",
            "capabilities": [
                "pattern_matching",
                "similarity_scoring",
                "confidence_calculation",
            ],
            "memory_access": ["READ", "WRITE"],
            "memory_strategies": ["RecurringPatterns"],
        },
        "compliance_guardian": {
            "name": "Compliance Guardian Agent",
            "description": "Evaluates 5 compliance policies and gates high-impact actions",
            "model_id": "anthropic.claude-opus-4-5-20251101",  # OPUS for critical decisions
            "capabilities": [
                "policy_evaluation",
                "severity_gating",
                "evidence_validation",
                "adverse_event_escalation",
            ],
            "memory_access": ["READ"],
            "memory_strategies": ["PolicyKnowledge"],
            "policies": ["POL-001", "POL-002", "POL-003", "POL-004", "POL-005"],
        },
        "resolution_composer": {
            "name": "Resolution Composer Agent",
            "description": "Generates multilingual resolutions (PT/EN/ES/FR) simultaneously",
            "model_id": "anthropic.claude-opus-4-5-20251101",  # OPUS for quality
            "capabilities": [
                "multilingual_generation",
                "template_application",
                "tone_adjustment",
            ],
            "memory_access": ["READ"],
            "memory_strategies": ["ResolutionTemplates"],
            "languages": ["PT", "EN", "ES", "FR"],
        },
        "inquiry_bridge": {
            "name": "Inquiry Bridge Agent",
            "description": "Handles factory complaint closure and linked inquiry processing",
            "model_id": "anthropic.claude-haiku-4-5-20251101",
            "capabilities": [
                "linked_case_detection",
                "inquiry_closure_decision",
            ],
            "memory_access": ["READ"],
            "memory_strategies": ["RecurringPatterns"],
        },
        "writeback": {
            "name": "Writeback Agent",
            "description": "Executes approved actions back to TrackWise Simulator",
            "model_id": "anthropic.claude-haiku-4-5-20251101",
            "capabilities": [
                "case_update",
                "case_closure",
                "ledger_logging",
            ],
            "memory_access": ["WRITE"],
            "memory_strategies": ["ResolutionTemplates"],
        },
        "memory_curator": {
            "name": "Memory Curator Agent",
            "description": "Processes feedback and updates memory patterns",
            "model_id": "anthropic.claude-haiku-4-5-20251101",
            "capabilities": [
                "feedback_processing",
                "confidence_adjustment",
                "pattern_versioning",
            ],
            "memory_access": ["READ", "WRITE"],
            "memory_strategies": ["RecurringPatterns", "ResolutionTemplates", "PolicyKnowledge"],
        },
        "csv_pack": {
            "name": "CSV Pack Agent",
            "description": "Generates CSV compliance documentation packs using Code Interpreter",
            "model_id": "anthropic.claude-haiku-4-5-20251101",
            "capabilities": [
                "document_generation",
                "code_execution",
                "s3_upload",
            ],
            "memory_access": ["READ"],
            "memory_strategies": ["RecurringPatterns", "ResolutionTemplates", "PolicyKnowledge"],
            "uses_code_interpreter": True,
        },
    }

    normalized_type = agent_type.lower().replace("-", "_")

    if normalized_type not in agent_cards:
        return {
            "error": f"Unknown agent type: {agent_type}",
            "valid_types": list(agent_cards.keys()),
        }

    card = agent_cards[normalized_type]
    card["agent_type"] = normalized_type
    card["arn"] = _get_agent_arn(normalized_type)

    return card

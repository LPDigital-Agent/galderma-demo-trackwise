#!/usr/bin/env python3
"""
AgentCore Runtime Entry Point for Galderma TrackWise Agents.

This wrapper loads the agent module and handles AgentCore invocations.
The AGENT_NAME environment variable determines which agent to load.

Usage:
    AGENT_NAME=observer python main.py
"""
import json
import logging
import os
import traceback
from importlib import import_module

from bedrock_agentcore.runtime import BedrockAgentCoreApp


# Configure logging for CloudWatch
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "agent": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)

# Get agent name from environment
AGENT_NAME = os.environ.get("AGENT_NAME", "observer")

# Mapping of agent names to module paths
AGENT_MODULES = {
    "observer": "observer.agent",
    "case-understanding": "case_understanding.agent",
    "recurring-detector": "recurring_detector.agent",
    "compliance-guardian": "compliance_guardian.agent",
    "resolution-composer": "resolution_composer.agent",
    "inquiry-bridge": "inquiry_bridge.agent",
    "writeback": "writeback.agent",
    "memory-curator": "memory_curator.agent",
    "csv-pack": "csv_pack.agent",
    "sac-generator": "sac_generator.agent",
}

# Load the agent module
agent_module = None
agent_invoke = None

try:
    module_path = AGENT_MODULES.get(AGENT_NAME)
    if module_path:
        agent_module = import_module(module_path)
        agent_invoke = getattr(agent_module, "invoke", None)
        logger.info(f"Agent module '{AGENT_NAME}' loaded successfully")
    else:
        logger.error(f"Unknown agent name: {AGENT_NAME}")
except ImportError as e:
    logger.error(f"Failed to import agent module: {e}")

# Initialize BedrockAgentCoreApp
app = BedrockAgentCoreApp()


@app.entrypoint
def handler(event: dict) -> dict:
    """
    AgentCore Runtime handler.

    Args:
        event: Input event (dict with 'prompt' key or raw payload)

    Returns:
        dict: Response from agent or error
    """
    logger.info(f"Received event: {json.dumps(event, default=str)[:500]}")

    if agent_invoke is None:
        return {
            "success": False,
            "error": f"Agent module '{AGENT_NAME}' failed to load",
        }

    try:
        # Extract prompt from various formats
        if isinstance(event, dict):
            payload = event.get("prompt") or event.get("inputText") or event
        else:
            payload = event

        # If payload is a string, try to parse as JSON
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                # Keep as string if not valid JSON
                pass

        # Call the agent's invoke function
        result = agent_invoke(payload)

        logger.info(f"Agent returned: {str(result)[:500]}")
        return result

    except Exception as e:
        error_msg = f"Agent invocation failed: {e!s}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return {
            "success": False,
            "error": error_msg,
            "traceback": traceback.format_exc(),
        }


if __name__ == "__main__":
    # Start the AgentCore app (listens on port 8080)
    app.run()

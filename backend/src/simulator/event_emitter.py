# ============================================
# Galderma TrackWise AI Autopilot Demo
# TrackWise Simulator - Event Emitter
# ============================================
#
# Emits events to the Observer agent via A2A protocol.
# Uses AWS Bedrock AgentCore InvokeAgentRuntime for communication.
#
# ============================================

import json
import logging
import os
from typing import Any, Optional

import boto3
from botocore.exceptions import ClientError

from .models import EventEnvelope


# ============================================
# Logger
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "service": "event_emitter", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("event_emitter")


# ============================================
# Configuration
# ============================================
AWS_REGION = os.environ.get("AWS_REGION", "us-east-2")
OBSERVER_AGENT_ARN = os.environ.get("OBSERVER_AGENT_ARN", "")
A2A_ENABLED = os.environ.get("A2A_ENABLED", "false").lower() == "true"


# ============================================
# Event Emitter Class
# ============================================
class EventEmitter:
    """Emits events to Observer agent via A2A protocol."""

    def __init__(self, region: str = AWS_REGION) -> None:
        """Initialize the event emitter.

        Args:
            region: AWS region for AgentCore client
        """
        self.region = region
        self._client: Optional[Any] = None
        self._enabled = A2A_ENABLED
        self._observer_arn = OBSERVER_AGENT_ARN

        if self._enabled:
            try:
                self._client = boto3.client("bedrock-agentcore", region_name=region)
                logger.info(f"Event emitter initialized (A2A enabled, region: {region})")
            except Exception as e:
                logger.warning(f"Failed to initialize AgentCore client: {e}")
                self._enabled = False
        else:
            logger.info("Event emitter initialized (A2A disabled - local mode)")

    @property
    def is_enabled(self) -> bool:
        """Check if A2A communication is enabled."""
        return self._enabled and self._client is not None and bool(self._observer_arn)

    def emit_to_observer(self, event: EventEnvelope) -> dict[str, Any]:
        """Emit an event to the Observer agent via A2A.

        Args:
            event: Event envelope to send

        Returns:
            Response from Observer agent or error dict
        """
        if not self.is_enabled:
            logger.info(f"A2A disabled - event logged locally: {event.event_type.value}")
            return {
                "success": True,
                "mode": "local",
                "event_id": event.event_id,
                "event_type": event.event_type.value,
            }

        try:
            # Prepare payload for Observer agent
            payload = {
                "inputText": json.dumps(event.model_dump(mode="json")),
                "event_id": event.event_id,
                "event_type": event.event_type.value,
            }

            logger.info(f"Invoking Observer agent: {event.event_type.value}")

            # Invoke Observer agent via AgentCore Runtime
            response = self._client.invoke_agent_runtime(
                agentRuntimeArn=self._observer_arn,
                inputText=json.dumps(payload),
            )

            output_text = response.get("outputText", "")

            logger.info(f"Observer response received for event: {event.event_id}")

            return {
                "success": True,
                "mode": "a2a",
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "observer_response": output_text,
            }

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            error_message = e.response.get("Error", {}).get("Message", str(e))

            logger.error(f"A2A invocation failed: {error_code} - {error_message}")

            return {
                "success": False,
                "mode": "a2a",
                "event_id": event.event_id,
                "error": f"{error_code}: {error_message}",
            }

        except Exception as e:
            logger.error(f"Unexpected error in A2A invocation: {e}")

            return {
                "success": False,
                "mode": "a2a",
                "event_id": event.event_id,
                "error": str(e),
            }

    def set_observer_arn(self, arn: str) -> None:
        """Set the Observer agent ARN dynamically.

        Args:
            arn: ARN of the Observer agent runtime
        """
        self._observer_arn = arn
        logger.info(f"Observer ARN updated: {arn}")

    def enable(self) -> bool:
        """Enable A2A communication.

        Returns:
            True if enabled successfully, False otherwise
        """
        if self._client is None:
            try:
                self._client = boto3.client("bedrock-agentcore", region_name=self.region)
            except Exception as e:
                logger.error(f"Failed to create AgentCore client: {e}")
                return False

        self._enabled = True
        logger.info("A2A communication enabled")
        return True

    def disable(self) -> None:
        """Disable A2A communication."""
        self._enabled = False
        logger.info("A2A communication disabled")


# ============================================
# Event Callback for Simulator
# ============================================
def create_event_callback(emitter: EventEmitter) -> callable:
    """Create a callback function for the simulator to emit events.

    Args:
        emitter: EventEmitter instance

    Returns:
        Callback function
    """

    def callback(event: EventEnvelope) -> None:
        """Callback to emit event to Observer agent.

        Args:
            event: Event envelope from simulator
        """
        result = emitter.emit_to_observer(event)

        if not result.get("success"):
            logger.warning(f"Event emission failed: {result.get('error')}")

    return callback


# ============================================
# Singleton Instance
# ============================================
event_emitter = EventEmitter()

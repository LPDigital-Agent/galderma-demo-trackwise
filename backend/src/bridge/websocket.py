# ============================================
# Galderma TrackWise AI Autopilot Demo
# UI Bridge - WebSocket Manager
# ============================================
#
# Manages WebSocket connections for real-time timeline updates.
# Broadcasts agent events and run progress to connected clients.
#
# ============================================

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import WebSocket


# ============================================
# Logger
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "service": "websocket", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("websocket")


# ============================================
# Timeline Event Types
# ============================================
class TimelineEventType:
    """Timeline event types for the frontend."""

    # Run lifecycle
    RUN_STARTED = "run_started"
    RUN_COMPLETED = "run_completed"
    RUN_FAILED = "run_failed"

    # Agent events
    AGENT_INVOKED = "agent_invoked"
    AGENT_COMPLETED = "agent_completed"
    AGENT_ERROR = "agent_error"

    # Tool events
    TOOL_CALLED = "tool_called"
    TOOL_RESULT = "tool_result"

    # Case events
    CASE_CREATED = "case_created"
    CASE_UPDATED = "case_updated"
    CASE_CLOSED = "case_closed"

    # Memory events
    MEMORY_QUERY = "memory_query"
    MEMORY_WRITE = "memory_write"
    PATTERN_MATCHED = "pattern_matched"

    # Human-in-the-Loop events
    HUMAN_REVIEW_REQUESTED = "human_review_requested"
    HUMAN_FEEDBACK_RECEIVED = "human_feedback_received"

    # System events
    SYSTEM_MESSAGE = "system_message"
    ERROR = "error"


# ============================================
# WebSocket Manager
# ============================================
class WebSocketManager:
    """Manages WebSocket connections and broadcasts events."""

    def __init__(self) -> None:
        """Initialize the WebSocket manager."""
        self._connections: list[WebSocket] = []
        self._event_queue: asyncio.Queue[dict] = asyncio.Queue()
        self._broadcast_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection.

        Args:
            websocket: WebSocket connection to add
        """
        await websocket.accept()
        self._connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self._connections)}")

        # Send welcome message
        await self._send_to_socket(
            websocket,
            {
                "type": TimelineEventType.SYSTEM_MESSAGE,
                "message": "Connected to TrackWise Timeline",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection.

        Args:
            websocket: WebSocket connection to remove
        """
        if websocket in self._connections:
            self._connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self._connections)}")

    async def broadcast(self, event: dict[str, Any]) -> None:
        """Broadcast an event to all connected clients.

        Args:
            event: Event data to broadcast
        """
        # Add timestamp if not present
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat()

        # Send to all connected clients
        disconnected = []
        for websocket in self._connections:
            try:
                await self._send_to_socket(websocket, event)
            except Exception as e:
                logger.warning(f"Failed to send to websocket: {e}")
                disconnected.append(websocket)

        # Remove disconnected clients
        for ws in disconnected:
            self.disconnect(ws)

    async def _send_to_socket(self, websocket: WebSocket, data: dict) -> None:
        """Send data to a specific WebSocket.

        Args:
            websocket: Target WebSocket
            data: Data to send
        """
        await websocket.send_text(json.dumps(data))

    @property
    def connection_count(self) -> int:
        """Get the number of active connections."""
        return len(self._connections)

    # ============================================
    # Timeline Event Helpers
    # ============================================
    async def emit_run_started(
        self,
        run_id: str,
        case_id: str,
        trigger: str = "CaseCreated",
    ) -> None:
        """Emit a run started event.

        Args:
            run_id: Run identifier
            case_id: Associated case ID
            trigger: Event that triggered the run
        """
        await self.broadcast(
            {
                "type": TimelineEventType.RUN_STARTED,
                "run_id": run_id,
                "case_id": case_id,
                "trigger": trigger,
            }
        )

    async def emit_run_completed(
        self,
        run_id: str,
        case_id: str,
        result: str,
        duration_ms: int,
    ) -> None:
        """Emit a run completed event.

        Args:
            run_id: Run identifier
            case_id: Associated case ID
            result: Run result (AUTO_CLOSED, HUMAN_REVIEW, etc.)
            duration_ms: Run duration in milliseconds
        """
        await self.broadcast(
            {
                "type": TimelineEventType.RUN_COMPLETED,
                "run_id": run_id,
                "case_id": case_id,
                "result": result,
                "duration_ms": duration_ms,
            }
        )

    async def emit_agent_invoked(
        self,
        run_id: str,
        agent: str,
        input_preview: str,
    ) -> None:
        """Emit an agent invoked event.

        Args:
            run_id: Run identifier
            agent: Agent name
            input_preview: Preview of input (truncated)
        """
        await self.broadcast(
            {
                "type": TimelineEventType.AGENT_INVOKED,
                "run_id": run_id,
                "agent": agent,
                "input_preview": input_preview[:200],
            }
        )

    async def emit_agent_completed(
        self,
        run_id: str,
        agent: str,
        output_preview: str,
        latency_ms: int,
    ) -> None:
        """Emit an agent completed event.

        Args:
            run_id: Run identifier
            agent: Agent name
            output_preview: Preview of output (truncated)
            latency_ms: Agent latency in milliseconds
        """
        await self.broadcast(
            {
                "type": TimelineEventType.AGENT_COMPLETED,
                "run_id": run_id,
                "agent": agent,
                "output_preview": output_preview[:200],
                "latency_ms": latency_ms,
            }
        )

    async def emit_tool_called(
        self,
        run_id: str,
        agent: str,
        tool: str,
        args_preview: str,
    ) -> None:
        """Emit a tool called event.

        Args:
            run_id: Run identifier
            agent: Agent that called the tool
            tool: Tool name
            args_preview: Preview of arguments
        """
        await self.broadcast(
            {
                "type": TimelineEventType.TOOL_CALLED,
                "run_id": run_id,
                "agent": agent,
                "tool": tool,
                "args_preview": args_preview[:200],
            }
        )

    async def emit_pattern_matched(
        self,
        run_id: str,
        pattern_id: str,
        similarity: float,
        recommendation: str,
    ) -> None:
        """Emit a pattern matched event.

        Args:
            run_id: Run identifier
            pattern_id: Matched pattern ID
            similarity: Similarity score
            recommendation: Recommended action
        """
        await self.broadcast(
            {
                "type": TimelineEventType.PATTERN_MATCHED,
                "run_id": run_id,
                "pattern_id": pattern_id,
                "similarity": similarity,
                "recommendation": recommendation,
            }
        )

    async def emit_human_review_requested(
        self,
        run_id: str,
        case_id: str,
        reason: str,
        agent: str,
    ) -> None:
        """Emit a human review requested event.

        Args:
            run_id: Run identifier
            case_id: Case being reviewed
            reason: Reason for review
            agent: Agent that requested review
        """
        await self.broadcast(
            {
                "type": TimelineEventType.HUMAN_REVIEW_REQUESTED,
                "run_id": run_id,
                "case_id": case_id,
                "reason": reason,
                "agent": agent,
            }
        )

    async def emit_case_closed(
        self,
        run_id: str,
        case_id: str,
        auto_closed: bool,
        latency_ms: int,
    ) -> None:
        """Emit a case closed event.

        Args:
            run_id: Run identifier
            case_id: Closed case ID
            auto_closed: Whether it was auto-closed
            latency_ms: Total processing time
        """
        await self.broadcast(
            {
                "type": TimelineEventType.CASE_CLOSED,
                "run_id": run_id,
                "case_id": case_id,
                "auto_closed": auto_closed,
                "latency_ms": latency_ms,
            }
        )


# ============================================
# Singleton Instance
# ============================================
timeline_manager = WebSocketManager()

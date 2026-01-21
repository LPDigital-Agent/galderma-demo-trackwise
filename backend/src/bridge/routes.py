# ============================================
# Galderma TrackWise AI Autopilot Demo
# UI Bridge - WebSocket Routes
# ============================================
#
# FastAPI router for WebSocket timeline endpoint.
#
# ============================================

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .websocket import timeline_manager


# ============================================
# Logger
# ============================================
logger = logging.getLogger("bridge.routes")


# ============================================
# Router
# ============================================
router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/timeline")
async def websocket_timeline(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time timeline updates.

    Clients connect here to receive live agent events and run progress.
    """
    await timeline_manager.connect(websocket)

    try:
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()

            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")

            # Handle subscription filters (future feature)
            elif data.startswith("subscribe:"):
                filter_type = data.split(":", 1)[1] if ":" in data else ""
                logger.info(f"Client subscribed to: {filter_type}")

    except WebSocketDisconnect:
        timeline_manager.disconnect(websocket)
        logger.info("WebSocket client disconnected normally")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        timeline_manager.disconnect(websocket)

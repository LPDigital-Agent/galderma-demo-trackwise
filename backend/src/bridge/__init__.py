# UI Bridge Module
# Provides WebSocket connection to frontend for real-time timeline updates

from .routes import router as bridge_router
from .websocket import WebSocketManager, timeline_manager


__all__ = ["WebSocketManager", "bridge_router", "timeline_manager"]

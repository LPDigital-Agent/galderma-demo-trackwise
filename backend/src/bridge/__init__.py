# UI Bridge Module
# Provides WebSocket connection to frontend for real-time timeline updates

from .websocket import WebSocketManager, timeline_manager
from .routes import router as bridge_router

__all__ = ["WebSocketManager", "timeline_manager", "bridge_router"]

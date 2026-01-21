# TrackWise Simulator

TrackWise Digital simulator for the Galderma AI Autopilot Demo.

## Overview

This service simulates TrackWise Digital for demo purposes. It deploys to AgentCore Runtime as a container.

## Features

- Full REST API for case management
- AgentCore `/invocations` endpoint
- WebSocket timeline for real-time updates
- In-memory storage for demo simplicity

## Quick Start

```bash
# Install dependencies
uv sync

# Run locally
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

# Run tests
uv run pytest
```

## API Endpoints

- `GET /ping` - Health check (AgentCore requirement)
- `POST /invocations` - AgentCore invocation endpoint
- `POST /api/cases` - Create case
- `GET /api/cases` - List cases
- `GET /api/cases/{id}` - Get case
- `PATCH /api/cases/{id}` - Update case
- `POST /api/cases/{id}/close` - Close case
- `POST /api/batch` - Create batch of demo cases
- `GET /api/stats` - Get statistics
- `POST /api/reset` - Reset demo data

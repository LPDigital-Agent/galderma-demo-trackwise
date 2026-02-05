# Backend — FastAPI + SQLAlchemy + Alembic

## Purpose
REST API layer that receives TrackWise simulator events and routes them to the AgentCore Gateway. NOT a traditional microservice — serves only as ingress adapter for the agentic mesh.

## Stack
- **Framework:** FastAPI with uvicorn (async)
- **ORM:** SQLAlchemy 2.0 async + Alembic migrations
- **Package manager:** uv (pyproject.toml)
- **Runtime:** Python 3.12+

## Key Paths
- `src/main.py` — FastAPI app entrypoint
- `src/models/` — SQLAlchemy models
- `src/routes/` — API route handlers
- `src/services/` — Business logic (must follow Sandwich Pattern)
- `tests/` — pytest test suite

## Commands
```bash
uv run uvicorn src.main:app --reload --port 8080  # dev server
uv run pytest -xvs                                 # tests
uv run ruff check . && uv run ruff format .        # lint+format
uv run alembic upgrade head                        # migrations
```

## Rules
- All endpoints must be async
- Use Pydantic v2 models for request/response schemas
- Never call AgentCore directly — route through Gateway only
- Database operations must use async sessions
- See @docs/SANDWICH_PATTERN.md for LLM vs Python boundaries

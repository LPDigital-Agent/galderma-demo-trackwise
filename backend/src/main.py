# ============================================
# Galderma TrackWise AI Autopilot Demo
# TrackWise Simulator - Main Application
# ============================================
#
# This service simulates TrackWise Digital for demo purposes.
# It deploys to AgentCore Runtime as a container (NOT ECS!).
#
# Endpoints:
# - /ping              : Health check (AgentCore requirement)
# - /invocations       : AgentCore invocation endpoint
# - /api/cases         : REST API for cases
# - /api/events        : REST API for events
# - /api/batch         : Batch operations
# - /api/stats         : Statistics
# - /api/reset         : Reset demo data
# - /ws/timeline       : WebSocket for real-time timeline updates
#
# ============================================

import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .bridge.routes import router as bridge_router
from .config import settings
from .simulator.api import simulator_api
from .simulator.event_emitter import create_event_callback, event_emitter
from .simulator.models import (
    BatchCreate,
    BatchResult,
    Case,
    CaseCreate,
    CaseListResponse,
    CaseSeverity,
    CaseStatus,
    CaseType,
    CaseUpdate,
    EventEnvelope,
    EventType,
    HealthResponse,
)


# ============================================
# Logging Configuration
# ============================================
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='{"timestamp": "%(asctime)s", "service": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger(settings.service_name)


# ============================================
# Application Lifespan
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"A2A Enabled: {settings.a2a_enabled}")

    # Configure event emitter
    if settings.observer_agent_arn:
        event_emitter.set_observer_arn(settings.observer_agent_arn)

    if settings.a2a_enabled:
        event_emitter.enable()
        simulator_api.set_event_callback(create_event_callback(event_emitter))

    yield

    # Shutdown
    logger.info("Shutting down...")


# ============================================
# FastAPI Application
# ============================================
app = FastAPI(
    title="TrackWise Simulator",
    description="Simulates TrackWise Digital for Galderma AI Autopilot Demo",
    version=settings.version,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket router for timeline
app.include_router(bridge_router)


# ============================================
# AgentCore Required Endpoints
# ============================================
@app.get("/ping", response_model=HealthResponse, tags=["Health"])
async def ping() -> HealthResponse:
    """Health check endpoint (required by AgentCore)."""
    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        timestamp=datetime.utcnow(),
        version=settings.version,
    )


@app.post("/invocations", tags=["AgentCore"])
async def invocations(payload: dict[str, Any]) -> dict[str, Any]:
    """AgentCore invocation endpoint.

    This endpoint handles invocations from AgentCore Runtime.
    Actions: create_case, get_case, update_case, close_case,
             list_cases, create_batch, reset_demo, get_stats
    """
    try:
        action = payload.get("action", "")
        input_text = payload.get("inputText", "")

        # Parse inputText if it's JSON
        if isinstance(input_text, str) and input_text:
            try:
                data = json.loads(input_text)
            except json.JSONDecodeError:
                data = {"text": input_text}
        else:
            data = payload

        logger.info(f"Invocation received: action={action}")

        # Route to appropriate handler
        if action == "create_case":
            case_data = CaseCreate(**data.get("case", data))
            case, event = simulator_api.create_case(case_data)
            return {
                "success": True,
                "action": "create_case",
                "case": case.model_dump(mode="json"),
                "event_id": event.event_id,
            }

        elif action == "get_case":
            case_id = data.get("case_id")
            if not case_id:
                return {"success": False, "error": "case_id required"}
            case = simulator_api.get_case(case_id)
            if not case:
                return {"success": False, "error": f"Case not found: {case_id}"}
            return {
                "success": True,
                "action": "get_case",
                "case": case.model_dump(mode="json"),
            }

        elif action == "update_case":
            case_id = data.get("case_id")
            if not case_id:
                return {"success": False, "error": "case_id required"}
            update_data = CaseUpdate(**data.get("update", {}))
            case, event = simulator_api.update_case(case_id, update_data)
            if not case:
                return {"success": False, "error": f"Case not found: {case_id}"}
            return {
                "success": True,
                "action": "update_case",
                "case": case.model_dump(mode="json"),
                "event_id": event.event_id if event else None,
            }

        elif action == "close_case":
            case_id = data.get("case_id")
            if not case_id:
                return {"success": False, "error": "case_id required"}
            case, event = simulator_api.close_case(
                case_id=case_id,
                resolution_text=data.get("resolution_text", ""),
                resolution_text_pt=data.get("resolution_text_pt"),
                resolution_text_en=data.get("resolution_text_en"),
                resolution_text_es=data.get("resolution_text_es"),
                resolution_text_fr=data.get("resolution_text_fr"),
                processed_by_agent=data.get("processed_by_agent"),
            )
            if not case:
                return {"success": False, "error": f"Case not found: {case_id}"}
            return {
                "success": True,
                "action": "close_case",
                "case": case.model_dump(mode="json"),
                "event_id": event.event_id if event else None,
            }

        elif action == "list_cases":
            response = simulator_api.list_cases(
                status=CaseStatus(data["status"]) if data.get("status") else None,
                severity=CaseSeverity(data["severity"]) if data.get("severity") else None,
                case_type=CaseType(data["case_type"]) if data.get("case_type") else None,
                page=data.get("page", 1),
                page_size=data.get("page_size", 20),
            )
            return {
                "success": True,
                "action": "list_cases",
                "result": response.model_dump(mode="json"),
            }

        elif action == "create_batch":
            batch_data = BatchCreate(**data.get("batch", data))
            result = simulator_api.create_batch(batch_data)
            return {
                "success": True,
                "action": "create_batch",
                "result": result.model_dump(mode="json"),
            }

        elif action == "reset_demo":
            result = simulator_api.reset_demo()
            return {
                "success": True,
                "action": "reset_demo",
                "result": result,
            }

        elif action == "get_stats":
            stats = simulator_api.get_stats()
            return {
                "success": True,
                "action": "get_stats",
                "stats": stats,
            }

        else:
            return {
                "success": False,
                "error": f"Unknown action: {action}",
                "available_actions": [
                    "create_case",
                    "get_case",
                    "update_case",
                    "close_case",
                    "list_cases",
                    "create_batch",
                    "reset_demo",
                    "get_stats",
                ],
            }

    except Exception as e:
        logger.error(f"Invocation error: {e}")
        return {
            "success": False,
            "error": str(e),
        }


# ============================================
# REST API Endpoints
# ============================================

# --- Cases ---
@app.post("/api/cases", response_model=Case, tags=["Cases"])
async def create_case(case_data: CaseCreate) -> Case:
    """Create a new case."""
    case, _ = simulator_api.create_case(case_data)
    return case


@app.get("/api/cases", response_model=CaseListResponse, tags=["Cases"])
async def list_cases(
    status: CaseStatus | None = Query(None),
    severity: CaseSeverity | None = Query(None),
    case_type: CaseType | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> CaseListResponse:
    """List cases with optional filters."""
    return simulator_api.list_cases(
        status=status,
        severity=severity,
        case_type=case_type,
        page=page,
        page_size=page_size,
    )


@app.get("/api/cases/{case_id}", response_model=Case, tags=["Cases"])
async def get_case(case_id: str) -> Case:
    """Get a case by ID."""
    case = simulator_api.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    return case


@app.patch("/api/cases/{case_id}", response_model=Case, tags=["Cases"])
async def update_case(case_id: str, update_data: CaseUpdate) -> Case:
    """Update an existing case."""
    case, _ = simulator_api.update_case(case_id, update_data)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    return case


@app.post("/api/cases/{case_id}/close", response_model=Case, tags=["Cases"])
async def close_case(
    case_id: str,
    resolution_text: str = Query(...),
    resolution_text_pt: str | None = Query(None),
    resolution_text_en: str | None = Query(None),
    resolution_text_es: str | None = Query(None),
    resolution_text_fr: str | None = Query(None),
    processed_by_agent: str | None = Query(None),
) -> Case:
    """Close a case with resolution."""
    case, _ = simulator_api.close_case(
        case_id=case_id,
        resolution_text=resolution_text,
        resolution_text_pt=resolution_text_pt,
        resolution_text_en=resolution_text_en,
        resolution_text_es=resolution_text_es,
        resolution_text_fr=resolution_text_fr,
        processed_by_agent=processed_by_agent,
    )
    if not case:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    return case


@app.delete("/api/cases/{case_id}", tags=["Cases"])
async def delete_case(case_id: str) -> dict[str, Any]:
    """Delete a case (for demo reset only)."""
    success = simulator_api.delete_case(case_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Case not found: {case_id}")
    return {"success": True, "deleted": case_id}


# --- Runs (Simulated for demo) ---
@app.get("/api/runs", tags=["Runs"])
async def list_runs(
    case_id: str | None = Query(None),
    status: str | None = Query(None),
) -> list[dict[str, Any]]:
    """List agent runs. Generates simulated run data for demo cases."""
    from .simulator.demo_data import generate_runs_for_cases

    cases = list(simulator_api._cases.values())
    if case_id:
        cases = [c for c in cases if c.case_id == case_id]
    return generate_runs_for_cases(cases, status_filter=status)


@app.get("/api/runs/{run_id}", tags=["Runs"])
async def get_run(run_id: str) -> dict[str, Any]:
    """Get a single run by ID."""
    from .simulator.demo_data import generate_runs_for_cases

    cases = list(simulator_api._cases.values())
    runs = generate_runs_for_cases(cases)
    for run in runs:
        if run["run_id"] == run_id:
            return run
    raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")


# --- Ledger (Simulated for demo) ---
@app.get("/api/ledger", tags=["Ledger"])
async def list_ledger(
    case_id: str | None = Query(None),
    run_id: str | None = Query(None),
    agent_name: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
) -> list[dict[str, Any]]:
    """List ledger entries. Generates simulated audit trail for demo cases."""
    from .simulator.demo_data import generate_ledger_for_cases

    cases = list(simulator_api._cases.values())
    if case_id:
        cases = [c for c in cases if c.case_id == case_id]
    entries = generate_ledger_for_cases(cases, agent_filter=agent_name)
    if run_id:
        entries = [e for e in entries if e["run_id"] == run_id]
    return entries[:limit]


# --- Events ---
@app.get("/api/events", response_model=list[EventEnvelope], tags=["Events"])
async def list_events(
    limit: int = Query(100, ge=1, le=1000),
    event_type: EventType | None = Query(None),
) -> list[EventEnvelope]:
    """List recent events."""
    return simulator_api.get_events(limit=limit, event_type=event_type)


# --- Batch Operations ---
@app.post("/api/batch", response_model=BatchResult, tags=["Batch"])
async def create_batch(batch_data: BatchCreate) -> BatchResult:
    """Create a batch of demo cases."""
    return simulator_api.create_batch(batch_data)


# --- Statistics ---
@app.get("/api/stats", tags=["Statistics"])
async def get_stats() -> dict[str, int]:
    """Get simulator statistics."""
    return simulator_api.get_stats()


@app.get("/api/stats/executive", tags=["Statistics"])
async def get_executive_stats() -> dict[str, Any]:
    """Executive dashboard metrics for the demo.

    Returns:
        ai_closed_count: Number of cases closed by AI agents
        human_hours_saved: Estimated human hours saved (15 min per case)
        risks_avoided: Number of compliance risks caught
    """
    from .simulator.models import CaseStatus

    cases = list(simulator_api._cases.values())
    closed_cases = [c for c in cases if c.status == CaseStatus.CLOSED]

    # Cases closed by AI = cases with processed_by_agent set, or all closed for demo
    ai_closed = [c for c in closed_cases if c.processed_by_agent] or closed_cases
    ai_closed_count = len(ai_closed)

    # Estimated 15 minutes per case for human processing
    human_hours_saved = round(ai_closed_count * 15 / 60, 1)

    # Risks avoided = compliance checks that blocked or escalated
    # For demo, count HIGH/CRITICAL cases that were properly escalated
    from .simulator.models import CaseSeverity
    risks_avoided = len([
        c for c in cases
        if c.severity in (CaseSeverity.HIGH, CaseSeverity.CRITICAL)
    ])

    return {
        "ai_closed_count": ai_closed_count,
        "human_hours_saved": human_hours_saved,
        "risks_avoided": risks_avoided,
        "total_cases": len(cases),
        "open_cases": len([c for c in cases if c.status == CaseStatus.OPEN]),
        "closed_cases": len(closed_cases),
    }


# --- CSV Pack ---
@app.post("/api/csv-pack", tags=["CSV Pack"])
async def generate_csv_pack() -> dict[str, Any]:
    """Generate a CSV (Computer System Validation) compliance pack."""
    from .simulator.demo_data import generate_csv_pack

    cases = list(simulator_api._cases.values())
    return generate_csv_pack(cases)


# --- Demo Reset ---
@app.post("/api/reset", tags=["Demo"])
async def reset_demo() -> dict[str, int]:
    """Reset all demo data."""
    return simulator_api.reset_demo()


# ============================================
# Error Handlers
# ============================================
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.environment == "development" else None,
        },
    )


# ============================================
# Main Entry Point (for local development)
# ============================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )

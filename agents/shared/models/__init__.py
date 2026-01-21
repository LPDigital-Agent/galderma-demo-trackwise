# ============================================
# Galderma TrackWise AI Autopilot Demo
# Shared Agent Models (Pydantic v2)
# ============================================
#
# These models define structured outputs for all agents.
# Used with Strands Agent structured_output_model parameter.
# All schemas match DATA_MODEL.md specifications.
# ============================================

from .analysis import (
    CaseAnalysis,
    ComplianceResult,
    PatternMatch,
    PolicyViolation,
)
from .case import (
    Case,
    CaseCreate,
    CaseStatus,
    CaseType,
    CaseUpdate,
    ComplaintCategory,
    Severity,
)
from .event import (
    EventEnvelope,
    EventType,
    TrackWiseEvent,
)
from .ledger import (
    BeforeAfterState,
    LedgerAction,
    LedgerEntry,
)
from .memory import (
    MemoryPattern,
    MemoryQuery,
    MemoryStrategy,
    MemoryWriteRequest,
)
from .resolution import (
    MultilingualResolution,
    Resolution,
    ResolutionLanguage,
)
from .run import (
    AgentStep,
    Run,
    RunStatus,
    StepType,
)


__all__ = [
    "AgentStep",
    "BeforeAfterState",
    # Case models
    "Case",
    # Analysis models
    "CaseAnalysis",
    "CaseCreate",
    "CaseStatus",
    "CaseType",
    "CaseUpdate",
    "ComplaintCategory",
    "ComplianceResult",
    # Event models
    "EventEnvelope",
    "EventType",
    "LedgerAction",
    # Ledger models
    "LedgerEntry",
    # Memory models
    "MemoryPattern",
    "MemoryQuery",
    "MemoryStrategy",
    "MemoryWriteRequest",
    "MultilingualResolution",
    "PatternMatch",
    "PolicyViolation",
    # Resolution models
    "Resolution",
    "ResolutionLanguage",
    # Run models
    "Run",
    "RunStatus",
    "Severity",
    "StepType",
    "TrackWiseEvent",
]

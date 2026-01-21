# ============================================
# Galderma TrackWise AI Autopilot Demo
# Shared Agent Models (Pydantic v2)
# ============================================
#
# These models define structured outputs for all agents.
# Used with Strands Agent structured_output_model parameter.
# All schemas match DATA_MODEL.md specifications.
# ============================================

from .case import (
    Case,
    CaseCreate,
    CaseUpdate,
    CaseStatus,
    CaseType,
    Severity,
    ComplaintCategory,
)
from .analysis import (
    CaseAnalysis,
    PatternMatch,
    ComplianceResult,
    PolicyViolation,
)
from .resolution import (
    Resolution,
    ResolutionLanguage,
    MultilingualResolution,
)
from .run import (
    Run,
    RunStatus,
    AgentStep,
    StepType,
)
from .ledger import (
    LedgerEntry,
    LedgerAction,
    BeforeAfterState,
)
from .memory import (
    MemoryPattern,
    MemoryQuery,
    MemoryWriteRequest,
    MemoryStrategy,
)
from .event import (
    EventEnvelope,
    TrackWiseEvent,
    EventType,
)

__all__ = [
    # Case models
    "Case",
    "CaseCreate",
    "CaseUpdate",
    "CaseStatus",
    "CaseType",
    "Severity",
    "ComplaintCategory",
    # Analysis models
    "CaseAnalysis",
    "PatternMatch",
    "ComplianceResult",
    "PolicyViolation",
    # Resolution models
    "Resolution",
    "ResolutionLanguage",
    "MultilingualResolution",
    # Run models
    "Run",
    "RunStatus",
    "AgentStep",
    "StepType",
    # Ledger models
    "LedgerEntry",
    "LedgerAction",
    "BeforeAfterState",
    # Memory models
    "MemoryPattern",
    "MemoryQuery",
    "MemoryWriteRequest",
    "MemoryStrategy",
    # Event models
    "EventEnvelope",
    "TrackWiseEvent",
    "EventType",
]

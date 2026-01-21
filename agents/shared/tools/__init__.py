# ============================================
# Galderma TrackWise AI Autopilot Demo
# Shared Tools for Strands Agents
# ============================================
#
# All tools use the @tool decorator from Strands SDK.
# Tools follow the Sandwich Pattern: CODE → LLM → CODE
# ============================================

from .memory import (
    memory_query,
    memory_write,
    memory_delete,
)
from .a2a import (
    call_specialist_agent,
    get_agent_card,
)
from .simulator import (
    get_case,
    update_case,
    close_case,
    list_cases,
)
from .ledger import (
    write_ledger_entry,
    get_ledger_entries,
)
from .human_review import (
    request_human_review,
    check_human_approval,
)

__all__ = [
    # Memory tools
    "memory_query",
    "memory_write",
    "memory_delete",
    # A2A tools
    "call_specialist_agent",
    "get_agent_card",
    # Simulator tools
    "get_case",
    "update_case",
    "close_case",
    "list_cases",
    # Ledger tools
    "write_ledger_entry",
    "get_ledger_entries",
    # Human-in-the-loop tools
    "request_human_review",
    "check_human_approval",
]

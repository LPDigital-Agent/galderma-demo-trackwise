# ============================================
# Galderma TrackWise AI Autopilot Demo
# Shared Tools for Strands Agents
# ============================================
#
# All tools use the @tool decorator from Strands SDK.
# Tools follow the Sandwich Pattern: CODE → LLM → CODE
# ============================================

from .a2a import (
    call_specialist_agent,
    get_agent_card,
)
from .human_review import (
    check_human_approval,
    request_human_review,
)
from .ledger import (
    get_ledger_entries,
    write_ledger_entry,
)
from .memory import (
    memory_delete,
    memory_query,
    memory_write,
)
from .simulator import (
    close_case,
    get_case,
    list_cases,
    update_case,
)


__all__ = [
    # A2A tools
    "call_specialist_agent",
    "check_human_approval",
    "close_case",
    "get_agent_card",
    # Simulator tools
    "get_case",
    "get_ledger_entries",
    "list_cases",
    "memory_delete",
    # Memory tools
    "memory_query",
    "memory_write",
    # Human-in-the-loop tools
    "request_human_review",
    "update_case",
    # Ledger tools
    "write_ledger_entry",
]

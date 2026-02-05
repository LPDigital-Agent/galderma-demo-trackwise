# ============================================
# Galderma TrackWise AI Autopilot Demo
# Run Models - Agent Run Tracking
# ============================================

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class RunStatus(StrEnum):
    """Status of an agent run."""

    STARTED = "STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_HUMAN = "PENDING_HUMAN"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class StepType(StrEnum):
    """Type of agent step in a run."""

    OBSERVE = "OBSERVE"
    THINK = "THINK"
    LEARN = "LEARN"
    ACT = "ACT"
    TOOL_CALL = "TOOL_CALL"
    A2A_CALL = "A2A_CALL"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    ERROR = "ERROR"


class AgentStep(BaseModel):
    """Single step in an agent run.

    Follows OBSERVE → THINK → LEARN → ACT pattern.
    """

    step_id: str = Field(description="Unique step identifier")
    step_number: int = Field(ge=0, description="Step sequence number")
    step_type: StepType = Field(description="Type of step")
    agent_name: str = Field(description="Agent that executed this step")

    # Timing
    started_at: datetime = Field(description="Step start timestamp")
    completed_at: datetime | None = Field(default=None, description="Step completion timestamp")
    duration_ms: int | None = Field(default=None, description="Step duration in milliseconds")

    # Input/Output
    input_data: dict[str, Any] | None = Field(
        default=None, description="Input data for this step"
    )
    output_data: dict[str, Any] | None = Field(
        default=None, description="Output data from this step"
    )

    # Tool/A2A calls
    tool_name: str | None = Field(default=None, description="Tool called (if TOOL_CALL)")
    target_agent: str | None = Field(default=None, description="Target agent (if A2A_CALL)")

    # Status
    success: bool = Field(default=True, description="Whether step succeeded")
    error_message: str | None = Field(default=None, description="Error message if failed")

    # Metadata
    tokens_used: int | None = Field(default=None, description="LLM tokens consumed")
    model_id: str | None = Field(default=None, description="Model ID used")


class Run(BaseModel):
    """Complete agent run record.

    Tracks the full lifecycle of processing a case through the agent mesh.
    """

    run_id: str = Field(description="Unique run identifier (ULID)")
    case_id: str = Field(description="TrackWise case ID being processed")

    # Status
    status: RunStatus = Field(default=RunStatus.STARTED, description="Current run status")

    # Mode
    mode: str = Field(
        default="ACT", description="Execution mode: OBSERVE | TRAIN | ACT"
    )

    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Run start time")
    completed_at: datetime | None = Field(default=None, description="Run completion time")
    duration_ms: int | None = Field(default=None, description="Total duration in milliseconds")

    # Steps
    steps: list[AgentStep] = Field(default_factory=list, description="Ordered list of steps")
    current_step: int = Field(default=0, description="Current step number")
    total_steps: int = Field(default=0, description="Total steps completed")

    # Agents involved
    agents_invoked: list[str] = Field(
        default_factory=list, description="List of agents that participated"
    )

    # Results
    final_action: str | None = Field(
        default=None, description="Final action taken: AUTO_CLOSED | ESCALATED | etc."
    )
    confidence: float | None = Field(
        default=None, ge=0.0, le=1.0, description="Final confidence score"
    )

    # Human-in-the-loop
    required_human_review: bool = Field(
        default=False, description="Whether human review was required"
    )
    human_approved: bool | None = Field(
        default=None, description="Human approval decision (if applicable)"
    )
    human_feedback: str | None = Field(
        default=None, description="Human feedback text"
    )

    # Metrics
    total_tokens: int = Field(default=0, description="Total LLM tokens consumed")
    total_tool_calls: int = Field(default=0, description="Total tool calls made")
    total_a2a_calls: int = Field(default=0, description="Total A2A calls made")

    # Error tracking
    error_count: int = Field(default=0, description="Number of errors encountered")
    last_error: str | None = Field(default=None, description="Last error message")

    def add_step(self, step: AgentStep) -> None:
        """Add a step to the run."""
        self.steps.append(step)
        self.total_steps = len(self.steps)
        self.current_step = step.step_number

        if step.agent_name not in self.agents_invoked:
            self.agents_invoked.append(step.agent_name)

        if step.tokens_used:
            self.total_tokens += step.tokens_used

        if step.step_type == StepType.TOOL_CALL:
            self.total_tool_calls += 1
        elif step.step_type == StepType.A2A_CALL:
            self.total_a2a_calls += 1

        if not step.success:
            self.error_count += 1
            self.last_error = step.error_message

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

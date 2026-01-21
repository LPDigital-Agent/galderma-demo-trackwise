# ============================================
# Galderma TrackWise AI Autopilot Demo
# Analysis Models - Agent Analysis Outputs
# ============================================


from pydantic import BaseModel, Field

from .case import ComplaintCategory, Severity


class CaseAnalysis(BaseModel):
    """Structured output for case analysis by Case Understanding agent.

    This is the primary output format used with Strands structured_output_model.
    """

    case_id: str = Field(description="TrackWise case ID being analyzed")

    # Product classification
    product: str = Field(description="Identified Galderma product")
    product_line: str | None = Field(
        default=None,
        description="Product line: CETAPHIL | ALASTIN | DIFFERIN | EPIDUO | RESTYLANE",
    )

    # Complaint classification
    category: ComplaintCategory = Field(description="Classified complaint category")
    severity: Severity = Field(description="Assessed severity level")

    # AI assessment
    confidence: float = Field(
        ge=0.0, le=1.0, description="Classification confidence score (0.0-1.0)"
    )
    recommendation: str = Field(
        description="Action recommendation: AUTO_CLOSE | HUMAN_REVIEW | ESCALATE"
    )

    # Extracted entities
    keywords: list[str] = Field(
        default_factory=list, description="Extracted keywords from complaint"
    )
    adverse_event_detected: bool = Field(
        default=False, description="Whether adverse event was detected"
    )

    # Reasoning
    reasoning: str = Field(description="Brief explanation of classification decision")


class PatternMatch(BaseModel):
    """Result of pattern matching from Recurring Detector agent."""

    pattern_id: str = Field(description="Unique pattern identifier")
    pattern_name: str = Field(description="Human-readable pattern name")
    similarity_score: float = Field(
        ge=0.0, le=1.0, description="Similarity score to matched pattern"
    )
    match_count: int = Field(
        ge=0, description="Number of previous cases matching this pattern"
    )
    avg_resolution_time_hours: float | None = Field(
        default=None, description="Average resolution time for this pattern"
    )
    suggested_resolution: str | None = Field(
        default=None, description="Suggested resolution based on pattern"
    )
    confidence_boost: float = Field(
        default=0.0, description="Confidence boost from pattern matching"
    )


class PolicyViolation(BaseModel):
    """Single policy violation detected by Compliance Guardian."""

    policy_id: str = Field(description="Policy identifier (e.g., POL-001)")
    policy_name: str = Field(description="Policy name")
    severity: str = Field(description="Violation severity: WARNING | ERROR | CRITICAL")
    message: str = Field(description="Violation message")
    field: str | None = Field(
        default=None, description="Field that caused violation"
    )
    expected_value: str | None = Field(
        default=None, description="Expected value for compliance"
    )
    actual_value: str | None = Field(
        default=None, description="Actual value found"
    )


class ComplianceResult(BaseModel):
    """Structured output from Compliance Guardian agent.

    Evaluates 5 policies:
    - POL-001: Severity Gating
    - POL-002: Evidence Completeness
    - POL-003: Confidence Threshold
    - POL-004: Adverse Event Detection
    - POL-005: Regulatory Keywords
    """

    case_id: str = Field(description="Case ID being evaluated")
    run_id: str = Field(description="Current run ID")

    # Overall result
    approved: bool = Field(description="Whether all policies passed")
    action: str = Field(
        description="Recommended action: APPROVE | BLOCK | ESCALATE | HUMAN_REVIEW"
    )

    # Policy results
    policies_checked: int = Field(default=5, description="Number of policies evaluated")
    policies_passed: int = Field(description="Number of policies that passed")
    policies_failed: int = Field(description="Number of policies that failed")

    # Violations
    violations: list[PolicyViolation] = Field(
        default_factory=list, description="List of policy violations"
    )

    # Confidence adjustment
    original_confidence: float = Field(description="Original confidence from analysis")
    adjusted_confidence: float = Field(
        description="Confidence after Guardian evaluation"
    )

    # Human-in-the-loop triggers
    requires_human_review: bool = Field(
        default=False, description="Whether human review is required"
    )
    human_review_reason: str | None = Field(
        default=None, description="Reason for human review requirement"
    )

    # Reasoning
    reasoning: str = Field(description="Explanation of compliance decision")

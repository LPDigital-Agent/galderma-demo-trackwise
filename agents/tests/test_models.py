# ============================================
# Galderma TrackWise AI Autopilot Demo
# Agents - Model Tests
# ============================================

"""Tests for shared models."""

from shared.models import (
    CaseAnalysis,
    Severity,
)


class TestCaseAnalysis:
    """Tests for CaseAnalysis model."""

    def test_create_case_analysis(self):
        """Test creating a CaseAnalysis with valid data."""
        analysis = CaseAnalysis(
            case_id="CASE-001",
            product="Cetaphil Daily Moisturizer",
            product_line="Cetaphil",
            category="PACKAGING",
            severity=Severity.LOW,
            confidence=0.95,
            recommendation="AUTO_CLOSE",
            reasoning="Recurring packaging complaint with high confidence match.",
            extracted_fields={"batch_number": "BN12345"},
        )
        assert analysis.case_id == "CASE-001"
        assert analysis.confidence == 0.95
        assert analysis.severity == Severity.LOW

    def test_case_analysis_confidence_bounds(self):
        """Test that confidence must be between 0 and 1."""
        # Valid confidence at boundaries
        analysis_low = CaseAnalysis(
            case_id="CASE-002",
            product="Test",
            product_line="Test",
            category="OTHER",
            severity=Severity.LOW,
            confidence=0.0,
            recommendation="HUMAN_REVIEW",
            reasoning="Test",
        )
        assert analysis_low.confidence == 0.0

        analysis_high = CaseAnalysis(
            case_id="CASE-003",
            product="Test",
            product_line="Test",
            category="OTHER",
            severity=Severity.LOW,
            confidence=1.0,
            recommendation="HUMAN_REVIEW",
            reasoning="Test",
        )
        assert analysis_high.confidence == 1.0

    def test_case_analysis_recommendations(self):
        """Test valid recommendation values."""
        for rec in ["AUTO_CLOSE", "HUMAN_REVIEW", "ESCALATE"]:
            analysis = CaseAnalysis(
                case_id=f"CASE-{rec}",
                product="Test",
                product_line="Test",
                category="OTHER",
                severity=Severity.MEDIUM,
                confidence=0.5,
                recommendation=rec,
                reasoning=f"Testing {rec}",
            )
            assert analysis.recommendation == rec

    def test_case_analysis_severity_levels(self):
        """Test all severity levels."""
        for severity in [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL]:
            analysis = CaseAnalysis(
                case_id=f"CASE-{severity.value}",
                product="Test",
                product_line="Test",
                category="OTHER",
                severity=severity,
                confidence=0.5,
                recommendation="HUMAN_REVIEW",
                reasoning=f"Testing severity {severity.value}",
            )
            assert analysis.severity == severity

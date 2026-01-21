# ============================================
# Galderma TrackWise AI Autopilot Demo
# Resolution Models - Multilingual Resolutions
# ============================================

from enum import Enum

from pydantic import BaseModel, Field


class ResolutionLanguage(str, Enum):
    """Supported languages for resolutions."""

    PT = "PT"  # Portuguese
    EN = "EN"  # English
    ES = "ES"  # Spanish
    FR = "FR"  # French


class Resolution(BaseModel):
    """Single language resolution text."""

    language: ResolutionLanguage = Field(description="Language code")
    subject: str = Field(description="Resolution subject/title")
    body: str = Field(description="Resolution body text")
    closing: str = Field(description="Resolution closing/signature")

    # Metadata
    word_count: int = Field(default=0, description="Word count of body")
    tone: str = Field(
        default="professional", description="Tone: professional | empathetic | formal"
    )


class MultilingualResolution(BaseModel):
    """Structured output from Resolution Composer agent.

    Generates resolutions in 4 languages simultaneously:
    PT (Portuguese), EN (English), ES (Spanish), FR (French)
    """

    case_id: str = Field(description="Case ID for this resolution")
    run_id: str = Field(description="Run ID that generated this resolution")

    # Canonical resolution (language-neutral representation)
    canonical: str = Field(
        description="Language-neutral canonical resolution (internal use)"
    )
    resolution_code: str = Field(description="Resolution code for TrackWise")

    # Language variants
    pt: Resolution = Field(description="Portuguese resolution")
    en: Resolution = Field(description="English resolution")
    es: Resolution = Field(description="Spanish resolution")
    fr: Resolution = Field(description="French resolution")

    # Generation metadata
    primary_language: ResolutionLanguage = Field(
        default=ResolutionLanguage.EN, description="Primary language of customer"
    )
    template_used: str | None = Field(
        default=None, description="Memory template ID used (if any)"
    )

    # Quality metrics
    consistency_score: float = Field(
        ge=0.0, le=1.0, default=1.0, description="Cross-language consistency score"
    )

    def get_resolution(self, language: ResolutionLanguage) -> Resolution:
        """Get resolution for specific language."""
        return getattr(self, language.value.lower())

    def get_all_languages(self) -> dict[str, Resolution]:
        """Get all language resolutions as dictionary."""
        return {
            "PT": self.pt,
            "EN": self.en,
            "ES": self.es,
            "FR": self.fr,
        }

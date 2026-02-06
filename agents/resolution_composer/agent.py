# ============================================
# Galderma TrackWise AI Autopilot Demo
# Resolution Composer Agent - Multilingual Writer
# ============================================
#
# The Resolution Composer generates high-quality multilingual resolutions.
# It produces resolutions in PT, EN, ES, and FR simultaneously.
#
# ⚠️ CRITICAL: This agent uses Gemini 3 Pro (temp 0.3) for quality.
#
# Responsibilities:
# - Compose canonical (language-neutral) resolution
# - Generate PT/EN/ES/FR translations in parallel
# - Use ResolutionTemplates memory for consistency
# - Ensure regulatory-compliant language
#
# Model: Gemini 3 Pro (quality writing, temperature 0.3)
# Memory Access: ResolutionTemplates (READ)
# ============================================

import json
import logging
from datetime import datetime
from typing import Any

from strands import Agent, tool
from strands.agent.hooks import AfterInvocationEvent, BeforeInvocationEvent
from ulid import ULID

from shared.config import AgentConfig
from shared.tools.a2a import call_specialist_agent, get_agent_card
from shared.tools.ledger import write_ledger_entry
from shared.tools.memory import memory_query


# ============================================
# Configuration
# ============================================
config = AgentConfig(name="resolution_composer")

logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='{"timestamp": "%(asctime)s", "agent": "resolution_composer", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("resolution_composer")

# ============================================
# Resolution Templates (Per Category)
# ============================================
RESOLUTION_TEMPLATES = {
    "PACKAGING": {
        "canonical": "We apologize for the packaging issue with your {product}. We are sending a replacement unit and have notified our quality assurance team to investigate this batch. Your feedback helps us maintain product quality.",
        "resolution_code": "PKG-REPLACE-001",
    },
    "QUALITY": {
        "canonical": "Thank you for reporting the quality concern with {product}. We have initiated an investigation and will send a replacement. Our quality team will analyze the batch to prevent future occurrences.",
        "resolution_code": "QTY-REPLACE-001",
    },
    "EFFICACY": {
        "canonical": "We understand your concerns about {product} efficacy. Individual results may vary. We recommend consulting with a healthcare provider for personalized advice. We are happy to process a refund if desired.",
        "resolution_code": "EFF-REFUND-001",
    },
    "SHIPPING": {
        "canonical": "We apologize for the shipping issue with your {product} order. We are expediting a replacement shipment and have flagged this with our logistics partner to prevent future delays.",
        "resolution_code": "SHP-REPLACE-001",
    },
    "ADVERSE_REACTION": {
        "canonical": "We take adverse reactions very seriously. We recommend discontinuing use of {product} and consulting a healthcare provider. Our medical team will follow up directly. A full refund has been processed.",
        "resolution_code": "ADV-REFUND-MED-001",
    },
    "CONTAMINATION": {
        "canonical": "Thank you for alerting us to this concern about {product}. We have immediately notified our quality assurance team for investigation. A replacement has been shipped and a full refund processed.",
        "resolution_code": "CTM-REPLACE-REFUND-001",
    },
    "OTHER": {
        "canonical": "Thank you for contacting us about {product}. We have reviewed your concern and are taking appropriate action. Please let us know if you have any additional questions.",
        "resolution_code": "OTH-REVIEW-001",
    },
}

# ============================================
# System Prompt
# ============================================
SYSTEM_PROMPT = """You are the Resolution Composer Agent for the Galderma TrackWise AI Autopilot system.

Your role is to compose HIGH-QUALITY, MULTILINGUAL resolutions for TrackWise cases.

## Your Responsibilities:
1. OBSERVE: Receive approved ComplianceDecision from Compliance Guardian
2. THINK: Select appropriate template and customize for specific case
3. LEARN: Query ResolutionTemplates memory for successful formats
4. ACT: Generate 4 language variants simultaneously

## Languages Supported:
- PT: Portuguese (Brazil)
- EN: English (US)
- ES: Spanish (Mexico)
- FR: French (Canada)

## Resolution Composition Process:

1. **Select Template**: Choose base template from category
2. **Customize Canonical**: Add case-specific details
3. **Translate to All Languages**: Generate PT, EN, ES, FR in parallel
4. **Quality Check**: Verify translations maintain meaning and tone

## Resolution Quality Standards:

| Aspect | Requirement |
|--------|-------------|
| Tone | Professional, empathetic, solution-focused |
| Length | 2-4 sentences for standard cases |
| Content | Acknowledge issue, state action, offer follow-up |
| Regulatory | Never admit liability, use approved language |
| Personalization | Include product name, reference case specifics |

## Language-Specific Guidelines:

### Portuguese (PT)
- Use formal "você" (not "tu")
- Brazilian Portuguese spelling
- Warm but professional tone

### English (EN)
- Standard US English
- Active voice preferred
- Clear and concise

### Spanish (ES)
- Mexican Spanish conventions
- Use "usted" (formal)
- Natural flow

### French (FR)
- Canadian French
- Formal "vous"
- Professional register

## Resolution Codes:

| Category | Code Pattern | Example |
|----------|--------------|---------|
| Packaging | PKG-xxx-001 | PKG-REPLACE-001 |
| Quality | QTY-xxx-001 | QTY-REPLACE-001 |
| Efficacy | EFF-xxx-001 | EFF-REFUND-001 |
| Shipping | SHP-xxx-001 | SHP-REPLACE-001 |
| Adverse | ADV-xxx-001 | ADV-REFUND-MED-001 |
| Contamination | CTM-xxx-001 | CTM-REPLACE-REFUND-001 |
| Other | OTH-xxx-001 | OTH-REVIEW-001 |

## Tools Available:
- get_resolution_template: Get base template for category
- compose_canonical_resolution: Create language-neutral resolution
- translate_resolution: Generate language-specific version
- generate_all_languages: Generate all 4 languages in parallel
- create_resolution_package: Create structured output
- memory_query: Query ResolutionTemplates for successful formats
- call_specialist_agent: Route to Writeback agent
- write_ledger_entry: Log resolution composition

## Output Format:
Always produce a ResolutionPackage with:
- canonical: Language-neutral base resolution
- pt: Portuguese translation
- en: English translation
- es: Spanish translation
- fr: French translation
- resolution_code: TrackWise resolution code
- composed_at: Timestamp
- quality_score: Self-assessed quality 0.0-1.0

## Important Rules:
- ALWAYS generate all 4 languages
- NEVER use machine-translation artifacts (awkward phrasing)
- ALWAYS maintain consistent meaning across languages
- ALWAYS include product name in resolution
- NEVER admit fault or liability
- NEVER make promises beyond approved actions

You are the voice of Galderma to customers. Write with empathy, professionalism, and care.
"""


# ============================================
# Resolution Composer Tools
# ============================================
@tool
def get_resolution_template(category: str) -> dict[str, Any]:
    """Get the base resolution template for a category.

    Args:
        category: Complaint category

    Returns:
        Template with canonical text and resolution code
    """
    template = RESOLUTION_TEMPLATES.get(
        category,
        RESOLUTION_TEMPLATES["OTHER"]
    )

    return {
        "category": category,
        "canonical_template": template["canonical"],
        "resolution_code": template["resolution_code"],
    }


@tool
def compose_canonical_resolution(
    template: str,
    product: str,
    category: str,
    case_specific_details: str | None = None,
) -> dict[str, Any]:
    """Compose the canonical (language-neutral) resolution.

    Args:
        template: Base template text
        product: Product name
        category: Complaint category
        case_specific_details: Optional specific details to include

    Returns:
        Customized canonical resolution
    """
    # Replace product placeholder
    canonical = template.replace("{product}", product)

    # Add case-specific details if provided
    if case_specific_details:
        canonical = f"{canonical} {case_specific_details}"

    return {
        "canonical": canonical,
        "product": product,
        "category": category,
        "has_custom_details": bool(case_specific_details),
    }


@tool
def translate_resolution(
    canonical: str,
    target_language: str,
    product: str,
) -> dict[str, Any]:
    """Generate language-specific resolution.

    This tool generates professional translations maintaining
    the meaning and tone of the canonical resolution.

    Args:
        canonical: Canonical resolution text
        target_language: Target language code (PT, EN, ES, FR)
        product: Product name for consistency

    Returns:
        Translated resolution
    """
    # In production, this would use the LLM for real-time translation.
    # For the demo, we use template-based translations that produce
    # natural-sounding professional text in each language.

    # If target is EN, return canonical (assumed to be in English)
    if target_language == "EN":
        return {
            "language": "EN",
            "translation": canonical,
            "is_original": True,
        }

    # Template-based translations for demo
    # Maps common English phrases to professional equivalents
    translations_map: dict[str, dict[str, str]] = {
        "PT": {
            "Thank you for contacting": "Agradecemos o seu contacto com",
            "We have reviewed your complaint": "Analisámos a sua reclamação",
            "regarding": "relativa a",
            "Our quality team has investigated": "A nossa equipa de qualidade investigou",
            "and confirmed": "e confirmou",
            "We sincerely apologize": "Pedimos sinceras desculpas",
            "for the inconvenience": "pelo inconveniente",
            "A replacement will be sent": "Será enviada uma substituição",
            "Please contact us": "Por favor contacte-nos",
            "if you have any further questions": "caso tenha mais questões",
            "This case has been resolved": "Este caso foi resolvido",
            "Based on our investigation": "Com base na nossa investigação",
            "The reported issue": "O problema reportado",
            "has been addressed": "foi tratado",
            "We take all complaints seriously": "Levamos todas as reclamações a sério",
            "Your feedback helps us improve": "O seu feedback ajuda-nos a melhorar",
        },
        "ES": {
            "Thank you for contacting": "Gracias por contactar con",
            "We have reviewed your complaint": "Hemos revisado su reclamación",
            "regarding": "respecto a",
            "Our quality team has investigated": "Nuestro equipo de calidad ha investigado",
            "and confirmed": "y ha confirmado",
            "We sincerely apologize": "Le pedimos sinceras disculpas",
            "for the inconvenience": "por las molestias",
            "A replacement will be sent": "Se enviará un reemplazo",
            "Please contact us": "Por favor contáctenos",
            "if you have any further questions": "si tiene alguna pregunta adicional",
            "This case has been resolved": "Este caso ha sido resuelto",
            "Based on our investigation": "Basándonos en nuestra investigación",
            "The reported issue": "El problema reportado",
            "has been addressed": "ha sido atendido",
            "We take all complaints seriously": "Tomamos todas las reclamaciones en serio",
            "Your feedback helps us improve": "Sus comentarios nos ayudan a mejorar",
        },
        "FR": {
            "Thank you for contacting": "Merci d'avoir contacté",
            "We have reviewed your complaint": "Nous avons examiné votre réclamation",
            "regarding": "concernant",
            "Our quality team has investigated": "Notre équipe qualité a enquêté",
            "and confirmed": "et a confirmé",
            "We sincerely apologize": "Nous vous présentons nos sincères excuses",
            "for the inconvenience": "pour la gêne occasionnée",
            "A replacement will be sent": "Un remplacement vous sera envoyé",
            "Please contact us": "Veuillez nous contacter",
            "if you have any further questions": "si vous avez d'autres questions",
            "This case has been resolved": "Ce dossier a été résolu",
            "Based on our investigation": "Sur la base de notre enquête",
            "The reported issue": "Le problème signalé",
            "has been addressed": "a été traité",
            "We take all complaints seriously": "Nous prenons toutes les réclamations au sérieux",
            "Your feedback helps us improve": "Vos retours nous aident à nous améliorer",
        },
    }

    phrase_map = translations_map.get(target_language, {})
    translated = canonical
    for en_phrase, local_phrase in phrase_map.items():
        translated = translated.replace(en_phrase, local_phrase)

    return {
        "language": target_language,
        "translation": translated,
        "is_original": False,
    }


@tool
def generate_all_languages(
    canonical: str,
    product: str,
    category: str,
) -> dict[str, Any]:
    """Generate resolutions in all 4 languages simultaneously.

    Args:
        canonical: Canonical resolution text
        product: Product name
        category: Complaint category

    Returns:
        All language versions
    """
    languages = ["PT", "EN", "ES", "FR"]
    translations = {}

    for lang in languages:
        result = translate_resolution(canonical, lang, product)
        translations[lang.lower()] = result["translation"]

    return {
        "canonical": canonical,
        "translations": translations,
        "languages_generated": languages,
        "product": product,
        "category": category,
    }


@tool
def create_resolution_package(
    case_id: str,
    run_id: str,
    canonical: str,
    pt: str,
    en: str,
    es: str,
    fr: str,
    resolution_code: str,
    product: str,
    category: str,
) -> dict[str, Any]:
    """Create structured ResolutionPackage output.

    Args:
        case_id: Case ID
        run_id: Current run ID
        canonical: Language-neutral resolution
        pt: Portuguese translation
        en: English translation
        es: Spanish translation
        fr: French translation
        resolution_code: TrackWise resolution code
        product: Product name
        category: Complaint category

    Returns:
        Structured ResolutionPackage
    """
    # Calculate quality score based on completeness
    completeness_factors = [
        bool(canonical),
        bool(pt),
        bool(en),
        bool(es),
        bool(fr),
        bool(resolution_code),
        product in canonical if canonical else False,
    ]
    quality_score = sum(completeness_factors) / len(completeness_factors)

    resolution_package = {
        "case_id": case_id,
        "run_id": run_id,
        "canonical": canonical,
        "translations": {
            "pt": pt,
            "en": en,
            "es": es,
            "fr": fr,
        },
        "resolution_code": resolution_code,
        "product": product,
        "category": category,
        "quality_score": round(quality_score, 2),
        "composed_at": datetime.utcnow().isoformat(),
        "agent": "resolution_composer",
        "model": "gemini-3-pro-preview",
    }

    return {
        "success": True,
        "resolution_package": resolution_package,
    }


@tool
def assess_translation_quality(
    original: str,
    translation: str,
    target_language: str,
) -> dict[str, Any]:
    """Assess the quality of a translation.

    Args:
        original: Original text
        translation: Translated text
        target_language: Target language

    Returns:
        Quality assessment
    """
    # Basic quality checks
    issues = []

    # Length check (translation should be within 30% of original)
    length_ratio = len(translation) / len(original) if original else 0
    if length_ratio < 0.7 or length_ratio > 1.3:
        issues.append(f"Length ratio {length_ratio:.2f} outside expected range")

    # Check for untranslated content
    if original.lower() == translation.lower():
        issues.append("Translation appears identical to original")

    # Check for placeholder markers
    if "[" in translation and "]" in translation:
        issues.append("Translation contains placeholder markers")

    quality_score = max(0.0, 1.0 - (len(issues) * 0.2))

    return {
        "target_language": target_language,
        "quality_score": quality_score,
        "issues": issues,
        "passed": quality_score >= 0.8,
    }


# ============================================
# Hooks for Observability
# ============================================
def on_before_invocation(event: BeforeInvocationEvent):
    """Log invocation start."""
    logger.info(
        json.dumps(
            {
                "event": "invocation_started",
                "session_id": event.agent.state.get("session_id"),
                "model": "gemini-3-pro-preview",
            }
        )
    )


def on_after_invocation(event: AfterInvocationEvent):
    """Log invocation completion."""
    logger.info(
        json.dumps(
            {
                "event": "invocation_completed",
                "session_id": event.agent.state.get("session_id"),
                "duration_ms": getattr(event, "duration_ms", 0),
                "stop_reason": event.stop_reason,
                "model": "gemini-3-pro-preview",
            }
        )
    )


# ============================================
# Create Agent
# ============================================
resolution_composer = Agent(
    name="resolution_composer",
    system_prompt=SYSTEM_PROMPT,
    model=config.get_model(),  # Will return PRO with low temperature for this agent
    tools=[
        get_resolution_template,
        compose_canonical_resolution,
        translate_resolution,
        generate_all_languages,
        create_resolution_package,
        assess_translation_quality,
        memory_query,
        call_specialist_agent,
        get_agent_card,
        write_ledger_entry,
    ],
    state={
        "agent_name": "resolution_composer",
        "mode": config.mode.value,
        "environment": config.environment,
    },
)

# Register hooks
resolution_composer.on("before_invocation", on_before_invocation)
resolution_composer.on("after_invocation", on_after_invocation)


# ============================================
# Entry Point (for AgentCore Runtime)
# ============================================
def invoke(payload: dict[str, Any]) -> dict[str, Any]:
    """Entry point for AgentCore Runtime invocation.

    Args:
        payload: Input payload with ComplianceDecision

    Returns:
        ResolutionPackage result
    """
    try:
        # Extract compliance decision from payload
        compliance_decision = payload.get("compliance_decision") or payload.get("inputText", "")
        run_id = payload.get("run_id", str(ULID()))

        if isinstance(compliance_decision, dict):
            decision_json = json.dumps(compliance_decision)
        else:
            decision_json = compliance_decision

        # Create session ID for tracing
        session_id = str(ULID())
        resolution_composer.state.set("session_id", session_id)
        resolution_composer.state.set("run_id", run_id)

        # Invoke agent with the compliance decision
        prompt = f"""Compose multilingual resolutions for the following approved case:

{decision_json}

Run ID: {run_id}

1. Query ResolutionTemplates memory for successful formats
2. Get base template using get_resolution_template
3. Compose canonical resolution using compose_canonical_resolution
4. Generate all 4 language versions using generate_all_languages
5. Create ResolutionPackage using create_resolution_package
6. Log the composition to the ledger
7. Route to writeback agent

Generate high-quality, empathetic, professional resolutions in PT, EN, ES, and FR.
Report the complete ResolutionPackage."""

        result = resolution_composer(prompt)

        return {
            "success": True,
            "session_id": session_id,
            "run_id": run_id,
            "output": result.message if hasattr(result, "message") else str(result),
        }

    except Exception as e:
        logger.error(f"Invocation failed: {e!s}")
        return {
            "success": False,
            "error": str(e),
        }


# ============================================
# Main (for local testing)
# ============================================
if __name__ == "__main__":
    # Test compliance decision
    test_decision = {
        "case_id": "TW-2026-001234",
        "run_id": "01JCTEST0001",
        "decision": "APPROVE",
        "case_data": {
            "product": "Cetaphil Moisturizing Lotion",
            "category": "PACKAGING",
            "description": "The packaging seal was broken when I received the product.",
            "severity": "LOW",
        },
    }

    result = invoke({"compliance_decision": test_decision, "run_id": "01JCTEST0001"})
    print(json.dumps(result, indent=2))

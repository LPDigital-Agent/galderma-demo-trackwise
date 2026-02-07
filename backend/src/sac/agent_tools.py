# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Agent - Tool Functions (Backend In-Process)
# ============================================
#
# 7 @tool functions following the Sandwich Pattern:
#   CODE tools (deterministic):
#     - select_product
#     - generate_customer_profile
#     - determine_severity
#     - generate_lot_and_manufacturing
#     - assess_regulatory_impact
#   CODE validation of LLM output:
#     - generate_complaint_text
#     - generate_investigation_data
#
# Shared mutable dict pattern: each tool writes
# its results to _current_generation for the
# agent_client to collect after execution.
#
# ============================================

from __future__ import annotations

import random
import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from strands import tool


# ============================================
# Shared Generation Accumulator
# ============================================
_current_generation: dict[str, Any] = {}


def reset_generation() -> None:
    """Clear the accumulator before a new agent call."""
    _current_generation.clear()


def get_generation_results() -> dict[str, Any]:
    """Return a copy of all accumulated tool results."""
    return dict(_current_generation)


# ============================================
# Galderma Product Taxonomy
# (Mirrors backend/src/simulator/models.py)
# ============================================
GALDERMA_PRODUCTS: dict[str, list[str]] = {
    "CETAPHIL": [
        "Gentle Skin Cleanser",
        "Moisturizing Lotion",
        "Daily Facial Moisturizer SPF 15",
        "PRO Oil Removing Foam Wash",
        "Restoraderm Eczema Calming Body Wash",
        "Rich Hydrating Night Cream",
        "Bright Healthy Radiance Serum",
    ],
    "DIFFERIN": [
        "Adapalene Gel 0.1%",
        "Adapalene Gel 0.3%",
        "Daily Deep Cleanser",
        "Oil Absorbing Moisturizer SPF 30",
        "Soothing Moisturizer",
    ],
    "EPIDUO": [
        "Epiduo Gel",
        "Epiduo Forte Gel",
    ],
    "RESTYLANE": [
        "Restylane",
        "Restylane Lyft",
        "Restylane Silk",
        "Restylane Defyne",
        "Restylane Refyne",
        "Restylane Kysse",
        "Restylane Contour",
    ],
    "DYSPORT": [
        "Dysport (abobotulinumtoxinA)",
    ],
    "SCULPTRA": [
        "Sculptra Aesthetic",
    ],
    "SOOLANTRA": [
        "Soolantra Cream 1%",
    ],
    "ORACEA": [
        "Oracea Capsules 40mg",
    ],
    "BENZAC": [
        "Benzac AC Gel 2.5%",
        "Benzac AC Gel 5%",
        "Benzac AC Gel 10%",
        "Benzac AC Wash",
    ],
    "LOCERYL": [
        "Loceryl Nail Lacquer",
    ],
}

INJECTABLE_BRANDS: frozenset[str] = frozenset({"RESTYLANE", "DYSPORT", "SCULPTRA"})

COMPLAINT_CATEGORIES: list[str] = [
    "PACKAGING",
    "QUALITY",
    "EFFICACY",
    "SAFETY",
    "DOCUMENTATION",
    "SHIPPING",
    "OTHER",
]

# ============================================
# Manufacturing site mapping by brand
# ============================================
MANUFACTURING_SITES: dict[str, str] = {
    "CETAPHIL": "Hortolândia, SP, Brazil",
    "DIFFERIN": "Sophia Antipolis, France",
    "EPIDUO": "Sophia Antipolis, France",
    "RESTYLANE": "Uppsala, Sweden",
    "DYSPORT": "Wrexham, United Kingdom",
    "SCULPTRA": "Namur, Belgium",
    "SOOLANTRA": "Sophia Antipolis, France",
    "ORACEA": "Fort Worth, TX, USA",
    "BENZAC": "Hortolândia, SP, Brazil",
    "LOCERYL": "Sophia Antipolis, France",
}

# Site codes for lot number generation
SITE_CODES: dict[str, str] = {
    "CETAPHIL": "HRT",
    "DIFFERIN": "SAF",
    "EPIDUO": "SAF",
    "RESTYLANE": "UPS",
    "DYSPORT": "WRX",
    "SCULPTRA": "NAM",
    "SOOLANTRA": "SAF",
    "ORACEA": "FTW",
    "BENZAC": "HRT",
    "LOCERYL": "SAF",
}

# SLA days by severity
SLA_DAYS: dict[str, int] = {
    "CRITICAL": 3,
    "HIGH": 5,
    "MEDIUM": 10,
    "LOW": 30,
}

# ============================================
# Brazilian data pools for customer generation
# ============================================
_FIRST_NAMES_F = [
    "Ana",
    "Maria",
    "Juliana",
    "Fernanda",
    "Camila",
    "Beatriz",
    "Larissa",
    "Patricia",
    "Luciana",
    "Carolina",
    "Amanda",
    "Gabriela",
    "Renata",
    "Tatiane",
    "Priscila",
    "Raquel",
    "Vanessa",
    "Daniela",
    "Aline",
    "Mariana",
]
_FIRST_NAMES_M = [
    "Carlos",
    "Pedro",
    "Lucas",
    "Rafael",
    "Bruno",
    "Felipe",
    "Andre",
    "Marcos",
    "Ricardo",
    "Eduardo",
    "Gustavo",
    "Fernando",
    "Diego",
    "Thiago",
    "Rodrigo",
    "Leonardo",
    "Henrique",
    "Matheus",
    "Vinicius",
    "Gabriel",
]
_LAST_NAMES = [
    "Silva",
    "Santos",
    "Oliveira",
    "Souza",
    "Rodrigues",
    "Ferreira",
    "Almeida",
    "Pereira",
    "Lima",
    "Gomes",
    "Costa",
    "Ribeiro",
    "Martins",
    "Carvalho",
    "Araujo",
    "Melo",
    "Barbosa",
    "Cardoso",
    "Nascimento",
    "Moreira",
]
_CITIES = [
    ("São Paulo", "SP"),
    ("Rio de Janeiro", "RJ"),
    ("Belo Horizonte", "MG"),
    ("Salvador", "BA"),
    ("Brasília", "DF"),
    ("Curitiba", "PR"),
    ("Fortaleza", "CE"),
    ("Recife", "PE"),
    ("Porto Alegre", "RS"),
    ("Manaus", "AM"),
    ("Goiânia", "GO"),
    ("Campinas", "SP"),
    ("Florianópolis", "SC"),
    ("Vitória", "ES"),
    ("Niterói", "RJ"),
]
_PHONE_DDDS = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "92"]

# Weighted channel distribution
_CHANNEL_WEIGHTS = [
    ("PHONE", 30),
    ("EMAIL", 30),
    ("WEB", 25),
    ("SOCIAL_MEDIA", 10),
    ("IN_PERSON", 5),
]

# Brazilian pharma QA investigators
_INVESTIGATORS_PT = [
    "Eng. Carlos Alberto Mendes",
    "Dra. Ana Paula Ferreira",
    "Farmacêutico Ricardo Santos",
    "Eng. Mariana Costa Lima",
    "Dra. Juliana Oliveira",
    "Farmacêutica Beatriz Almeida",
    "Eng. Fernando Rodrigues",
    "Dra. Camila Ribeiro",
    "Farmacêutico Eduardo Pereira",
    "Eng. Gabriela Martins",
]


def _weighted_choice(weights: list[tuple]) -> str:
    """Pick a random item based on weights."""
    items, w = zip(*weights, strict=True)
    return random.choices(items, weights=w, k=1)[0]


# ============================================
# Tool 1: select_product (Deterministic CODE)
# ============================================
@tool
def select_product(brand: str = "") -> dict[str, Any]:
    """Select a Galderma product for complaint generation.

    If brand is provided, selects a random product from that brand.
    Otherwise, selects a random brand and product.

    Args:
        brand: Galderma brand name (e.g., 'CETAPHIL'). Empty string for random.

    Returns:
        Dict with product_brand, product_name, and is_injectable flag.
    """
    brand_upper = brand.strip().upper() if brand else ""

    if brand_upper and brand_upper in GALDERMA_PRODUCTS:
        selected_brand = brand_upper
    else:
        selected_brand = random.choice(list(GALDERMA_PRODUCTS.keys()))

    products = GALDERMA_PRODUCTS[selected_brand]
    selected_product = random.choice(products)

    result = {
        "product_brand": selected_brand,
        "product_name": selected_product,
        "is_injectable": selected_brand in INJECTABLE_BRANDS,
        "full_name": f"{selected_brand} {selected_product}",
    }
    _current_generation.update(result)
    return result


# ============================================
# Tool 2: generate_customer_profile (Deterministic CODE)
# ============================================
@tool
def generate_customer_profile(gender_hint: str = "random") -> dict[str, Any]:
    """Generate a realistic Brazilian customer profile.

    Creates a complete customer identity with name, contact info, and location.
    All data is fictional but follows Brazilian naming/format conventions.

    Args:
        gender_hint: Gender hint for name generation ('male', 'female', or 'random').

    Returns:
        Dict with customer name, email, phone, city, state, and registration date.
    """
    hint = gender_hint.strip().lower()
    if hint not in ("male", "female"):
        hint = random.choice(["male", "female"])

    first_name = random.choice(_FIRST_NAMES_M if hint == "male" else _FIRST_NAMES_F)
    last_name = random.choice(_LAST_NAMES)
    full_name = f"{first_name} {last_name}"

    email_name = f"{first_name.lower()}.{last_name.lower()}"
    email_domain = random.choice(
        [
            "gmail.com",
            "hotmail.com",
            "outlook.com",
            "yahoo.com.br",
            "uol.com.br",
        ]
    )
    email = f"{email_name}{random.randint(1, 99)}@{email_domain}"

    ddd = random.choice(_PHONE_DDDS)
    phone = f"+55 {ddd} 9{random.randint(1000, 9999):04d}-{random.randint(1000, 9999):04d}"

    city, state = random.choice(_CITIES)

    result = {
        "customer_name": full_name,
        "customer_email": email,
        "customer_phone": phone,
        "city": city,
        "state": state,
        "gender": hint,
        "reporter_country": "Brasil",
    }
    _current_generation.update(result)
    return result


# ============================================
# Tool 3: determine_severity (Deterministic CODE)
# ============================================
@tool
def determine_severity(
    category: str,
    case_type: str = "COMPLAINT",
    has_physical_symptoms: bool = False,
    is_injectable_product: bool = False,
) -> dict[str, str]:
    """Determine complaint severity using deterministic rules.

    Applies Galderma severity matrix:
    - CRITICAL: Injectable adverse events with tissue/vision issues
    - HIGH: Adverse events with symptoms, injectable complaints, safety issues
    - MEDIUM: Quality, efficacy, recurring packaging
    - LOW: Cosmetic preferences, minor packaging, documentation

    Args:
        category: Complaint category (PACKAGING, QUALITY, EFFICACY, SAFETY, etc.).
        case_type: Case type (COMPLAINT, INQUIRY, ADVERSE_EVENT).
        has_physical_symptoms: Whether customer reports physical symptoms.
        is_injectable_product: Whether the product is an injectable.

    Returns:
        Dict with severity level and reasoning.
    """
    cat = category.upper().strip()
    ctype = case_type.upper().strip()

    if is_injectable_product and ctype == "ADVERSE_EVENT" and has_physical_symptoms:
        severity = "CRITICAL"
        reason = "Injectable adverse event with physical symptoms requires immediate escalation"
    elif cat == "SAFETY" or (has_physical_symptoms and ctype == "ADVERSE_EVENT"):
        severity = "HIGH"
        reason = "Safety concern or adverse event with physical symptoms"
    elif is_injectable_product:
        severity = "HIGH"
        reason = "Injectable product complaint requires elevated priority"
    elif cat in ("QUALITY", "EFFICACY"):
        severity = "MEDIUM"
        reason = f"{cat} complaint requires standard investigation"
    elif cat == "PACKAGING":
        severity = "MEDIUM"
        reason = "Packaging issue may indicate manufacturing concern"
    else:
        severity = "LOW"
        reason = f"{cat} complaint is routine priority"

    result = {"severity": severity, "severity_reason": reason}
    _current_generation.update(result)
    return result


# ============================================
# Tool 4: generate_complaint_text (CODE validates LLM output)
# ============================================
@tool
def generate_complaint_text(
    product_brand: str,
    product_name: str,
    category: str,
    scenario_type: str,
    complaint_text: str,
) -> dict[str, Any]:
    """Structure and validate a consumer complaint for Galderma SAC.

    The LLM generates the complaint_text parameter (in PT-BR) and this tool
    validates the structure and returns a complete complaint record.

    Args:
        product_brand: Galderma brand name (e.g., 'CETAPHIL').
        product_name: Specific product name (e.g., 'Moisturizing Lotion').
        category: Complaint category (PACKAGING, QUALITY, EFFICACY, SAFETY, etc.).
        scenario_type: Scenario type used for generation context.
        complaint_text: The PT-BR complaint text generated by the LLM (3-5 paragraphs).

    Returns:
        Structured complaint data with validation status.
    """
    errors: list[str] = []

    brand_upper = product_brand.strip().upper()
    if brand_upper not in GALDERMA_PRODUCTS:
        errors.append(f"Unknown brand: {product_brand}. Valid: {list(GALDERMA_PRODUCTS.keys())}")

    cat_upper = category.strip().upper()
    if cat_upper not in COMPLAINT_CATEGORIES:
        errors.append(f"Unknown category: {category}. Valid: {COMPLAINT_CATEGORIES}")

    text = complaint_text.strip()
    if len(text) < 20:
        errors.append("Complaint text too short (min 20 chars)")
    if len(text) > 5000:
        errors.append("Complaint text too long (max 5000 chars)")

    # PT-BR content heuristic (expanded vocabulary)
    pt_br_markers = re.compile(
        r"\b(comprei|produto|farmacia|problema|usando|reacao|pele|creme|gel|"
        r"reclamacao|recebi|defeito|embalagem|tratamento|alergia|irritacao|"
        r"gostaria|registrar|insatisfeito|devolucao|estou|fiz|apliquei|"
        r"investigacao|laudo|analise|laboratorio|lote|validade|qualidade|"
        r"seguranca|efeito|adverso|procedimento|aplicacao|injecao|"
        r"prescricao|medico|dermatologista|clinica|hospital)\b",
        re.IGNORECASE,
    )
    if not pt_br_markers.search(text):
        errors.append("Complaint text does not appear to be in PT-BR")

    if errors:
        return {"valid": False, "errors": errors, "complaint_text": text}

    complaint_id = f"SAC-{uuid.uuid4().hex[:8].upper()}"
    is_injectable = brand_upper in INJECTABLE_BRANDS
    case_type = "ADVERSE_EVENT" if cat_upper == "SAFETY" and is_injectable else "COMPLAINT"

    result = {
        "valid": True,
        "complaint_id": complaint_id,
        "product_brand": brand_upper,
        "product_name": product_name.strip(),
        "category": cat_upper,
        "case_type": case_type,
        "complaint_text": text,
        "scenario_type": scenario_type,
        "is_injectable": is_injectable,
        "char_count": len(text),
    }
    _current_generation.update(result)
    return result


# ============================================
# Tool 5: generate_lot_and_manufacturing (Deterministic CODE)
# ============================================
@tool
def generate_lot_and_manufacturing(
    product_brand: str,
    product_name: str = "",
) -> dict[str, Any]:
    """Generate lot number and manufacturing context for a Galderma product.

    Creates a realistic lot number in the format LOT-{YYYY}-{SITE_CODE}-{NNNNN}
    along with manufacturing site and expiry date.

    Args:
        product_brand: Galderma brand name (e.g., 'CETAPHIL').
        product_name: Product name (for context, not used in generation).

    Returns:
        Dict with lot_number, manufacturing_site, expiry_date, and sample_available.
    """
    brand_upper = product_brand.strip().upper()
    site_code = SITE_CODES.get(brand_upper, "GEN")
    year = datetime.now(UTC).year
    seq = random.randint(100, 99999)
    lot_number = f"LOT-{year}-{site_code}-{seq:05d}"

    manufacturing_site = MANUFACTURING_SITES.get(brand_upper, "Sophia Antipolis, France")

    expiry_months = random.randint(3, 18)
    expiry_date = (datetime.now(UTC) + timedelta(days=expiry_months * 30)).strftime("%Y-%m-%d")

    result = {
        "lot_number": lot_number,
        "manufacturing_site": manufacturing_site,
        "expiry_date": expiry_date,
        "sample_available": random.random() < 0.65,
    }
    _current_generation.update(result)
    return result


# ============================================
# Tool 6: assess_regulatory_impact (Deterministic CODE)
# ============================================
@tool
def assess_regulatory_impact(
    category: str,
    severity: str,
    case_type: str = "COMPLAINT",
    has_physical_symptoms: bool = False,
    is_injectable_product: bool = False,
) -> dict[str, Any]:
    """Assess regulatory impact and classification for a complaint.

    Determines regulatory reporting requirements based on complaint
    characteristics using deterministic rules per ANVISA/FDA guidelines.

    Args:
        category: Complaint category (PACKAGING, QUALITY, SAFETY, etc.).
        severity: Severity level (LOW, MEDIUM, HIGH, CRITICAL).
        case_type: Case type (COMPLAINT, INQUIRY, ADVERSE_EVENT).
        has_physical_symptoms: Whether customer reports physical symptoms.
        is_injectable_product: Whether the product is an injectable.

    Returns:
        Dict with regulatory classification, flags, and intake metadata.
    """
    cat = category.upper().strip()
    sev = severity.upper().strip()
    ctype = case_type.upper().strip()

    is_adverse = ctype == "ADVERSE_EVENT" or cat == "SAFETY"
    is_critical = sev in ("CRITICAL", "HIGH")

    # Regulatory classification
    if is_adverse and is_critical:
        reg_class = "SERIOUS_AE"
    elif is_adverse:
        reg_class = "MIR"
    elif is_critical:
        reg_class = "FIELD_ALERT"
    else:
        reg_class = "NONE"

    # Reporter type
    if is_injectable_product:
        reporter_type = "HCP"
    else:
        reporter_type = _weighted_choice(_CHANNEL_WEIGHTS[:3])  # PHONE/EMAIL/WEB
        reporter_type = _weighted_choice(
            [
                ("CONSUMER", 60),
                ("HCP", 15),
                ("SALES_REP", 15),
                ("DISTRIBUTOR", 10),
            ]
        )

    # Intake channel
    received_channel = _weighted_choice(_CHANNEL_WEIGHTS)

    # Dates
    now = datetime.now(UTC)
    received_offset = random.randint(0, 3)
    received_date = (now - timedelta(days=received_offset)).isoformat()

    sla_days = SLA_DAYS.get(sev, 10)
    sla_due_date = (now + timedelta(days=sla_days)).strftime("%Y-%m-%d")

    result = {
        "adverse_event_flag": is_adverse,
        "regulatory_reportable": is_adverse or is_critical,
        "regulatory_classification": reg_class,
        "reporter_type": reporter_type,
        "received_channel": received_channel,
        "received_date": received_date,
        "sla_due_date": sla_due_date,
    }
    _current_generation.update(result)
    return result


# ============================================
# Tool 7: generate_investigation_data (CODE validates LLM output)
# ============================================
@tool
def generate_investigation_data(
    category: str,
    severity: str,
    product_brand: str,
    complaint_summary: str,
    root_cause: str,
    capa_reference: str,
    assigned_investigator: str,
) -> dict[str, Any]:
    """Validate and structure investigation data generated by the LLM.

    The LLM generates root_cause, capa_reference, and assigned_investigator
    parameters based on its pharmaceutical domain knowledge. This tool
    validates the format and returns structured investigation data.

    Args:
        category: Complaint category for context.
        severity: Severity level for investigation depth.
        product_brand: Brand for manufacturing site context.
        complaint_summary: Brief summary of the complaint for reference.
        root_cause: Root cause analysis text (min 50 chars, in PT-BR).
        capa_reference: CAPA reference ID (format: CAPA-YYYY-NNNN).
        assigned_investigator: Name of assigned investigator.

    Returns:
        Dict with validated investigation data or error details.
    """
    errors: list[str] = []

    # Validate root cause
    rc_text = root_cause.strip()
    if len(rc_text) < 50:
        errors.append(f"Root cause too short ({len(rc_text)} chars, min 50)")

    # Validate CAPA reference format
    capa = capa_reference.strip()
    capa_pattern = re.compile(r"^CAPA-\d{4}-\d{4,}$")
    if not capa_pattern.match(capa):
        errors.append(f"Invalid CAPA format: '{capa}'. Expected: CAPA-YYYY-NNNN")

    # Validate investigator
    inv = assigned_investigator.strip()
    if len(inv) < 5:
        errors.append(f"Investigator name too short: '{inv}'")

    # Determine investigation status from severity
    sev = severity.upper().strip()
    if sev in ("CRITICAL", "HIGH"):
        investigation_status = "IN_PROGRESS"
    elif sev == "MEDIUM":
        investigation_status = random.choice(["IN_PROGRESS", "COMPLETED"])
    else:
        investigation_status = "COMPLETED"

    if errors:
        # If validation fails, generate fallback values
        fallback_inv = random.choice(_INVESTIGATORS_PT)
        year = datetime.now(UTC).year
        fallback_capa = f"CAPA-{year}-{random.randint(1000, 9999)}"
        result = {
            "investigation_valid": False,
            "investigation_errors": errors,
            "investigation_status": investigation_status,
            "root_cause": rc_text if len(rc_text) >= 50 else None,
            "capa_reference": capa if capa_pattern.match(capa) else fallback_capa,
            "assigned_investigator": inv if len(inv) >= 5 else fallback_inv,
        }
    else:
        result = {
            "investigation_valid": True,
            "investigation_status": investigation_status,
            "root_cause": rc_text,
            "capa_reference": capa,
            "assigned_investigator": inv,
        }

    _current_generation.update(result)
    return result

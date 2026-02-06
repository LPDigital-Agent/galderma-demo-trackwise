# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Generator - Tool Functions
# ============================================
#
# 4 @tool functions following the Sandwich Pattern:
#   - select_product: CODE (deterministic random selection)
#   - generate_customer_profile: CODE (deterministic)
#   - determine_severity: CODE (deterministic rules)
#   - generate_complaint_text: CODE validation of LLM output
#
# The LLM (Gemini 3 Pro) generates the complaint text
# and these tools validate/structure the output.
#
# ============================================

from __future__ import annotations

import random
import re
import uuid
from datetime import datetime, timedelta
from typing import Any

from strands import tool


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
# Brazilian data pools for customer generation
# ============================================
_FIRST_NAMES_F = [
    "Ana", "Maria", "Juliana", "Fernanda", "Camila", "Beatriz", "Larissa",
    "Patricia", "Luciana", "Carolina", "Amanda", "Gabriela", "Renata", "Tatiane",
    "Priscila", "Raquel", "Vanessa", "Daniela", "Aline", "Mariana",
]
_FIRST_NAMES_M = [
    "Carlos", "Pedro", "Lucas", "Rafael", "Bruno", "Felipe", "Andre",
    "Marcos", "Ricardo", "Eduardo", "Gustavo", "Fernando", "Diego", "Thiago",
    "Rodrigo", "Leonardo", "Henrique", "Matheus", "Vinicius", "Gabriel",
]
_LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida",
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
    "Araujo", "Melo", "Barbosa", "Cardoso", "Nascimento", "Moreira",
]
_CITIES = [
    ("Sao Paulo", "SP"), ("Rio de Janeiro", "RJ"), ("Belo Horizonte", "MG"),
    ("Salvador", "BA"), ("Brasilia", "DF"), ("Curitiba", "PR"),
    ("Fortaleza", "CE"), ("Recife", "PE"), ("Porto Alegre", "RS"),
    ("Manaus", "AM"), ("Goiania", "GO"), ("Campinas", "SP"),
    ("Florianopolis", "SC"), ("Vitoria", "ES"), ("Niteroi", "RJ"),
]
_PHONE_DDDS = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "92"]


# ============================================
# Tool: select_product (Deterministic CODE)
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

    return {
        "product_brand": selected_brand,
        "product_name": selected_product,
        "is_injectable": selected_brand in INJECTABLE_BRANDS,
        "full_name": f"{selected_brand} {selected_product}",
    }


# ============================================
# Tool: generate_customer_profile (Deterministic CODE)
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

    # Generate email (lowercase, no accents — Brazilian email convention)
    email_name = f"{first_name.lower()}.{last_name.lower()}"
    email_domain = random.choice(["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "uol.com.br"])
    email = f"{email_name}{random.randint(1, 99)}@{email_domain}"

    # Generate phone (Brazilian format: +55 DDD 9XXXX-XXXX)
    ddd = random.choice(_PHONE_DDDS)
    phone = f"+55 {ddd} 9{random.randint(1000, 9999):04d}-{random.randint(1000, 9999):04d}"

    city, state = random.choice(_CITIES)

    # Registration date (1-365 days ago)
    days_ago = random.randint(1, 365)
    registration_date = (datetime.utcnow() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

    return {
        "customer_name": full_name,
        "customer_email": email,
        "customer_phone": phone,
        "city": city,
        "state": state,
        "gender": hint,
        "registration_date": registration_date,
    }


# ============================================
# Tool: determine_severity (Deterministic CODE)
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
        category: Complaint category (PACKAGING, QUALITY, EFFICACY, SAFETY, etc.)
        case_type: Case type (COMPLAINT, INQUIRY, ADVERSE_EVENT).
        has_physical_symptoms: Whether customer reports physical symptoms.
        is_injectable_product: Whether the product is an injectable (RESTYLANE, DYSPORT, SCULPTRA).

    Returns:
        Dict with severity level and reasoning.
    """
    cat = category.upper().strip()
    ctype = case_type.upper().strip()

    # CRITICAL: Injectable + adverse event + physical symptoms
    if is_injectable_product and ctype == "ADVERSE_EVENT" and has_physical_symptoms:
        return {
            "severity": "CRITICAL",
            "reason": "Injectable adverse event with physical symptoms requires immediate escalation",
        }

    # HIGH: Safety category, or adverse event with symptoms, or any injectable complaint
    if cat == "SAFETY" or (has_physical_symptoms and ctype == "ADVERSE_EVENT"):
        return {
            "severity": "HIGH",
            "reason": "Safety concern or adverse event with physical symptoms",
        }

    if is_injectable_product:
        return {
            "severity": "HIGH",
            "reason": "Injectable product complaint requires elevated priority",
        }

    # MEDIUM: Quality, efficacy, or recurring packaging
    if cat in ("QUALITY", "EFFICACY"):
        return {
            "severity": "MEDIUM",
            "reason": f"{cat} complaint requires standard investigation",
        }

    if cat == "PACKAGING":
        return {
            "severity": "MEDIUM",
            "reason": "Packaging issue may indicate manufacturing concern",
        }

    # LOW: Documentation, shipping, other
    return {
        "severity": "LOW",
        "reason": f"{cat} complaint is routine priority",
    }


# ============================================
# Tool: generate_complaint_text (CODE validation of LLM output)
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
        complaint_text: The PT-BR complaint text generated by the LLM.

    Returns:
        Structured complaint data with validation status.
    """
    # CODE validation layer — Sandwich Pattern
    errors: list[str] = []

    # Validate brand
    brand_upper = product_brand.strip().upper()
    if brand_upper not in GALDERMA_PRODUCTS:
        errors.append(f"Unknown brand: {product_brand}. Valid: {list(GALDERMA_PRODUCTS.keys())}")

    # Validate category
    cat_upper = category.strip().upper()
    if cat_upper not in COMPLAINT_CATEGORIES:
        errors.append(f"Unknown category: {category}. Valid: {COMPLAINT_CATEGORIES}")

    # Validate complaint text
    text = complaint_text.strip()
    if len(text) < 20:
        errors.append("Complaint text too short (min 20 chars)")
    if len(text) > 2000:
        errors.append("Complaint text too long (max 2000 chars)")

    # Check for PT-BR content (basic heuristic: common Portuguese words)
    pt_br_markers = re.compile(
        r"\b(comprei|produto|farmacia|problema|usando|reacao|pele|creme|gel|"
        r"reclamacao|recebi|defeito|embalagem|tratamento|alergia|irritacao|"
        r"gostaria|registrar|insatisfeito|devolucao|estou|fiz|apliquei)\b",
        re.IGNORECASE,
    )
    if not pt_br_markers.search(text):
        errors.append("Complaint text does not appear to be in PT-BR")

    if errors:
        return {
            "valid": False,
            "errors": errors,
            "complaint_text": text,
        }

    # Generate structured output
    complaint_id = f"SAC-{uuid.uuid4().hex[:8].upper()}"
    is_injectable = brand_upper in INJECTABLE_BRANDS
    case_type = "ADVERSE_EVENT" if cat_upper == "SAFETY" and is_injectable else "COMPLAINT"

    return {
        "valid": True,
        "complaint_id": complaint_id,
        "product_brand": brand_upper,
        "product_name": product_name.strip(),
        "full_product": f"{brand_upper} {product_name.strip()}",
        "category": cat_upper,
        "case_type": case_type,
        "complaint_text": text,
        "scenario_type": scenario_type,
        "is_injectable": is_injectable,
        "char_count": len(text),
        "generated_at": datetime.utcnow().isoformat(),
    }

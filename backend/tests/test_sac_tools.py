# ============================================
# Galderma TrackWise AI Autopilot Demo
# Backend Tests - SAC Agent Tools
# ============================================
#
# Unit tests for all 7 @tool functions.
# No LLM needed — all tools are CODE validators
# or deterministic generators.
#
# ============================================

import re

from src.sac.agent_tools import (
    GALDERMA_PRODUCTS,
    MANUFACTURING_SITES,
    assess_regulatory_impact,
    determine_severity,
    generate_complaint_text,
    generate_customer_profile,
    generate_investigation_data,
    generate_lot_and_manufacturing,
    get_generation_results,
    reset_generation,
    select_product,
)


class TestSharedAccumulator:
    """Tests for the shared generation accumulator."""

    def test_reset_clears_accumulator(self):
        reset_generation()
        result = get_generation_results()
        assert result == {}

    def test_accumulator_collects_across_tools(self):
        reset_generation()
        select_product(brand="CETAPHIL")
        generate_customer_profile(gender_hint="female")
        results = get_generation_results()
        assert "product_brand" in results
        assert "customer_name" in results

    def test_accumulator_returns_copy(self):
        reset_generation()
        select_product(brand="CETAPHIL")
        r1 = get_generation_results()
        r1["extra"] = "modified"
        r2 = get_generation_results()
        assert "extra" not in r2


class TestSelectProduct:
    """Tests for select_product tool."""

    def test_select_specific_brand(self):
        reset_generation()
        result = select_product(brand="CETAPHIL")
        assert result["product_brand"] == "CETAPHIL"
        assert result["product_name"] in GALDERMA_PRODUCTS["CETAPHIL"]
        assert result["is_injectable"] is False

    def test_select_injectable_brand(self):
        reset_generation()
        result = select_product(brand="RESTYLANE")
        assert result["product_brand"] == "RESTYLANE"
        assert result["is_injectable"] is True

    def test_select_random_brand(self):
        reset_generation()
        result = select_product(brand="")
        assert result["product_brand"] in GALDERMA_PRODUCTS

    def test_select_unknown_brand_falls_back(self):
        reset_generation()
        result = select_product(brand="UNKNOWN_BRAND")
        assert result["product_brand"] in GALDERMA_PRODUCTS

    def test_full_name_field(self):
        reset_generation()
        result = select_product(brand="DYSPORT")
        assert result["full_name"].startswith("DYSPORT ")

    def test_writes_to_accumulator(self):
        reset_generation()
        select_product(brand="BENZAC")
        results = get_generation_results()
        assert results["product_brand"] == "BENZAC"


class TestGenerateCustomerProfile:
    """Tests for generate_customer_profile tool."""

    def test_female_profile(self):
        reset_generation()
        result = generate_customer_profile(gender_hint="female")
        assert result["gender"] == "female"
        assert "@" in result["customer_email"]
        assert result["customer_phone"].startswith("+55")
        assert result["reporter_country"] == "Brasil"

    def test_male_profile(self):
        reset_generation()
        result = generate_customer_profile(gender_hint="male")
        assert result["gender"] == "male"

    def test_random_gender(self):
        reset_generation()
        result = generate_customer_profile(gender_hint="random")
        assert result["gender"] in ("male", "female")

    def test_phone_format(self):
        reset_generation()
        result = generate_customer_profile()
        phone = result["customer_phone"]
        assert re.match(r"^\+55 \d{2} 9\d{4}-\d{4}$", phone)

    def test_city_and_state_present(self):
        reset_generation()
        result = generate_customer_profile()
        assert "city" in result
        assert "state" in result


class TestDetermineSeverity:
    """Tests for determine_severity tool."""

    def test_critical_injectable_adverse_event(self):
        reset_generation()
        result = determine_severity(
            category="SAFETY",
            case_type="ADVERSE_EVENT",
            has_physical_symptoms=True,
            is_injectable_product=True,
        )
        assert result["severity"] == "CRITICAL"

    def test_high_safety_category(self):
        reset_generation()
        result = determine_severity(category="SAFETY")
        assert result["severity"] == "HIGH"

    def test_high_injectable_complaint(self):
        reset_generation()
        result = determine_severity(
            category="PACKAGING",
            is_injectable_product=True,
        )
        assert result["severity"] == "HIGH"

    def test_medium_quality(self):
        reset_generation()
        result = determine_severity(category="QUALITY")
        assert result["severity"] == "MEDIUM"

    def test_medium_packaging(self):
        reset_generation()
        result = determine_severity(category="PACKAGING")
        assert result["severity"] == "MEDIUM"

    def test_low_other(self):
        reset_generation()
        result = determine_severity(category="OTHER")
        assert result["severity"] == "LOW"

    def test_writes_severity_reason(self):
        reset_generation()
        result = determine_severity(category="EFFICACY")
        assert "severity_reason" in result
        assert len(result["severity_reason"]) > 0


class TestGenerateComplaintText:
    """Tests for generate_complaint_text tool."""

    def test_valid_complaint(self):
        reset_generation()
        result = generate_complaint_text(
            product_brand="CETAPHIL",
            product_name="Gentle Skin Cleanser",
            category="PACKAGING",
            scenario_type="RANDOM",
            complaint_text=(
                "Comprei o produto Cetaphil na farmácia e notei que a "
                "embalagem estava danificada. O selo de segurança estava rompido."
            ),
        )
        assert result["valid"] is True
        assert result["product_brand"] == "CETAPHIL"
        assert result["category"] == "PACKAGING"
        assert result["complaint_id"].startswith("SAC-")

    def test_text_too_short(self):
        reset_generation()
        result = generate_complaint_text(
            product_brand="CETAPHIL",
            product_name="Cleanser",
            category="QUALITY",
            scenario_type="RANDOM",
            complaint_text="curto",
        )
        assert result["valid"] is False
        assert any("too short" in e for e in result["errors"])

    def test_text_too_long(self):
        reset_generation()
        long_text = "Comprei o produto na farmácia e " * 300
        result = generate_complaint_text(
            product_brand="CETAPHIL",
            product_name="Cleanser",
            category="QUALITY",
            scenario_type="RANDOM",
            complaint_text=long_text,
        )
        assert result["valid"] is False
        assert any("too long" in e for e in result["errors"])

    def test_unknown_brand(self):
        reset_generation()
        result = generate_complaint_text(
            product_brand="XYZNOTREAL",
            product_name="Nothing",
            category="QUALITY",
            scenario_type="RANDOM",
            complaint_text="Comprei o produto na farmácia e o problema é a qualidade.",
        )
        assert result["valid"] is False

    def test_injectable_safety_becomes_adverse_event(self):
        reset_generation()
        result = generate_complaint_text(
            product_brand="RESTYLANE",
            product_name="Restylane Lyft",
            category="SAFETY",
            scenario_type="ADVERSE_EVENT_HIGH",
            complaint_text=(
                "Fiz o procedimento de aplicacao de Restylane no consultório "
                "e tive uma reacao adversa séria. A pele ficou com irritacao intensa."
            ),
        )
        assert result["valid"] is True
        assert result["case_type"] == "ADVERSE_EVENT"
        assert result["is_injectable"] is True


class TestGenerateLotAndManufacturing:
    """Tests for generate_lot_and_manufacturing tool."""

    def test_known_brand(self):
        reset_generation()
        result = generate_lot_and_manufacturing(product_brand="CETAPHIL")
        assert result["lot_number"].startswith("LOT-")
        assert "HRT" in result["lot_number"]
        assert result["manufacturing_site"] == MANUFACTURING_SITES["CETAPHIL"]
        assert "expiry_date" in result
        assert isinstance(result["sample_available"], bool)

    def test_unknown_brand_fallback(self):
        reset_generation()
        result = generate_lot_and_manufacturing(product_brand="UNKNOWN")
        assert "GEN" in result["lot_number"]

    def test_lot_number_format(self):
        reset_generation()
        result = generate_lot_and_manufacturing(product_brand="DIFFERIN")
        pattern = r"^LOT-\d{4}-[A-Z]{3}-\d{5}$"
        assert re.match(pattern, result["lot_number"])


class TestAssessRegulatoryImpact:
    """Tests for assess_regulatory_impact tool."""

    def test_serious_ae_classification(self):
        reset_generation()
        result = assess_regulatory_impact(
            category="SAFETY",
            severity="CRITICAL",
            case_type="ADVERSE_EVENT",
            has_physical_symptoms=True,
            is_injectable_product=True,
        )
        assert result["regulatory_classification"] == "SERIOUS_AE"
        assert result["adverse_event_flag"] is True
        assert result["regulatory_reportable"] is True
        assert result["reporter_type"] == "HCP"

    def test_field_alert_critical(self):
        reset_generation()
        result = assess_regulatory_impact(
            category="PACKAGING",
            severity="CRITICAL",
            case_type="COMPLAINT",
        )
        assert result["regulatory_classification"] == "FIELD_ALERT"
        assert result["regulatory_reportable"] is True

    def test_none_classification_low(self):
        reset_generation()
        result = assess_regulatory_impact(
            category="OTHER",
            severity="LOW",
            case_type="COMPLAINT",
        )
        assert result["regulatory_classification"] == "NONE"
        assert result["adverse_event_flag"] is False

    def test_sla_due_date_present(self):
        reset_generation()
        result = assess_regulatory_impact(
            category="QUALITY",
            severity="MEDIUM",
        )
        assert "sla_due_date" in result
        assert "received_date" in result
        assert "received_channel" in result


class TestGenerateInvestigationData:
    """Tests for generate_investigation_data tool."""

    def test_valid_investigation(self):
        reset_generation()
        result = generate_investigation_data(
            category="PACKAGING",
            severity="MEDIUM",
            product_brand="CETAPHIL",
            complaint_summary="Embalagem danificada",
            root_cause=(
                "Análise de causa raiz via metodologia 5 Porquês: "
                "falha no adesivo de selagem devido a temperatura "
                "acima de 30C durante transporte."
            ),
            capa_reference="CAPA-2026-0042",
            assigned_investigator="Eng. Carlos Alberto Mendes",
        )
        assert result["investigation_valid"] is True
        assert result["root_cause"].startswith("Análise")
        assert result["capa_reference"] == "CAPA-2026-0042"
        assert result["investigation_status"] in ("IN_PROGRESS", "COMPLETED")

    def test_critical_severity_always_in_progress(self):
        reset_generation()
        result = generate_investigation_data(
            category="SAFETY",
            severity="CRITICAL",
            product_brand="RESTYLANE",
            complaint_summary="Reação adversa grave",
            root_cause="X" * 60,
            capa_reference="CAPA-2026-0099",
            assigned_investigator="Dra. Ana Paula Ferreira",
        )
        assert result["investigation_status"] == "IN_PROGRESS"

    def test_low_severity_completed(self):
        reset_generation()
        result = generate_investigation_data(
            category="OTHER",
            severity="LOW",
            product_brand="CETAPHIL",
            complaint_summary="Documentação incorreta",
            root_cause="Y" * 60,
            capa_reference="CAPA-2026-0001",
            assigned_investigator="Farmacêutico Ricardo Santos",
        )
        assert result["investigation_status"] == "COMPLETED"

    def test_invalid_capa_format_uses_fallback(self):
        reset_generation()
        result = generate_investigation_data(
            category="QUALITY",
            severity="MEDIUM",
            product_brand="BENZAC",
            complaint_summary="Gel com consistência alterada",
            root_cause="Z" * 60,
            capa_reference="INVALID-FORMAT",
            assigned_investigator="Eng. Mariana Costa Lima",
        )
        assert result["investigation_valid"] is False
        assert re.match(r"^CAPA-\d{4}-\d{4,}$", result["capa_reference"])

    def test_short_root_cause_flagged(self):
        reset_generation()
        result = generate_investigation_data(
            category="QUALITY",
            severity="MEDIUM",
            product_brand="DIFFERIN",
            complaint_summary="Gel sem efeito",
            root_cause="Curto",
            capa_reference="CAPA-2026-0010",
            assigned_investigator="Dra. Juliana Oliveira",
        )
        assert result["investigation_valid"] is False
        assert result["root_cause"] is None

    def test_short_investigator_name_uses_fallback(self):
        reset_generation()
        result = generate_investigation_data(
            category="PACKAGING",
            severity="LOW",
            product_brand="LOCERYL",
            complaint_summary="Tampa solta",
            root_cause="W" * 60,
            capa_reference="CAPA-2026-0020",
            assigned_investigator="AB",
        )
        assert result["investigation_valid"] is False
        assert len(result["assigned_investigator"]) >= 5

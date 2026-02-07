# ============================================
# Galderma TrackWise AI Autopilot Demo
# TrackWise Simulator - API Operations
# ============================================
#
# In-memory case management for demo purposes.
# Simulates TrackWise Digital CRUD operations.
#
# ============================================

import logging
import random
from collections.abc import Callable
from datetime import datetime

from .models import (
    GALDERMA_PRODUCTS,
    BatchCreate,
    BatchResult,
    Case,
    CaseCreate,
    CaseListResponse,
    CaseSeverity,
    CaseStatus,
    CaseType,
    CaseUpdate,
    ComplaintCategory,
    EventEnvelope,
    EventType,
)


# ============================================
# Logger
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "service": "simulator", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger("simulator")


# ============================================
# Demo Complaint Templates
# ============================================
DEMO_COMPLAINTS = {
    ComplaintCategory.PACKAGING: [
        "The seal on my {product} was broken when I received it.",
        "The pump mechanism on my {product} stopped working after a week.",
        "The packaging of my {product} was damaged during shipping.",
        "The expiration date on my {product} is not clearly visible.",
        "The cap on my {product} doesn't close properly.",
    ],
    ComplaintCategory.QUALITY: [
        "My {product} has a strange texture, different from what I usually get.",
        "The {product} appears to have separated inside the container.",
        "There are small particles floating in my {product}.",
        "The color of my {product} looks different from my previous purchase.",
        "My {product} has a different smell than usual.",
    ],
    ComplaintCategory.EFFICACY: [
        "I've been using {product} for 2 weeks with no visible improvement.",
        "The {product} doesn't seem as effective as before.",
        "My skin condition got worse after using {product}.",
        "The {product} is not providing the results I expected.",
        "I switched to {product} but it's not working for me.",
    ],
    ComplaintCategory.SAFETY: [
        "I experienced a mild rash after using {product}.",
        "My skin became red and irritated after applying {product}.",
        "I had an allergic reaction to {product}.",
        "The {product} caused burning sensation on my skin.",
        "I noticed increased dryness after using {product}.",
    ],
    ComplaintCategory.SHIPPING: [
        "My order of {product} arrived late.",
        "I received the wrong {product} in my shipment.",
        "My {product} was not included in the delivery.",
        "The tracking number for my {product} order doesn't work.",
        "My {product} arrived melted due to heat during shipping.",
    ],
}

DEMO_CUSTOMER_NAMES = [
    "Maria Silva",
    "João Santos",
    "Ana Oliveira",
    "Pedro Costa",
    "Carla Ferreira",
    "Lucas Almeida",
    "Julia Ribeiro",
    "Rafael Pereira",
    "Fernanda Lima",
    "Bruno Souza",
    "Patricia Gomes",
    "Marcos Rodrigues",
    "Beatriz Martins",
    "Gustavo Carvalho",
    "Camila Araújo",
]


# ============================================
# Simulator API Class
# ============================================
class SimulatorAPI:
    """In-memory TrackWise Simulator for demo purposes."""

    def __init__(self) -> None:
        """Initialize the simulator with empty case storage."""
        self._cases: dict[str, Case] = {}
        self._events: list[EventEnvelope] = []
        self._event_callback: Callable[..., None] | None = None
        logger.info("TrackWise Simulator initialized")

    def set_event_callback(self, callback: Callable[..., None]) -> None:
        """Set callback function to be called when events are emitted."""
        self._event_callback = callback

    # ============================================
    # Case Operations
    # ============================================
    def create_case(self, case_data: CaseCreate) -> tuple[Case, EventEnvelope]:
        """Create a new case and emit CaseCreated event.

        Args:
            case_data: Case creation data

        Returns:
            Tuple of (created case, emitted event)
        """
        # Pass through ALL CaseCreate fields to Case.
        # Both inherit from CaseBase, so field names match.
        # exclude_none=True preserves Case defaults (e.g. severity=MEDIUM)
        # when CaseCreate fields aren't set.
        case_fields = case_data.model_dump(exclude_none=True)
        case = Case(**case_fields)

        self._cases[case.case_id] = case
        logger.info(f"Case created: {case.case_id}")

        # Emit event
        event = self._emit_event(
            event_type=EventType.CASE_CREATED,
            payload={
                "case_id": case.case_id,
                "case": case.model_dump(mode="json"),
            },
        )

        return case, event

    def get_case(self, case_id: str) -> Case | None:
        """Get a case by ID.

        Args:
            case_id: Case identifier

        Returns:
            Case if found, None otherwise
        """
        return self._cases.get(case_id)

    def update_case(
        self, case_id: str, update_data: CaseUpdate
    ) -> tuple[Case | None, EventEnvelope | None]:
        """Update an existing case.

        Args:
            case_id: Case identifier
            update_data: Fields to update

        Returns:
            Tuple of (updated case, emitted event) or (None, None) if not found
        """
        case = self._cases.get(case_id)
        if not case:
            logger.warning(f"Case not found: {case_id}")
            return None, None

        previous_status = case.status

        # Apply updates
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if value is not None:
                setattr(case, field, value)

        case.updated_at = datetime.utcnow()

        # Update closed_at if status changed to CLOSED
        if case.status == CaseStatus.CLOSED and previous_status != CaseStatus.CLOSED:
            case.closed_at = datetime.utcnow()

        self._cases[case_id] = case
        logger.info(f"Case updated: {case_id}")

        # Emit event
        event = self._emit_event(
            event_type=EventType.CASE_UPDATED,
            payload={
                "case_id": case.case_id,
                "case": case.model_dump(mode="json"),
                "previous_status": previous_status.value,
            },
        )

        return case, event

    def close_case(
        self,
        case_id: str,
        resolution_text: str,
        resolution_text_pt: str | None = None,
        resolution_text_en: str | None = None,
        resolution_text_es: str | None = None,
        resolution_text_fr: str | None = None,
        processed_by_agent: str | None = None,
    ) -> tuple[Case | None, EventEnvelope | None]:
        """Close a case with resolution.

        Args:
            case_id: Case identifier
            resolution_text: Canonical resolution text
            resolution_text_*: Localized resolution texts
            processed_by_agent: Agent that processed the case

        Returns:
            Tuple of (closed case, emitted event) or (None, None) if not found
        """
        case = self._cases.get(case_id)
        if not case:
            logger.warning(f"Case not found: {case_id}")
            return None, None

        previous_status = case.status
        case.status = CaseStatus.CLOSED
        case.resolution_text = resolution_text
        case.resolution_text_pt = resolution_text_pt
        case.resolution_text_en = resolution_text_en
        case.resolution_text_es = resolution_text_es
        case.resolution_text_fr = resolution_text_fr
        case.processed_by_agent = processed_by_agent
        case.updated_at = datetime.utcnow()
        case.closed_at = datetime.utcnow()

        self._cases[case_id] = case
        logger.info(f"Case closed: {case_id}")

        # Emit appropriate event
        event_type = (
            EventType.FACTORY_COMPLAINT_CLOSED
            if case.case_type == CaseType.COMPLAINT
            else EventType.CASE_CLOSED
        )

        event = self._emit_event(
            event_type=event_type,
            payload={
                "case_id": case.case_id,
                "case": case.model_dump(mode="json"),
                "previous_status": previous_status.value,
            },
        )

        return case, event

    def list_cases(
        self,
        status: CaseStatus | None = None,
        severity: CaseSeverity | None = None,
        case_type: CaseType | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> CaseListResponse:
        """List cases with optional filters.

        Args:
            status: Filter by status
            severity: Filter by severity
            case_type: Filter by type
            page: Page number (1-indexed)
            page_size: Items per page

        Returns:
            Paginated case list response
        """
        cases = list(self._cases.values())

        # Apply filters
        if status:
            cases = [c for c in cases if c.status == status]
        if severity:
            cases = [c for c in cases if c.severity == severity]
        if case_type:
            cases = [c for c in cases if c.case_type == case_type]

        # Sort by created_at descending
        cases.sort(key=lambda c: c.created_at, reverse=True)

        total = len(cases)

        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        cases = cases[start:end]

        return CaseListResponse(
            total=total,
            cases=cases,
            page=page,
            page_size=page_size,
        )

    def delete_case(self, case_id: str) -> bool:
        """Delete a case (for demo reset only).

        Args:
            case_id: Case identifier

        Returns:
            True if deleted, False if not found
        """
        if case_id in self._cases:
            del self._cases[case_id]
            logger.info(f"Case deleted: {case_id}")
            return True
        return False

    # ============================================
    # Batch Operations
    # ============================================
    def create_batch(self, batch_data: BatchCreate) -> BatchResult:
        """Create a batch of demo cases.

        Args:
            batch_data: Batch creation parameters

        Returns:
            Batch creation result
        """
        case_ids: list[str] = []
        events_emitted = 0

        for i in range(batch_data.count):
            case_data = self._generate_demo_case(
                index=i,
                include_recurring=batch_data.include_recurring,
                include_adverse_events=batch_data.include_adverse_events,
                include_linked_inquiries=batch_data.include_linked_inquiries,
            )

            case, event = self.create_case(case_data)
            case_ids.append(case.case_id)
            events_emitted += 1

            # Create linked inquiry if applicable
            if (
                batch_data.include_linked_inquiries
                and case.case_type == CaseType.COMPLAINT
                and random.random() < 0.3
            ):
                inquiry_data = CaseCreate(
                    product_brand=case.product_brand,
                    product_name=case.product_name,
                    complaint_text=f"Follow-up inquiry regarding {case.case_id}",
                    customer_name=case.customer_name,
                    customer_email=case.customer_email,
                    case_type=CaseType.INQUIRY,
                    linked_case_id=case.case_id,
                )
                inquiry, _ = self.create_case(inquiry_data)
                case_ids.append(inquiry.case_id)
                events_emitted += 1

        logger.info(f"Batch created: {len(case_ids)} cases")

        return BatchResult(
            created_count=len(case_ids),
            case_ids=case_ids,
            events_emitted=events_emitted,
        )

    def _generate_demo_case(
        self,
        index: int,
        include_recurring: bool,
        include_adverse_events: bool,
        include_linked_inquiries: bool,
    ) -> CaseCreate:
        """Generate a demo case with realistic data.

        Args:
            index: Case index in batch
            include_recurring: Include recurring patterns
            include_adverse_events: Include adverse events
            include_linked_inquiries: Include inquiries

        Returns:
            Generated case data
        """
        # Select random brand and product
        brand = random.choice(list(GALDERMA_PRODUCTS.keys()))
        product = random.choice(GALDERMA_PRODUCTS[brand])

        # Select category (with recurring patterns)
        if include_recurring and index % 3 == 0:
            # Recurring: always PACKAGING with broken seal
            category = ComplaintCategory.PACKAGING
            complaint = DEMO_COMPLAINTS[category][0].format(product=f"{brand} {product}")
        elif include_adverse_events and random.random() < 0.1:
            # Adverse event: SAFETY category
            category = ComplaintCategory.SAFETY
            complaint = random.choice(DEMO_COMPLAINTS[category]).format(
                product=f"{brand} {product}"
            )
        else:
            # Random category
            category = random.choice(list(ComplaintCategory))
            if category in DEMO_COMPLAINTS:
                complaint = random.choice(DEMO_COMPLAINTS[category]).format(
                    product=f"{brand} {product}"
                )
            else:
                complaint = f"Issue with my {brand} {product}."

        # Customer data
        customer = random.choice(DEMO_CUSTOMER_NAMES)

        # Case type
        case_type = (
            CaseType.ADVERSE_EVENT
            if include_adverse_events and category == ComplaintCategory.SAFETY
            else CaseType.COMPLAINT
        )

        return CaseCreate(
            product_brand=brand,
            product_name=product,
            complaint_text=complaint,
            customer_name=customer,
            customer_email=f"{customer.lower().replace(' ', '.')}@example.com",
            case_type=case_type,
            category=category,
            lot_number=f"LOT-{random.randint(10000, 99999)}",
        )

    # ============================================
    # Demo Reset
    # ============================================
    def reset_demo(self) -> dict[str, int]:
        """Reset all demo data.

        Returns:
            Count of cleared items
        """
        cases_cleared = len(self._cases)
        events_cleared = len(self._events)

        self._cases.clear()
        self._events.clear()

        logger.info(f"Demo reset: {cases_cleared} cases, {events_cleared} events cleared")

        return {
            "cases_cleared": cases_cleared,
            "events_cleared": events_cleared,
        }

    # ============================================
    # Galderma Demo Scenario
    # ============================================
    def create_galderma_scenario(self) -> dict[str, int | list[str] | str]:
        """Create the Galderma demo scenario with deterministic cases.

        Demonstrates all key capabilities:
        - 3 recurring complaints (CLOSED by AI): CETAPHIL, DIFFERIN, BENZAC
        - 1 non-recurring complaint (PENDING_REVIEW): RESTYLANE (HIGH severity)
        - 1 complaint + linked inquiry pair (CLOSED): CETAPHIL Gentle Cleanser

        Returns:
            Summary of created cases
        """
        case_ids: list[str] = []

        # ── 1. Recurring: CETAPHIL Moisturizing Lotion — Packaging/Broken Seal ──
        c1, _ = self.create_case(
            CaseCreate(
                product_brand="CETAPHIL",
                product_name="Moisturizing Lotion",
                complaint_text=(
                    "O lacre do meu CETAPHIL Moisturizing Lotion estava violado quando recebi. "
                    "O produto aparentava ter sido aberto anteriormente."
                ),
                customer_name="Maria Silva",
                customer_email="maria.silva@example.com",
                case_type=CaseType.COMPLAINT,
                category=ComplaintCategory.PACKAGING,
                lot_number="LOT-24871",
            )
        )
        c1.recurring_pattern_id = "PKG-SEAL-001"
        c1.severity = CaseSeverity.LOW
        c1.ai_confidence = 0.94
        c1.ai_recommendation = "AUTO_CLOSE — Padrão PKG-SEAL-001"
        c1.guardian_approved = True
        self.close_case(
            case_id=c1.case_id,
            resolution_text="Replacement product shipped. Pattern PKG-SEAL-001 confirmed recurring.",
            resolution_text_pt=(
                "Prezada cliente, agradecemos por entrar em contato sobre o CETAPHIL Moisturizing Lotion. "
                "Após análise, confirmamos que o problema de lacre violado foi classificado como recorrente "
                "(padrão PKG-SEAL-001). Um produto substituto será enviado em até 5 dias úteis. "
                "Pedimos desculpas pelo inconveniente."
            ),
            resolution_text_en=(
                "Dear customer, thank you for contacting us about your CETAPHIL Moisturizing Lotion. "
                "After analysis, we confirmed the broken seal issue was classified as recurring "
                "(pattern PKG-SEAL-001). A replacement product will be shipped within 5 business days. "
                "We apologize for the inconvenience."
            ),
            resolution_text_es=(
                "Estimada cliente, agradecemos su contacto sobre el CETAPHIL Moisturizing Lotion. "
                "Tras el análisis, confirmamos que el problema del sello roto fue clasificado como "
                "recurrente (patrón PKG-SEAL-001). Un producto de reemplazo será enviado en un plazo "
                "de 5 días hábiles. Lamentamos las molestias."
            ),
            resolution_text_fr=(
                "Chère cliente, nous vous remercions de nous avoir contactés au sujet de votre "
                "CETAPHIL Moisturizing Lotion. Après analyse, nous confirmons que le problème de "
                "scellé brisé a été classé comme récurrent (modèle PKG-SEAL-001). Un produit de "
                "remplacement sera expédié sous 5 jours ouvrables. Nous nous excusons pour le désagrément."
            ),
            processed_by_agent="resolution_composer",
        )
        case_ids.append(c1.case_id)

        # ── 2. Recurring: DIFFERIN Gel 0.3% — Quality/Texture Change ──
        c2, _ = self.create_case(
            CaseCreate(
                product_brand="DIFFERIN",
                product_name="Adapalene Gel 0.3%",
                complaint_text=(
                    "Meu DIFFERIN Adapalene Gel 0.3% tem uma textura estranha, diferente do que costumo receber. "
                    "O gel parece mais aquoso que o normal."
                ),
                customer_name="João Santos",
                customer_email="joao.santos@example.com",
                case_type=CaseType.COMPLAINT,
                category=ComplaintCategory.QUALITY,
                lot_number="LOT-31502",
            )
        )
        c2.recurring_pattern_id = "QTY-TEXT-001"
        c2.severity = CaseSeverity.LOW
        c2.ai_confidence = 0.92
        c2.ai_recommendation = "AUTO_CLOSE — Padrão QTY-TEXT-001"
        c2.guardian_approved = True
        self.close_case(
            case_id=c2.case_id,
            resolution_text="Quality investigation initiated. Pattern QTY-TEXT-001 confirmed recurring. Replacement shipped.",
            resolution_text_pt=(
                "Prezado cliente, agradecemos por entrar em contato sobre o DIFFERIN Adapalene Gel 0.3%. "
                "Após análise, confirmamos que a alteração de textura reportada foi classificada como "
                "recorrente (padrão QTY-TEXT-001). Uma investigação de qualidade foi iniciada no lote "
                "LOT-31502 e um produto substituto será enviado em até 5 dias úteis."
            ),
            resolution_text_en=(
                "Dear customer, thank you for contacting us about your DIFFERIN Adapalene Gel 0.3%. "
                "After analysis, we confirmed the reported texture change was classified as recurring "
                "(pattern QTY-TEXT-001). A quality investigation has been initiated for lot LOT-31502 "
                "and a replacement product will be shipped within 5 business days."
            ),
            resolution_text_es=(
                "Estimado cliente, agradecemos su contacto sobre el DIFFERIN Adapalene Gel 0.3%. "
                "Tras el análisis, confirmamos que el cambio de textura reportado fue clasificado como "
                "recurrente (patrón QTY-TEXT-001). Se ha iniciado una investigación de calidad en el lote "
                "LOT-31502 y un producto de reemplazo será enviado en un plazo de 5 días hábiles."
            ),
            resolution_text_fr=(
                "Cher client, nous vous remercions de nous avoir contactés au sujet de votre "
                "DIFFERIN Adapalene Gel 0.3%. Après analyse, nous confirmons que le changement de "
                "texture signalé a été classé comme récurrent (modèle QTY-TEXT-001). Une enquête "
                "qualité a été lancée pour le lot LOT-31502 et un produit de remplacement sera "
                "expédié sous 5 jours ouvrables."
            ),
            processed_by_agent="resolution_composer",
        )
        case_ids.append(c2.case_id)

        # ── 3. Recurring: BENZAC AC 5% Gel — Efficacy/No Improvement ──
        c3, _ = self.create_case(
            CaseCreate(
                product_brand="BENZAC",
                product_name="Benzac AC Gel 5%",
                complaint_text=(
                    "Estou usando BENZAC AC Gel 5% há 2 semanas sem melhora visível. "
                    "Minha condição de pele não apresentou nenhuma mudança."
                ),
                customer_name="Ana Oliveira",
                customer_email="ana.oliveira@example.com",
                case_type=CaseType.COMPLAINT,
                category=ComplaintCategory.EFFICACY,
                lot_number="LOT-18293",
            )
        )
        c3.recurring_pattern_id = "EFF-RESP-001"
        c3.severity = CaseSeverity.LOW
        c3.ai_confidence = 0.91
        c3.ai_recommendation = "AUTO_CLOSE — Padrão EFF-RESP-001"
        c3.guardian_approved = True
        self.close_case(
            case_id=c3.case_id,
            resolution_text="Efficacy counseling provided. Pattern EFF-RESP-001 confirmed recurring.",
            resolution_text_pt=(
                "Prezada cliente, agradecemos por entrar em contato sobre o BENZAC AC Gel 5%. "
                "Após análise, confirmamos que a ausência de melhora reportada foi classificada como "
                "recorrente (padrão EFF-RESP-001). Recomendamos consulta dermatológica para avaliação "
                "da posologia. O tratamento com peróxido de benzoíla pode levar de 4 a 8 semanas para "
                "resultados visíveis."
            ),
            resolution_text_en=(
                "Dear customer, thank you for contacting us about BENZAC AC Gel 5%. "
                "After analysis, we confirmed the reported lack of improvement was classified as "
                "recurring (pattern EFF-RESP-001). We recommend a dermatological consultation to "
                "evaluate dosage. Benzoyl peroxide treatment may take 4 to 8 weeks for visible results."
            ),
            resolution_text_es=(
                "Estimada cliente, agradecemos su contacto sobre el BENZAC AC Gel 5%. "
                "Tras el análisis, confirmamos que la falta de mejora reportada fue clasificada como "
                "recurrente (patrón EFF-RESP-001). Recomendamos una consulta dermatológica para "
                "evaluar la dosificación. El tratamiento con peróxido de benzoílo puede tardar "
                "de 4 a 8 semanas en mostrar resultados visibles."
            ),
            resolution_text_fr=(
                "Chère cliente, nous vous remercions de nous avoir contactés au sujet du "
                "BENZAC AC Gel 5%. Après analyse, nous confirmons que l'absence d'amélioration "
                "signalée a été classée comme récurrente (modèle EFF-RESP-001). Nous recommandons "
                "une consultation dermatologique pour évaluer la posologie. Le traitement au peroxyde "
                "de benzoyle peut prendre de 4 à 8 semaines pour des résultats visibles."
            ),
            processed_by_agent="resolution_composer",
        )
        case_ids.append(c3.case_id)

        # ── 4. Non-recurring: RESTYLANE Kysse — Safety/Allergic Reaction (HIGH) ──
        c4, _ = self.create_case(
            CaseCreate(
                product_brand="RESTYLANE",
                product_name="Restylane Kysse",
                complaint_text=(
                    "Tive uma reação alérgica após aplicação do RESTYLANE Kysse. "
                    "Meus lábios ficaram muito inchados e com vermelhidão intensa 48h após o procedimento."
                ),
                customer_name="Carla Ferreira",
                customer_email="carla.ferreira@example.com",
                case_type=CaseType.COMPLAINT,
                category=ComplaintCategory.SAFETY,
                lot_number="LOT-55042",
            )
        )
        # Escalate to PENDING_REVIEW — Human-in-the-Loop
        self.update_case(
            c4.case_id,
            CaseUpdate(
                status=CaseStatus.PENDING_REVIEW,
                severity=CaseSeverity.HIGH,
                ai_confidence=0.45,
                ai_recommendation="HUMAN_REVIEW — Severidade HIGH, evento adverso potencial",
            ),
        )
        case_ids.append(c4.case_id)

        # ── 5+6. Linked Pair: CETAPHIL Gentle Cleanser (Complaint + Inquiry) ──
        # 5a. Complaint — factory concluded → CLOSED
        c5, _ = self.create_case(
            CaseCreate(
                product_brand="CETAPHIL",
                product_name="Gentle Skin Cleanser",
                complaint_text=(
                    "O meu CETAPHIL Gentle Skin Cleanser veio com a embalagem danificada. "
                    "O frasco estava amassado e o produto vazou durante o transporte."
                ),
                customer_name="Rafael Pereira",
                customer_email="rafael.pereira@example.com",
                case_type=CaseType.COMPLAINT,
                category=ComplaintCategory.PACKAGING,
                lot_number="LOT-37614",
            )
        )
        c5.recurring_pattern_id = "PKG-SEAL-001"
        c5.severity = CaseSeverity.LOW
        c5.ai_confidence = 0.93
        c5.ai_recommendation = "AUTO_CLOSE — Padrão PKG-SEAL-001"
        c5.guardian_approved = True
        self.close_case(
            case_id=c5.case_id,
            resolution_text="Factory investigation complete. Packaging defect confirmed in LOT-37614.",
            resolution_text_pt=(
                "Prezado cliente, agradecemos por entrar em contato sobre o CETAPHIL Gentle Skin Cleanser. "
                "A investigação da fábrica foi concluída e o defeito de embalagem no lote LOT-37614 foi "
                "confirmado. Um produto substituto foi enviado. Medidas corretivas foram implementadas "
                "na linha de produção."
            ),
            resolution_text_en=(
                "Dear customer, thank you for contacting us about your CETAPHIL Gentle Skin Cleanser. "
                "The factory investigation has been completed and the packaging defect in lot LOT-37614 "
                "was confirmed. A replacement product has been shipped. Corrective actions have been "
                "implemented on the production line."
            ),
            resolution_text_es=(
                "Estimado cliente, agradecemos su contacto sobre el CETAPHIL Gentle Skin Cleanser. "
                "La investigación de fábrica ha sido completada y el defecto de embalaje en el lote "
                "LOT-37614 fue confirmado. Un producto de reemplazo ha sido enviado. Acciones "
                "correctivas han sido implementadas en la línea de producción."
            ),
            resolution_text_fr=(
                "Cher client, nous vous remercions de nous avoir contactés au sujet de votre "
                "CETAPHIL Gentle Skin Cleanser. L'enquête en usine a été complétée et le défaut "
                "d'emballage du lot LOT-37614 a été confirmé. Un produit de remplacement a été "
                "expédié. Des actions correctives ont été mises en place sur la ligne de production."
            ),
            processed_by_agent="resolution_composer",
        )
        case_ids.append(c5.case_id)

        # 5b. Linked Inquiry — auto-closed via Inquiry Bridge cascade
        c6, _ = self.create_case(
            CaseCreate(
                product_brand="CETAPHIL",
                product_name="Gentle Skin Cleanser",
                complaint_text=(
                    f"Consulta de acompanhamento referente à reclamação {c5.case_id}. "
                    "Cliente solicita atualização sobre o status da investigação."
                ),
                customer_name="Rafael Pereira",
                customer_email="rafael.pereira@example.com",
                case_type=CaseType.INQUIRY,
                category=ComplaintCategory.PACKAGING,
                linked_case_id=c5.case_id,
            )
        )
        c6.severity = CaseSeverity.LOW
        c6.ai_confidence = 0.98
        c6.ai_recommendation = (
            f"INQUIRY_CASCADE_CLOSED — Reclamação vinculada {c5.case_id} concluída"
        )
        self.close_case(
            case_id=c6.case_id,
            resolution_text=f"Inquiry auto-closed. Linked complaint {c5.case_id} resolved by factory.",
            resolution_text_pt=(
                f"Consulta encerrada automaticamente. A reclamação vinculada {c5.case_id} foi "
                "concluída pela fábrica. A investigação confirmou o defeito e medidas corretivas "
                "foram implementadas."
            ),
            resolution_text_en=(
                f"Inquiry automatically closed. Linked complaint {c5.case_id} has been resolved "
                "by the factory. Investigation confirmed the defect and corrective actions have "
                "been implemented."
            ),
            resolution_text_es=(
                f"Consulta cerrada automáticamente. La reclamación vinculada {c5.case_id} ha sido "
                "resuelta por la fábrica. La investigación confirmó el defecto y se implementaron "
                "acciones correctivas."
            ),
            resolution_text_fr=(
                f"Consultation clôturée automatiquement. La réclamation liée {c5.case_id} a été "
                "résolue par l'usine. L'enquête a confirmé le défaut et des actions correctives "
                "ont été mises en place."
            ),
            processed_by_agent="inquiry_bridge",
        )
        case_ids.append(c6.case_id)

        logger.info(f"Galderma scenario created: {len(case_ids)} cases")
        return {
            "created_count": len(case_ids),
            "case_ids": case_ids,
            "scenario": "galderma",
            "description": "3 recurring (CLOSED) + 1 non-recurring (PENDING_REVIEW) + 1 linked pair (CLOSED)",
        }

    # ============================================
    # Event Management
    # ============================================
    def _emit_event(self, event_type: EventType, payload: dict) -> EventEnvelope:
        """Emit an event and notify callback if set.

        Args:
            event_type: Type of event
            payload: Event payload

        Returns:
            Created event envelope
        """
        event = EventEnvelope(
            event_type=event_type,
            payload=payload,
        )

        self._events.append(event)
        logger.info(f"Event emitted: {event_type.value} - {event.event_id}")

        # Call callback if set (for A2A integration)
        if self._event_callback:
            try:
                self._event_callback(event)
            except Exception as e:
                logger.error(f"Event callback failed: {e}")

        return event

    def get_events(
        self, limit: int = 100, event_type: EventType | None = None
    ) -> list[EventEnvelope]:
        """Get recent events.

        Args:
            limit: Maximum events to return
            event_type: Filter by event type

        Returns:
            List of events (newest first)
        """
        events = self._events.copy()

        if event_type:
            events = [e for e in events if e.event_type == event_type]

        events.sort(key=lambda e: e.timestamp, reverse=True)

        return events[:limit]

    # ============================================
    # Statistics
    # ============================================
    def get_stats(self) -> dict[str, int]:
        """Get simulator statistics.

        Returns:
            Dictionary with counts
        """
        cases = list(self._cases.values())

        return {
            "total_cases": len(cases),
            "open_cases": len([c for c in cases if c.status == CaseStatus.OPEN]),
            "in_progress_cases": len([c for c in cases if c.status == CaseStatus.IN_PROGRESS]),
            "closed_cases": len([c for c in cases if c.status == CaseStatus.CLOSED]),
            "complaints": len([c for c in cases if c.case_type == CaseType.COMPLAINT]),
            "inquiries": len([c for c in cases if c.case_type == CaseType.INQUIRY]),
            "adverse_events": len([c for c in cases if c.case_type == CaseType.ADVERSE_EVENT]),
            "low_severity": len([c for c in cases if c.severity == CaseSeverity.LOW]),
            "medium_severity": len([c for c in cases if c.severity == CaseSeverity.MEDIUM]),
            "high_severity": len([c for c in cases if c.severity == CaseSeverity.HIGH]),
            "critical_severity": len([c for c in cases if c.severity == CaseSeverity.CRITICAL]),
            "total_events": len(self._events),
        }


# ============================================
# Singleton Instance
# ============================================
simulator_api = SimulatorAPI()

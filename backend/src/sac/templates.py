# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Module - Complaint Templates (PT-BR)
# ============================================
#
# ~50 PT-BR complaint templates used as
# deterministic fallback when the Gemini agent
# is unavailable. Each category has 7-8 realistic
# complaint texts with {product_name} placeholders.
#
# ============================================

import random

from src.simulator.models import (
    GALDERMA_PRODUCTS,
    CaseCreate,
    CaseSeverity,
    CaseType,
    ComplaintCategory,
)


# ============================================
# Injectable products (trigger CRITICAL severity)
# ============================================
INJECTABLE_BRANDS = {"RESTYLANE", "DYSPORT", "SCULPTRA"}

# ============================================
# PT-BR Complaint Templates by Category
# ============================================
COMPLAINT_TEMPLATES_PT: dict[ComplaintCategory, list[str]] = {
    ComplaintCategory.PACKAGING: [
        "O lacre do meu {product_name} estava violado quando recebi. O produto aparentava ter sido aberto anteriormente.",
        "A bomba do meu {product_name} parou de funcionar depois de uma semana de uso.",
        "A embalagem do {product_name} veio amassada e com sinais de vazamento.",
        "A data de validade do {product_name} nao esta claramente visivel na embalagem.",
        "A tampa do meu {product_name} nao fecha corretamente, o produto vaza na bolsa.",
        "O rotulo do {product_name} esta descolando e nao consigo ler as instrucoes.",
        "Recebi o {product_name} com a caixa externa rasgada e o lacre interno rompido.",
        "O dosador do {product_name} esta travado e nao consigo dispensar o produto.",
    ],
    ComplaintCategory.QUALITY: [
        "Meu {product_name} tem uma textura estranha, diferente do que costumo receber.",
        "O {product_name} parece ter separado dentro do recipiente, com uma camada liquida por cima.",
        "Existem pequenas particulas flutuando no meu {product_name}.",
        "A cor do meu {product_name} esta diferente da minha compra anterior.",
        "Meu {product_name} tem um cheiro diferente do habitual, quase rancido.",
        "A consistencia do {product_name} esta muito mais liquida que o normal.",
        "O {product_name} cristalizou dentro do tubo e nao sai corretamente.",
        "Percebi grumos no meu {product_name} que nao existiam antes.",
    ],
    ComplaintCategory.EFFICACY: [
        "Estou usando {product_name} ha 2 semanas sem melhora visivel na minha pele.",
        "O {product_name} nao parece tao eficaz como antes, nao noto nenhuma diferenca.",
        "Minha condicao de pele piorou apos usar {product_name} por 3 semanas.",
        "O {product_name} nao esta proporcionando os resultados que eu esperava.",
        "Troquei para o {product_name} mas nao esta funcionando para mim.",
        "Apos 1 mes de uso do {product_name}, minha acne continua igual.",
        "O {product_name} funcionou nas primeiras semanas mas agora parou de fazer efeito.",
    ],
    ComplaintCategory.SAFETY: [
        "Tive uma reacao alergica apos usar {product_name}. Minha pele ficou muito vermelha e inchada.",
        "Minha pele ficou avermelhada e irritada apos aplicar {product_name}.",
        "Tive uma reacao alergica ao {product_name} com coceira intensa e inchacos.",
        "O {product_name} causou sensacao de queimacao na minha pele que durou horas.",
        "Notei ressecamento extremo apos usar {product_name}, com descamacao intensa.",
        "Desenvolvi urticaria apos a aplicacao do {product_name}.",
        "Tive inchacos e vermelhidao intensa 48h apos aplicacao do {product_name}.",
        "O {product_name} causou bolhas na minha pele apos a primeira aplicacao.",
    ],
    ComplaintCategory.SHIPPING: [
        "Meu pedido de {product_name} chegou com 2 semanas de atraso.",
        "Recebi o {product_name} errado no meu pedido, veio outro produto.",
        "Meu {product_name} nao veio incluido na entrega, faltou no pacote.",
        "O numero de rastreamento do meu pedido de {product_name} nao funciona.",
        "Meu {product_name} chegou derretido devido ao calor durante o transporte.",
        "A entrega do {product_name} foi feita no endereco errado.",
        "O pacote do {product_name} foi deixado na chuva e o produto estragou.",
    ],
    ComplaintCategory.DOCUMENTATION: [
        "A bula do {product_name} esta em idioma diferente, nao consigo ler.",
        "As instrucoes de uso do {product_name} estao confusas e contraditorias.",
        "A bula do {product_name} nao menciona possiveis interacoes medicamentosas.",
        "O {product_name} nao veio com bula dentro da embalagem.",
        "As informacoes de dosagem do {product_name} estao ilegiveis na embalagem.",
        "A bula do {product_name} nao corresponde ao produto que esta na caixa.",
        "Nao encontro informacoes sobre conservacao do {product_name} na embalagem.",
    ],
    ComplaintCategory.OTHER: [
        "Tenho uma duvida sobre o uso do {product_name} que nao encontro resposta.",
        "Preciso de informacoes adicionais sobre o {product_name}.",
        "Gostaria de relatar uma experiencia incomum com o {product_name}.",
        "Tenho uma sugestao de melhoria para o {product_name}.",
        "O preco do {product_name} aumentou muito, gostaria de entender o motivo.",
        "Nao consigo encontrar o {product_name} nas farmacias da minha regiao.",
        "Gostaria de saber se o {product_name} pode ser usado durante a gravidez.",
    ],
}

# ============================================
# Customer Names
# ============================================
MALE_NAMES = [
    "Joao Santos", "Pedro Costa", "Lucas Almeida", "Rafael Pereira",
    "Bruno Souza", "Marcos Rodrigues", "Gustavo Carvalho", "Felipe Lima",
    "Andre Ferreira", "Ricardo Oliveira", "Daniel Ribeiro", "Thiago Martins",
    "Gabriel Gomes", "Eduardo Araujo", "Matheus Barbosa", "Leonardo Nascimento",
    "Henrique Rocha", "Vinicius Dias", "Rodrigo Mendes", "Fernando Moreira",
]

FEMALE_NAMES = [
    "Maria Silva", "Ana Oliveira", "Carla Ferreira", "Julia Ribeiro",
    "Fernanda Lima", "Patricia Gomes", "Beatriz Martins", "Camila Araujo",
    "Larissa Costa", "Amanda Santos", "Isabela Pereira", "Gabriela Almeida",
    "Mariana Souza", "Leticia Rodrigues", "Bruna Carvalho", "Tatiana Barbosa",
    "Carolina Nascimento", "Renata Rocha", "Daniela Dias", "Vanessa Mendes",
]


def _determine_severity(
    category: ComplaintCategory | None,
    case_type: CaseType,
    product_brand: str,
) -> CaseSeverity:
    """Determine case severity based on category, type, and product.

    Args:
        category: Complaint category.
        case_type: Type of case (COMPLAINT, ADVERSE_EVENT, INQUIRY).
        product_brand: Product brand name.

    Returns:
        Appropriate severity level.
    """
    if case_type == CaseType.ADVERSE_EVENT:
        if product_brand in INJECTABLE_BRANDS:
            return CaseSeverity.CRITICAL
        return CaseSeverity.HIGH

    if category == ComplaintCategory.SAFETY:
        return CaseSeverity.HIGH

    if category in (
        ComplaintCategory.PACKAGING,
        ComplaintCategory.SHIPPING,
        ComplaintCategory.DOCUMENTATION,
    ):
        return CaseSeverity.LOW

    if category in (ComplaintCategory.QUALITY, ComplaintCategory.EFFICACY):
        return CaseSeverity.MEDIUM

    # OTHER or None
    return CaseSeverity.MEDIUM


def _pick_product(product_brand: str | None) -> tuple[str, str]:
    """Pick a random Galderma product, optionally constrained to a brand.

    Args:
        product_brand: Optional brand constraint.

    Returns:
        Tuple of (brand, product_name).
    """
    if product_brand and product_brand.upper() in GALDERMA_PRODUCTS:
        brand = product_brand.upper()
    else:
        brand = random.choice(list(GALDERMA_PRODUCTS.keys()))
    product_name = random.choice(GALDERMA_PRODUCTS[brand])
    return brand, product_name


def _pick_customer() -> tuple[str, str]:
    """Pick a random customer name and generate email.

    Returns:
        Tuple of (customer_name, customer_email).
    """
    all_names = MALE_NAMES + FEMALE_NAMES
    name = random.choice(all_names)
    email = f"{name.lower().replace(' ', '.')}@example.com"
    return name, email


def generate_from_template(
    scenario_type: str,
    product_brand: str | None = None,
    category: ComplaintCategory | None = None,
) -> CaseCreate:
    """Generate a case from PT-BR templates (no LLM). Deterministic fallback.

    Args:
        scenario_type: The ScenarioType value to generate for.
        product_brand: Optional brand constraint.
        category: Optional category override.

    Returns:
        CaseCreate object ready to be persisted via SimulatorAPI.
    """
    brand, product_name = _pick_product(product_brand)
    customer_name, customer_email = _pick_customer()
    full_product = f"{brand} {product_name}"

    # Determine category and case_type based on scenario
    case_type = CaseType.COMPLAINT
    lot_number: str | None = f"LOT-{random.randint(10000, 99999)}"
    linked_case_id: str | None = None

    if scenario_type == "RECURRING_COMPLAINT":
        cat = ComplaintCategory.PACKAGING
        templates = COMPLAINT_TEMPLATES_PT[cat]
        # Pick from "broken seal" / "damaged packaging" templates (first 3)
        complaint = random.choice(templates[:3]).format(product_name=full_product)

    elif scenario_type == "ADVERSE_EVENT_HIGH":
        cat = ComplaintCategory.SAFETY
        case_type = CaseType.ADVERSE_EVENT
        complaint = random.choice(COMPLAINT_TEMPLATES_PT[cat]).format(
            product_name=full_product,
        )

    elif scenario_type == "LINKED_INQUIRY":
        # Generate the complaint half of the linked pair
        cat = category or random.choice([
            ComplaintCategory.PACKAGING,
            ComplaintCategory.QUALITY,
        ])
        templates = COMPLAINT_TEMPLATES_PT.get(cat, COMPLAINT_TEMPLATES_PT[ComplaintCategory.OTHER])
        complaint = random.choice(templates).format(product_name=full_product)

    elif scenario_type == "MISSING_DATA":
        # Omit category and lot_number to simulate incomplete intake
        cat = None
        lot_number = None
        all_templates = [
            t
            for templates_list in COMPLAINT_TEMPLATES_PT.values()
            for t in templates_list
        ]
        complaint = random.choice(all_templates).format(product_name=full_product)

    elif scenario_type == "MULTI_PRODUCT_BATCH":
        cat = category or random.choice(list(ComplaintCategory))
        templates = COMPLAINT_TEMPLATES_PT.get(cat, COMPLAINT_TEMPLATES_PT[ComplaintCategory.OTHER])
        complaint = random.choice(templates).format(product_name=full_product)

    else:
        # RANDOM
        cat = category or random.choice(list(ComplaintCategory))
        templates = COMPLAINT_TEMPLATES_PT.get(cat, COMPLAINT_TEMPLATES_PT[ComplaintCategory.OTHER])
        complaint = random.choice(templates).format(product_name=full_product)

    severity = _determine_severity(cat, case_type, brand)

    return CaseCreate(
        product_brand=brand,
        product_name=product_name,
        complaint_text=complaint,
        customer_name=customer_name,
        customer_email=customer_email,
        case_type=case_type,
        category=cat,
        severity=severity,
        lot_number=lot_number,
        linked_case_id=linked_case_id,
    )

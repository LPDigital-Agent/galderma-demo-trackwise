# ============================================
# Galderma TrackWise AI Autopilot Demo
# SAC Module - Complaint Templates (Multi-Language)
# ============================================
#
# ~200 complaint templates across 4 languages
# (PT-BR, EN, ES, FR) used as deterministic
# fallback when the Gemini agent is unavailable.
# Each category has 7-8 realistic complaint texts
# with {product_name} placeholders.
#
# ============================================

import random
import unicodedata
from datetime import datetime, timedelta

from src.simulator.models import (
    GALDERMA_PRODUCTS,
    CaseCreate,
    CaseSeverity,
    CaseType,
    ComplaintCategory,
    InvestigationStatus,
    ReceivedChannel,
    RegulatoryClassification,
    ReporterType,
)


# ============================================
# Injectable products (trigger CRITICAL severity)
# ============================================
INJECTABLE_BRANDS = {"RESTYLANE", "DYSPORT", "SCULPTRA"}

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

# Country mapping by language code
COUNTRY_BY_LANG: dict[str, str] = {
    "pt": "Brasil",
    "en": "United States",
    "es": "México",
    "fr": "France",
}

# Weighted channel distribution
CHANNEL_WEIGHTS: list[tuple[ReceivedChannel, int]] = [
    (ReceivedChannel.PHONE, 30),
    (ReceivedChannel.EMAIL, 30),
    (ReceivedChannel.WEB, 25),
    (ReceivedChannel.SOCIAL_MEDIA, 10),
    (ReceivedChannel.IN_PERSON, 5),
]

# Investigation status weights for new cases
INVESTIGATION_WEIGHTS: list[tuple[InvestigationStatus, int]] = [
    (InvestigationStatus.NOT_STARTED, 50),
    (InvestigationStatus.IN_PROGRESS, 30),
    (InvestigationStatus.NOT_REQUIRED, 15),
    (InvestigationStatus.COMPLETED, 5),
]

# SLA days by severity
SLA_DAYS: dict[CaseSeverity, int] = {
    CaseSeverity.CRITICAL: 3,
    CaseSeverity.HIGH: 5,
    CaseSeverity.MEDIUM: 10,
    CaseSeverity.LOW: 30,
}


def _weighted_choice(weights: list[tuple]) -> object:
    """Pick a random item based on weights."""
    items, w = zip(*weights, strict=True)
    return random.choices(items, weights=w, k=1)[0]


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
# English Complaint Templates by Category
# ============================================
COMPLAINT_TEMPLATES_EN: dict[ComplaintCategory, list[str]] = {
    ComplaintCategory.PACKAGING: [
        "The seal on my {product_name} was broken when I received it. It looked like it had been opened before.",
        "The pump on my {product_name} stopped working after just one week of use.",
        "The {product_name} packaging arrived crushed and there were signs of leaking inside the box.",
        "I can barely read the expiration date on my {product_name}, the print is so faded.",
        "The cap on my {product_name} won't close properly and the product leaks in my bag.",
        "The label on my {product_name} is peeling off and I can't read the instructions anymore.",
        "My {product_name} arrived with the outer box torn and the inner seal completely broken.",
        "The dispenser on my {product_name} is jammed and I can't get any product out no matter what I try.",
    ],
    ComplaintCategory.QUALITY: [
        "My {product_name} has a weird gritty texture that's completely different from what I usually get.",
        "The {product_name} seems to have separated inside the container, there's a watery layer sitting on top.",
        "I noticed small particles floating around in my {product_name} which is really concerning.",
        "The color of my {product_name} looks noticeably different from my previous purchase.",
        "My {product_name} has an off smell, almost rancid, nothing like the usual scent.",
        "The consistency of my {product_name} is way more runny than it should be.",
        "The {product_name} has crystallized inside the tube and won't come out properly.",
        "There are lumps in my {product_name} that definitely were not there when I first bought it.",
    ],
    ComplaintCategory.EFFICACY: [
        "I've been using {product_name} for 2 weeks now and I'm not seeing any improvement at all.",
        "The {product_name} doesn't seem as effective as it used to be, I'm not noticing any difference.",
        "My skin condition actually got worse after using {product_name} for 3 weeks straight.",
        "The {product_name} is not delivering the results I was expecting based on what my dermatologist said.",
        "I switched to {product_name} but it's just not working for my skin type.",
        "After a full month of using {product_name}, my acne is exactly the same as before.",
        "The {product_name} worked great for the first couple of weeks but then completely stopped being effective.",
    ],
    ComplaintCategory.SAFETY: [
        "I had a serious allergic reaction after using {product_name}. My skin turned really red and swelled up.",
        "My face got extremely red and irritated right after I applied the {product_name}.",
        "I broke out in severe hives with intense itching and swelling after using {product_name}.",
        "The {product_name} caused a burning sensation on my skin that lasted for several hours.",
        "I experienced extreme dryness with heavy flaking after starting {product_name}.",
        "I developed hives all over the application area after using {product_name}.",
        "I had significant swelling and intense redness 48 hours after the {product_name} treatment.",
        "The {product_name} caused blisters on my skin after just the first application.",
    ],
    ComplaintCategory.SHIPPING: [
        "My order of {product_name} showed up 2 weeks late with no explanation from the carrier.",
        "I received the wrong product in my order, I ordered {product_name} but got something completely different.",
        "My {product_name} was missing from the delivery, the box came with everything else except that.",
        "The tracking number for my {product_name} order doesn't work and nobody can tell me where it is.",
        "My {product_name} arrived completely melted because of the heat during shipping.",
        "The {product_name} delivery was made to the wrong address and I had to go pick it up myself.",
        "The package with my {product_name} was left out in the rain and the product is ruined.",
    ],
    ComplaintCategory.DOCUMENTATION: [
        "The insert for {product_name} is in a language I don't understand, I need English instructions.",
        "The usage instructions for {product_name} are confusing and seem to contradict each other.",
        "The {product_name} leaflet doesn't mention anything about possible drug interactions.",
        "My {product_name} didn't come with any package insert or instructions at all.",
        "The dosage information on my {product_name} packaging is completely illegible.",
        "The package insert in my {product_name} doesn't match the actual product in the box.",
        "I can't find any storage instructions for {product_name} anywhere on the packaging.",
    ],
    ComplaintCategory.OTHER: [
        "I have a question about using {product_name} that I can't find an answer to anywhere.",
        "I need some additional information about {product_name} that isn't on your website.",
        "I'd like to report an unusual experience I had with {product_name}.",
        "I have a suggestion for improving the {product_name} formulation.",
        "The price of {product_name} went up significantly and I'd like to understand why.",
        "I can't find {product_name} in any pharmacy near me, is it being discontinued?",
        "I'd like to know if {product_name} is safe to use during pregnancy.",
    ],
}

# ============================================
# Spanish Complaint Templates by Category
# ============================================
COMPLAINT_TEMPLATES_ES: dict[ComplaintCategory, list[str]] = {
    ComplaintCategory.PACKAGING: [
        "El sello de mi {product_name} estaba roto cuando lo recibi. Parecia que alguien lo habia abierto antes.",
        "La bomba de mi {product_name} dejo de funcionar despues de solo una semana de uso.",
        "El envase del {product_name} llego aplastado y con senales de que se habia derramado por dentro.",
        "La fecha de vencimiento del {product_name} casi no se puede leer en el empaque.",
        "La tapa de mi {product_name} no cierra bien y el producto se derrama dentro de mi bolso.",
        "La etiqueta del {product_name} se esta despegando y ya no puedo leer las instrucciones.",
        "Recibi el {product_name} con la caja externa rota y el sello interior completamente abierto.",
        "El dosificador del {product_name} esta trabado y no logro sacar nada de producto.",
    ],
    ComplaintCategory.QUALITY: [
        "Mi {product_name} tiene una textura granulosa extrana, muy diferente a lo que siempre compro.",
        "El {product_name} parece haberse separado dentro del recipiente, hay una capa de liquido arriba.",
        "Note pequenas particulas flotando dentro de mi {product_name} y me preocupa bastante.",
        "El color de mi {product_name} se ve claramente diferente al de mi compra anterior.",
        "Mi {product_name} tiene un olor raro, casi rancio, no huele como siempre.",
        "La consistencia del {product_name} esta mucho mas liquida de lo normal.",
        "El {product_name} se cristalizo dentro del tubo y no sale correctamente.",
        "Encontre grumos en mi {product_name} que antes no estaban ahi.",
    ],
    ComplaintCategory.EFFICACY: [
        "Llevo 2 semanas usando {product_name} y no veo ninguna mejoria en mi piel.",
        "El {product_name} ya no parece tan efectivo como antes, no noto ninguna diferencia.",
        "Mi condicion de piel empeoro despues de usar {product_name} durante 3 semanas.",
        "El {product_name} no esta dando los resultados que mi dermatologo me habia prometido.",
        "Cambie al {product_name} pero no me esta funcionando para nada.",
        "Despues de 1 mes usando {product_name}, mi acne sigue exactamente igual.",
        "El {product_name} funciono bien las primeras semanas pero despues dejo de hacer efecto.",
    ],
    ComplaintCategory.SAFETY: [
        "Tuve una reaccion alergica fuerte despues de usar {product_name}. Mi piel se puso muy roja e hinchada.",
        "Mi cara se enrojencio mucho y se irrito justo despues de aplicarme el {product_name}.",
        "Me salieron ronchas con picazon intensa e hinchazon despues de usar {product_name}.",
        "El {product_name} me causo una sensacion de ardor en la piel que me duro varias horas.",
        "Tuve una resequedad extrema con descamacion severa despues de empezar con {product_name}.",
        "Me salio urticaria en toda la zona donde me aplique el {product_name}.",
        "Tuve hinchazon y enrojecimiento intenso 48 horas despues del tratamiento con {product_name}.",
        "El {product_name} me causo ampollas en la piel desde la primera aplicacion.",
    ],
    ComplaintCategory.SHIPPING: [
        "Mi pedido de {product_name} llego con 2 semanas de retraso sin ninguna explicacion.",
        "Recibi un producto equivocado, pedi {product_name} pero me mandaron otra cosa.",
        "Mi {product_name} no venia en el paquete, llego todo lo demas menos eso.",
        "El numero de seguimiento de mi pedido de {product_name} no funciona y nadie me da razon.",
        "Mi {product_name} llego completamente derretido por el calor durante el envio.",
        "La entrega del {product_name} se hizo en una direccion equivocada y tuve que ir a buscarlo.",
        "El paquete con mi {product_name} lo dejaron bajo la lluvia y el producto se echo a perder.",
    ],
    ComplaintCategory.DOCUMENTATION: [
        "El prospecto del {product_name} esta en un idioma que no entiendo, necesito las instrucciones en espanol.",
        "Las instrucciones de uso del {product_name} son confusas y se contradicen entre si.",
        "El prospecto del {product_name} no menciona nada sobre posibles interacciones con otros medicamentos.",
        "Mi {product_name} no traia ningun prospecto ni instrucciones adentro.",
        "La informacion de dosificacion del {product_name} esta completamente ilegible en el empaque.",
        "El prospecto que viene en mi {product_name} no corresponde al producto que esta en la caja.",
        "No encuentro instrucciones de almacenamiento del {product_name} en ninguna parte del empaque.",
    ],
    ComplaintCategory.OTHER: [
        "Tengo una pregunta sobre el uso de {product_name} que no logro encontrar en ningun lado.",
        "Necesito informacion adicional sobre {product_name} que no aparece en su pagina web.",
        "Quisiera reportar una experiencia inusual que tuve con el {product_name}.",
        "Tengo una sugerencia para mejorar la formulacion del {product_name}.",
        "El precio del {product_name} subio mucho y me gustaria saber por que.",
        "No consigo encontrar {product_name} en ninguna farmacia de mi zona, se descontinuo?",
        "Me gustaria saber si es seguro usar {product_name} durante el embarazo.",
    ],
}

# ============================================
# French Complaint Templates by Category
# ============================================
COMPLAINT_TEMPLATES_FR: dict[ComplaintCategory, list[str]] = {
    ComplaintCategory.PACKAGING: [
        "Le scelle de mon {product_name} etait brise quand je l'ai recu. On aurait dit qu'il avait deja ete ouvert.",
        "La pompe de mon {product_name} a cesse de fonctionner apres seulement une semaine d'utilisation.",
        "L'emballage du {product_name} est arrive ecrase avec des traces de fuite a l'interieur.",
        "La date de peremption du {product_name} est pratiquement illisible sur l'emballage.",
        "Le bouchon de mon {product_name} ne ferme plus correctement et le produit coule dans mon sac.",
        "L'etiquette du {product_name} se decolle et je n'arrive plus a lire les instructions.",
        "J'ai recu mon {product_name} avec la boite dechire et le scelle interieur completement rompu.",
        "Le doseur du {product_name} est bloque et je n'arrive plus a sortir de produit.",
    ],
    ComplaintCategory.QUALITY: [
        "Mon {product_name} a une texture granuleuse bizarre, completement differente de d'habitude.",
        "Le {product_name} semble s'etre separe dans le recipient, il y a une couche liquide au-dessus.",
        "J'ai remarque des petites particules qui flottent dans mon {product_name}, c'est assez inquietant.",
        "La couleur de mon {product_name} est nettement differente de mon achat precedent.",
        "Mon {product_name} a une odeur bizarre, presque rance, rien a voir avec l'odeur habituelle.",
        "La consistance du {product_name} est beaucoup plus liquide que la normale.",
        "Le {product_name} a cristallise a l'interieur du tube et ne sort plus correctement.",
        "Il y a des grumeaux dans mon {product_name} qui n'etaient pas la avant.",
    ],
    ComplaintCategory.EFFICACY: [
        "J'utilise {product_name} depuis 2 semaines et je ne vois aucune amelioration sur ma peau.",
        "Le {product_name} ne semble plus aussi efficace qu'avant, je ne remarque aucune difference.",
        "L'etat de ma peau a empire apres avoir utilise {product_name} pendant 3 semaines.",
        "Le {product_name} ne donne pas du tout les resultats que mon dermatologue m'avait annonces.",
        "Je suis passe au {product_name} mais ca ne fonctionne pas du tout pour ma peau.",
        "Apres 1 mois complet d'utilisation du {product_name}, mon acne n'a pas bouge d'un poil.",
        "Le {product_name} a bien marche les premieres semaines mais apres il a completement cesse de faire effet.",
    ],
    ComplaintCategory.SAFETY: [
        "J'ai eu une reaction allergique apres avoir utilise {product_name}. Ma peau est devenue tres rouge et gonflee.",
        "Mon visage est devenu tout rouge et irrite juste apres l'application du {product_name}.",
        "J'ai fait une poussee d'urticaire avec des demangeaisons intenses et un gonflement apres avoir utilise {product_name}.",
        "Le {product_name} a provoque une sensation de brulure sur ma peau qui a dure plusieurs heures.",
        "J'ai eu une secheresse extreme avec une desquamation severe apres avoir commence le {product_name}.",
        "J'ai developpe de l'urticaire sur toute la zone d'application du {product_name}.",
        "J'ai eu un gonflement important et des rougeurs intenses 48 heures apres le traitement au {product_name}.",
        "Le {product_name} m'a cause des cloques sur la peau des la premiere application.",
    ],
    ComplaintCategory.SHIPPING: [
        "Ma commande de {product_name} est arrivee avec 2 semaines de retard sans aucune explication.",
        "J'ai recu le mauvais produit dans ma commande, j'avais commande du {product_name} mais on m'a envoye autre chose.",
        "Mon {product_name} manquait dans la livraison, j'ai recu tout le reste sauf ca.",
        "Le numero de suivi de ma commande de {product_name} ne fonctionne pas et personne ne peut me renseigner.",
        "Mon {product_name} est arrive completement fondu a cause de la chaleur pendant le transport.",
        "La livraison du {product_name} a ete faite a la mauvaise adresse et j'ai du aller le chercher.",
        "Le colis avec mon {product_name} a ete laisse sous la pluie et le produit est fichu.",
    ],
    ComplaintCategory.DOCUMENTATION: [
        "La notice du {product_name} est dans une langue que je ne comprends pas, j'ai besoin des instructions en francais.",
        "Les instructions d'utilisation du {product_name} sont confuses et se contredisent.",
        "La notice du {product_name} ne mentionne rien sur les possibles interactions medicamenteuses.",
        "Mon {product_name} n'etait accompagne d'aucune notice ni mode d'emploi.",
        "Les informations de dosage du {product_name} sont completement illisibles sur l'emballage.",
        "La notice dans mon {product_name} ne correspond pas au produit qui se trouve dans la boite.",
        "Je ne trouve aucune instruction de conservation du {product_name} sur l'emballage.",
    ],
    ComplaintCategory.OTHER: [
        "J'ai une question sur l'utilisation du {product_name} et je ne trouve la reponse nulle part.",
        "J'aurais besoin d'informations supplementaires sur le {product_name} qui ne sont pas sur votre site.",
        "Je voudrais signaler une experience inhabituelle que j'ai eue avec le {product_name}.",
        "J'ai une suggestion pour ameliorer la formulation du {product_name}.",
        "Le prix du {product_name} a beaucoup augmente et j'aimerais comprendre pourquoi.",
        "Je ne trouve plus le {product_name} dans aucune pharmacie pres de chez moi, est-il arrete?",
        "J'aimerais savoir si le {product_name} est sans risque pendant la grossesse.",
    ],
}

# ============================================
# Customer Names — PT-BR
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

# ============================================
# Customer Names — English
# ============================================
MALE_NAMES_EN = [
    "James Wilson", "Michael Johnson", "Robert Thompson", "William Davis",
    "David Anderson", "Thomas Martinez", "Christopher Lee", "Daniel Harris",
    "Matthew Clark", "Andrew Robinson", "Joshua Walker", "Ryan Mitchell",
    "Brandon Carter", "Nathan Phillips", "Tyler Campbell", "Kevin Parker",
    "Justin Edwards", "Aaron Stewart", "Adam Collins", "Brian Turner",
]

FEMALE_NAMES_EN = [
    "Jennifer Smith", "Sarah Williams", "Emily Brown", "Jessica Taylor",
    "Ashley Moore", "Amanda Jackson", "Stephanie White", "Nicole Martin",
    "Megan Garcia", "Rachel Thomas", "Lauren Robinson", "Samantha Hall",
    "Katherine Allen", "Rebecca Young", "Heather King", "Brittany Wright",
    "Christina Lopez", "Hannah Hill", "Olivia Scott", "Victoria Adams",
]

# ============================================
# Customer Names — Spanish
# ============================================
MALE_NAMES_ES = [
    "Carlos Garcia", "Miguel Rodriguez", "Alejandro Martinez", "Javier Lopez",
    "Diego Hernandez", "Pablo Gonzalez", "Andres Sanchez", "Fernando Ramirez",
    "Roberto Torres", "Santiago Flores", "Manuel Diaz", "Ricardo Moreno",
    "Oscar Alvarez", "Enrique Romero", "Luis Navarro", "Alberto Ruiz",
    "Sergio Jimenez", "Ivan Mendoza", "Hector Vargas", "Francisco Castillo",
]

FEMALE_NAMES_ES = [
    "Sofia Martinez", "Valentina Lopez", "Isabella Garcia", "Camila Rodriguez",
    "Lucia Hernandez", "Mariana Gonzalez", "Andrea Sanchez", "Daniela Ramirez",
    "Gabriela Torres", "Carolina Flores", "Paula Diaz", "Natalia Moreno",
    "Alejandra Alvarez", "Fernanda Romero", "Catalina Navarro", "Elena Ruiz",
    "Ana Maria Jimenez", "Laura Mendoza", "Claudia Vargas", "Diana Castillo",
]

# ============================================
# Customer Names — French
# ============================================
MALE_NAMES_FR = [
    "Jean Dupont", "Pierre Martin", "Nicolas Bernard", "Antoine Dubois",
    "Julien Thomas", "Sebastien Robert", "Francois Richard", "Mathieu Petit",
    "Alexandre Durand", "Guillaume Leroy", "Laurent Moreau", "Philippe Simon",
    "Christophe Michel", "Stephane Lefebvre", "Vincent Lecomte", "Olivier Garcia",
    "Benoit Roux", "Arnaud David", "Maxime Bertrand", "Romain Lambert",
]

FEMALE_NAMES_FR = [
    "Marie Dupont", "Sophie Martin", "Camille Bernard", "Julie Dubois",
    "Claire Thomas", "Isabelle Robert", "Nathalie Richard", "Aurelie Petit",
    "Emilie Durand", "Charlotte Leroy", "Virginie Moreau", "Valerie Simon",
    "Celine Michel", "Sandrine Lefebvre", "Marion Lecomte", "Helene Garcia",
    "Delphine Roux", "Pauline David", "Laetitia Bertrand", "Elodie Lambert",
]

# ============================================
# Language Registry Dictionaries
# ============================================
COMPLAINT_TEMPLATES: dict[str, dict[ComplaintCategory, list[str]]] = {
    "pt": COMPLAINT_TEMPLATES_PT,
    "en": COMPLAINT_TEMPLATES_EN,
    "es": COMPLAINT_TEMPLATES_ES,
    "fr": COMPLAINT_TEMPLATES_FR,
}

CUSTOMER_NAMES: dict[str, tuple[list[str], list[str]]] = {
    "pt": (MALE_NAMES, FEMALE_NAMES),
    "en": (MALE_NAMES_EN, FEMALE_NAMES_EN),
    "es": (MALE_NAMES_ES, FEMALE_NAMES_ES),
    "fr": (MALE_NAMES_FR, FEMALE_NAMES_FR),
}

SUPPORTED_LANGUAGES = ["pt", "en", "es", "fr"]


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


def _pick_customer(language: str = "pt") -> tuple[str, str]:
    """Pick a random customer name and generate email.

    Args:
        language: Language code for name pool selection (pt, en, es, fr).

    Returns:
        Tuple of (customer_name, customer_email).
    """
    males, females = CUSTOMER_NAMES.get(language, CUSTOMER_NAMES["pt"])
    all_names = males + females
    name = random.choice(all_names)
    # Normalize accented characters for email
    normalized = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    email = f"{normalized.lower().replace(' ', '.')}@example.com"
    return name, email


def generate_from_template(
    scenario_type: str,
    product_brand: str | None = None,
    category: ComplaintCategory | None = None,
    language: str | None = None,
) -> tuple[CaseCreate, str]:
    """Generate a case from multi-language templates (no LLM). Deterministic fallback.

    Args:
        scenario_type: The ScenarioType value to generate for.
        product_brand: Optional brand constraint.
        category: Optional category override.
        language: Language code (pt, en, es, fr). If None, randomly selected.

    Returns:
        Tuple of (CaseCreate object, language code used).
    """
    lang = language if language in SUPPORTED_LANGUAGES else random.choice(SUPPORTED_LANGUAGES)
    templates_dict = COMPLAINT_TEMPLATES[lang]

    brand, product_name = _pick_product(product_brand)
    customer_name, customer_email = _pick_customer(lang)
    full_product = f"{brand} {product_name}"

    # Determine category and case_type based on scenario
    case_type = CaseType.COMPLAINT
    lot_number: str | None = f"LOT-{random.randint(10000, 99999)}"
    linked_case_id: str | None = None

    if scenario_type == "RECURRING_COMPLAINT":
        cat = ComplaintCategory.PACKAGING
        templates = templates_dict[cat]
        # Pick from "broken seal" / "damaged packaging" templates (first 3)
        complaint = random.choice(templates[:3]).format(product_name=full_product)

    elif scenario_type == "ADVERSE_EVENT_HIGH":
        cat = ComplaintCategory.SAFETY
        case_type = CaseType.ADVERSE_EVENT
        complaint = random.choice(templates_dict[cat]).format(
            product_name=full_product,
        )

    elif scenario_type == "LINKED_INQUIRY":
        # Generate the complaint half of the linked pair
        cat = category or random.choice([
            ComplaintCategory.PACKAGING,
            ComplaintCategory.QUALITY,
        ])
        templates = templates_dict.get(cat, templates_dict[ComplaintCategory.OTHER])
        complaint = random.choice(templates).format(product_name=full_product)

    elif scenario_type == "MISSING_DATA":
        # Omit category and lot_number to simulate incomplete intake
        cat = None
        lot_number = None
        all_templates = [
            t
            for templates_list in templates_dict.values()
            for t in templates_list
        ]
        complaint = random.choice(all_templates).format(product_name=full_product)

    elif scenario_type == "MULTI_PRODUCT_BATCH":
        cat = category or random.choice(list(ComplaintCategory))
        templates = templates_dict.get(cat, templates_dict[ComplaintCategory.OTHER])
        complaint = random.choice(templates).format(product_name=full_product)

    else:
        # RANDOM
        cat = category or random.choice(list(ComplaintCategory))
        templates = templates_dict.get(cat, templates_dict[ComplaintCategory.OTHER])
        complaint = random.choice(templates).format(product_name=full_product)

    severity = _determine_severity(cat, case_type, brand)

    # Populate pharmaceutical compliance fields
    is_injectable = brand in INJECTABLE_BRANDS
    is_adverse = case_type == CaseType.ADVERSE_EVENT or cat == ComplaintCategory.SAFETY
    is_critical = severity in (CaseSeverity.CRITICAL, CaseSeverity.HIGH)

    reporter_type = (
        ReporterType.HCP if is_injectable
        else _weighted_choice([
            (ReporterType.CONSUMER, 60),
            (ReporterType.HCP, 15),
            (ReporterType.SALES_REP, 15),
            (ReporterType.DISTRIBUTOR, 10),
        ])
    )
    received_channel = _weighted_choice(CHANNEL_WEIGHTS)
    now = datetime.utcnow()
    received_offset = random.randint(0, 3)  # 0-3 days before system entry
    received_date = now - timedelta(days=received_offset)
    expiry_months = random.randint(3, 18)
    expiry_date = (now + timedelta(days=expiry_months * 30)).strftime("%Y-%m-%d")
    sla_days = SLA_DAYS.get(severity, 10)
    sla_due = (now + timedelta(days=sla_days)).strftime("%Y-%m-%d")

    regulatory_class = RegulatoryClassification.NONE
    if is_adverse and is_critical:
        regulatory_class = RegulatoryClassification.SERIOUS_AE
    elif is_adverse:
        regulatory_class = RegulatoryClassification.MIR
    elif is_critical:
        regulatory_class = RegulatoryClassification.FIELD_ALERT

    return (
        CaseCreate(
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
            # New pharmaceutical fields
            reporter_type=reporter_type,
            reporter_country=COUNTRY_BY_LANG.get(lang, "Brasil"),
            received_channel=received_channel,
            received_date=received_date,
            manufacturing_site=MANUFACTURING_SITES.get(brand, "Sophia Antipolis, France"),
            expiry_date=expiry_date,
            sample_available=random.random() < 0.35,
            adverse_event_flag=is_adverse,
            regulatory_reportable=is_adverse or is_critical,
            regulatory_classification=regulatory_class,
            investigation_status=_weighted_choice(INVESTIGATION_WEIGHTS),
            sla_due_date=sla_due,
        ),
        lang,
    )

// ============================================
// Galderma TrackWise AI Autopilot Demo
// PT-BR Translation Constants
// ============================================
//
// Single-language demo: all user-visible strings
// centralized here. No i18n framework needed.

import type { CaseStatus, CaseSeverity, ExecutionMode, AgentName } from '@/types'

// ============================================
// Navigation & Layout
// ============================================

export const sidebar = {
  brand: 'Galderma',
  subtitle: 'TrackWise AI',
  nav: {
    agentRoom: 'Sala de Agentes',
    cases: 'Casos',
    network: 'Rede',
    memory: 'Memória',
    ledger: 'Registro',
    csvPack: 'Pacote CSV',
  },
  live: 'Online',
  offline: 'Offline',
  collapse: 'Recolher',
  expandSidebar: 'Expandir barra lateral',
  collapseSidebar: 'Recolher barra lateral',
  openMenu: 'Abrir menu',
  toggleMenu: 'Alternar menu',
} as const

export const statusBar = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  modes: {
    OBSERVE: 'Observar',
    TRAIN: 'Treinar',
    ACT: 'Agir',
  } satisfies Record<ExecutionMode, string>,
} as const

export const commandPalette = {
  searchPlaceholder: 'Buscar páginas e ações...',
  noResults: 'Nenhum resultado encontrado.',
  pages: 'Páginas',
  actions: 'Ações',
  actionLabels: {
    resetDemo: 'Resetar Demo',
    createCase: 'Criar Caso',
    generateCsv: 'Gerar Pacote CSV',
  },
  toasts: {
    resetRequested: 'Solicitação de reset da demo',
    openingCreate: 'Abrindo criação de caso',
    openingCsv: 'Abrindo gerador de Pacote CSV',
  },
} as const

// ============================================
// Domain Components
// ============================================

export const statuses: Record<CaseStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  PENDING_REVIEW: 'Aguardando Revisão',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

export const severities: Record<CaseSeverity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const modes: Record<ExecutionMode, string> = {
  OBSERVE: 'Observar',
  TRAIN: 'Treinar',
  ACT: 'Agir',
}

export const timeAgo = {
  secondsAgo: (n: number) => `${n}s atrás`,
  minutesAgo: (n: number) => `${n}min atrás`,
  hoursAgo: (n: number) => `${n}h atrás`,
  daysAgo: (n: number) => `${n}d atrás`,
} as const

export const timeline = {
  casePrefix: 'Caso:',
} as const

// ============================================
// Agent Room Page
// ============================================

export const agentRoom = {
  title: 'Sala de Agentes',
  subtitle: 'Painel Executivo AI Autopilot',
  createBatch: 'Criar Lote',
  creating: 'Criando...',
  createScenario: 'Cenário Galderma',
  creatingScenario: 'Criando...',
  resetDemo: 'Resetar Demo',
  resetting: 'Resetando...',
  metrics: {
    aiClosed: 'Fechados por IA',
    aiClosedSublabel: (total: string) => `de ${total} no total`,
    hoursSaved: 'Horas Economizadas',
    hoursSavedSublabel: 'vs processamento manual',
    risksAvoided: 'Riscos Evitados',
    risksAvoidedSublabel: 'escalações prevenidas',
  },
  counters: {
    total: 'Total:',
    open: 'Abertos:',
    inProgress: 'Em Andamento:',
    closed: 'Fechados:',
  },
  activityTimeline: 'Timeline de Atividade',
  allAgents: 'Todos os Agentes',
  filterByAgent: 'Filtrar por agente',
  noActivityTitle: 'Nenhuma atividade ainda',
  noActivityDescription: 'Aguardando eventos dos agentes...',
  failedMetrics: 'Falha ao carregar métricas executivas',
  toasts: {
    batchSuccess: (count: number) => `${count} casos criados com sucesso`,
    batchEvents: (count: number) => `${count} eventos emitidos`,
    batchError: 'Falha ao criar lote',
    resetSuccess: 'Demo resetada com sucesso',
    resetCleared: (cases: number, events: number) =>
      `${cases} casos e ${events} eventos removidos`,
    resetError: 'Falha ao resetar demo',
    scenarioSuccess: (count: number) => `Cenário Galderma criado: ${count} casos`,
    scenarioDescription: '3 recorrentes + 1 não-recorrente + 1 par vinculado',
    scenarioError: 'Falha ao criar cenário Galderma',
  },
} as const

// ============================================
// Cases Page
// ============================================

export const cases = {
  title: 'Casos',
  newCase: 'Novo Caso',
  filters: {
    allStatuses: 'Todos os Status',
    allSeverities: 'Todas as Severidades',
    filterByStatus: 'Filtrar por status',
    filterBySeverity: 'Filtrar por severidade',
    open: 'Aberto',
    inProgress: 'Em Andamento',
    pendingReview: 'Aguardando Revisão',
    resolved: 'Resolvido',
    closed: 'Fechado',
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  },
  table: {
    caseId: 'ID do Caso',
    product: 'Produto',
    status: 'Status',
    severity: 'Severidade',
    type: 'Tipo',
    created: 'Criado em',
  },
  empty: {
    title: 'Nenhum caso encontrado',
    description: 'Ajuste os filtros ou crie um novo caso',
    createCase: 'Criar Caso',
  },
} as const

// ============================================
// Case Detail Page
// ============================================

export const caseDetail = {
  notFound: 'Caso não encontrado',
  backToCases: 'Casos',
  labels: {
    caseId: 'ID do Caso',
    status: 'Status',
    severity: 'Severidade',
    productBrand: 'Marca do Produto',
    productName: 'Nome do Produto',
    lotNumber: 'Número do Lote',
    type: 'Tipo',
    category: 'Categoria',
    customer: 'Cliente',
    created: 'Criado em',
  },
  complaint: 'Reclamação',
  resolution: 'Resolução',
  linkedCase: 'Caso Vinculado',
  processingTimeline: 'Timeline de Processamento',
  openAuditor: 'Abrir Auditor',
  reasoning: 'Raciocínio',
  noProcessingSteps: 'Nenhuma etapa de processamento disponível',
  auditTrail: 'Trilha de Auditoria',
  confidence: 'Confiança:',
  noAuditTrail: 'Nenhuma trilha de auditoria disponível',
  languages: {
    AUTO: 'Auto',
    EN: 'English',
    PT: 'Português',
    ES: 'Español',
    FR: 'Français',
  },
} as const

// ============================================
// Network Page
// ============================================

export const network = {
  title: 'Rede',
  subtitle: 'Arquitetura mesh de agentes - 9 agentes conectados via protocolo A2A',
} as const

// ============================================
// Memory Page
// ============================================

export const memory = {
  title: 'Memória',
  subtitle: 'Navegador de Memória dos Agentes - Padrões, Templates e Políticas',
  tabs: {
    patterns: 'Padrões Recorrentes',
    templates: 'Templates de Resolução',
    policies: 'Base de Políticas',
  },
  patterns: {
    title: 'Padrões Recorrentes',
    description: 'Padrões detectados pelo Curador de Memória nos casos processados',
    headers: {
      patternId: 'ID do Padrão',
      name: 'Nome',
      description: 'Descrição',
      confidence: 'Confiança',
      occurrences: 'Ocorrências',
      status: 'Status',
    },
  },
  templates: {
    title: 'Templates de Resolução',
    description: 'Templates multilíngues aprendidos a partir de resoluções bem-sucedidas',
    headers: {
      templateId: 'ID do Template',
      name: 'Nome',
      language: 'Idioma',
      confidence: 'Confiança',
      uses: 'Usos',
      status: 'Status',
    },
  },
  policies: {
    title: 'Base de Políticas',
    description: 'Políticas de conformidade aplicadas pelo Guardião de Conformidade',
    headers: {
      policyId: 'ID da Política',
      name: 'Nome',
      category: 'Categoria',
      description: 'Descrição',
      evaluations: 'Avaliações',
      violations: 'Violações',
      status: 'Status',
    },
  },
  emptyTitle: 'Nenhum padrão aprendido',
  emptyDescription: 'Os agentes ainda não processaram casos suficientes para formar memória. Crie o Cenário Galderma para ver padrões emergirem.',
} as const

// ============================================
// Ledger Page
// ============================================

export const ledger = {
  title: 'Registro',
  subtitle: 'Trilha de Auditoria de Decisões - Log imutável de todas as ações dos agentes',
  exportJson: 'Exportar JSON',
  agentFilter: 'Agente:',
  allAgents: 'Todos os Agentes',
  table: {
    timestamp: 'Data/Hora',
    agent: 'Agente',
    action: 'Ação',
    decision: 'Decisão',
    confidence: 'Confiança',
    caseId: 'ID do Caso',
    hash: 'Hash',
  },
  empty: {
    title: 'Nenhuma entrada no registro',
    description: 'Comece a processar casos para ver a trilha de auditoria',
  },
  toasts: {
    exportEmpty: 'Nenhuma entrada no registro para exportar',
    exportSuccess: 'Registro exportado com sucesso',
  },
} as const

// ============================================
// CSV Pack Page
// ============================================

export const csvPack = {
  title: 'Pacote CSV',
  subtitle: 'Validação de Sistema Computadorizado — Pronto para auditoria externa (21 CFR Parte 11)',
  generatePack: 'Gerar Pacote',
  generating: 'Gerando...',
  packGenerated: 'Pacote CSV Gerado',
  readyForAudit: 'Documentação de conformidade pronta para auditoria externa',
  auditReady: 'Pronto para Auditoria Externa',
  summary: {
    packId: 'ID do Pacote',
    generatedAt: 'Gerado em',
    casesAnalyzed: 'Casos Analisados',
    complianceStandard: 'Norma de Conformidade',
    closedCases: 'Casos Fechados',
    totalLedgerEntries: 'Total de Entradas no Registro',
  },
  complianceArtifacts: 'Artefatos de Conformidade',
  download: 'Baixar',
  artifactId: 'ID do Artefato',
  type: 'Tipo',
  empty: {
    title: 'Nenhum Pacote CSV gerado ainda',
    description:
      'Clique em \'Gerar Pacote\' para criar documentação de conformidade para todos os casos processados',
  },
  toasts: {
    success: 'Pacote CSV gerado com sucesso',
    error: 'Falha ao gerar Pacote CSV',
    downloaded: (title: string) => `${title} baixado`,
  },
  // Download content (PT-BR)
  downloadContent: {
    validation: (title: string, description: string, artifactId: string, status: string) =>
      `=== ${title} ===\n\n${description}\n\nGerado em: ${new Date().toISOString()}\nID do Artefato: ${artifactId}\n\nStatus da Validação: ${status}\n\n--- Conteúdo ---\nEste é um artefato de Validação de Sistema Computadorizado (CSV) gerado pelo sistema TrackWise AI Autopilot.\n\nConformidade 21 CFR Parte 11:\n- Assinaturas eletrônicas validadas\n- Integridade da trilha de auditoria verificada\n- Controles de acesso ao sistema aplicados\n- Integridade dos dados confirmada\n\nTodas as decisões dos agentes foram registradas no registro imutável com encadeamento de hash criptográfico.`,
    report: (title: string, description: string, artifactId: string, status: string) =>
      `=== ${title} ===\n\n${description}\n\nGerado em: ${new Date().toISOString()}\nID do Artefato: ${artifactId}\n\nStatus: ${status}\n\n--- Resumo ---\nEste relatório de conformidade documenta todas as decisões orientadas por IA e aprovações humanas para os casos analisados.\n\nPrincipais Constatações:\n- Todas as decisões críticas revisadas pelo Guardião de Conformidade (Claude Opus)\n- Confirmações humanas no loop registradas\n- Violações de políticas sinalizadas e resolvidas\n- Qualidade da resolução atende aos padrões regulatórios`,
    generic: (title: string, description: string, artifactId: string, status: string) =>
      `=== ${title} ===\n\n${description}\n\nGerado em: ${new Date().toISOString()}\nID do Artefato: ${artifactId}\n\nStatus: ${status}\n\n--- Conteúdo ---\nEste artefato faz parte do pacote de Validação de Sistema Computadorizado (CSV) do TrackWise AI Autopilot.\n\nNorma de Conformidade: 21 CFR Parte 11\nSistema: TrackWise AI Autopilot Demo\nVersão: 1.0.0\n\nTodos os dados neste artefato foram validados e verificados pelo pipeline de conformidade.`,
  },
  extensibility: {
    title: 'Roadmap de Extensibilidade',
    description: 'Funcionalidades planejadas para próximas versões do AI Autopilot',
    items: [
      {
        name: 'Classificação de Procedência (Procedente/Não Procedente)',
        description: 'Classificação automática via agente especializado com aprendizado contínuo',
        status: 'PLANEJADO',
      },
      {
        name: 'Integração EDMS D2 — Gap Analysis Documental',
        description: 'Conexão direta ao sistema EDMS para análise de lacunas documentais',
        status: 'PLANEJADO',
      },
      {
        name: 'Suporte Francês (Canadá) Completo',
        description: 'Variante fr-CA com terminologia regulatória canadense',
        status: 'EM DESENVOLVIMENTO',
      },
    ],
  },
} as const

// ============================================
// Create Case Modal
// ============================================

export const createCase = {
  title: 'Criar Novo Caso',
  description: 'Insira os detalhes da nova reclamação ou consulta.',
  fields: {
    customerName: 'Nome do Cliente',
    productBrand: 'Marca do Produto',
    productName: 'Nome do Produto',
    complaintText: 'Reclamação / Consulta',
    caseType: 'Tipo do Caso',
    category: 'Categoria',
    lotNumber: 'Número do Lote',
  },
  placeholders: {
    customerName: 'João da Silva',
    selectBrand: 'Selecione uma marca',
    productName: 'Gel de Limpeza Facial Diário',
    complaintText: 'Descreva a reclamação ou consulta em detalhes...',
    selectCategory: 'Selecione uma categoria',
    lotNumber: 'LOT-12345',
  },
  caseTypes: {
    COMPLAINT: 'Reclamação',
    INQUIRY: 'Consulta',
    ADVERSE_EVENT: 'Evento Adverso',
  },
  categories: {
    PACKAGING: 'Embalagem',
    QUALITY: 'Qualidade',
    EFFICACY: 'Eficácia',
    SAFETY: 'Segurança',
    DOCUMENTATION: 'Documentação',
    SHIPPING: 'Transporte',
    OTHER: 'Outros',
  },
  cancel: 'Cancelar',
  submit: 'Criar Caso',
  submitting: 'Criando...',
  toasts: {
    fillRequired: 'Por favor, preencha todos os campos obrigatórios',
    success: 'Caso criado com sucesso',
    error: 'Falha ao criar caso',
  },
} as const

// ============================================
// Auditor View
// ============================================

export const auditorView = {
  title: 'Visão do Auditor',
  subtitle: 'Trilha de auditoria de conformidade e verificação de cadeia de custódia',
  integrity: {
    chainValid: 'Cadeia Válida',
    unverified: 'Não Verificada',
    firstHash: 'Primeiro hash:',
    lastHash: 'Último hash:',
    missingHashes: 'Algumas entradas estão sem hashes criptográficos',
  },
  policySummary: 'Resumo de Políticas',
  evaluated: 'Avaliadas',
  passed: 'Aprovadas',
  violated: 'Violadas',
  violations: 'Violações:',
  criticalDecisions: 'Decisões Críticas',
  confidence: 'Confiança',
  stateChanges: 'Mudanças de Estado',
  stateTable: {
    field: 'Campo',
    before: 'Antes',
    after: 'Depois',
  },
  modelStats: {
    model: 'Modelo',
    totalTokens: 'Total de Tokens',
    totalLatency: 'Latência Total',
  },
  noAuditTrail: 'Nenhuma trilha de auditoria disponível',
} as const

// ============================================
// Agent Names & Descriptions (PT-BR)
// ============================================

export const agentTranslations: Record<
  AgentName,
  { displayName: string; description: string }
> = {
  observer: {
    displayName: 'Observador',
    description: 'Orquestrador - valida eventos, direciona para especialistas',
  },
  case_understanding: {
    displayName: 'Compreensão de Caso',
    description: 'Classificador - extrai produto, categoria, severidade',
  },
  recurring_detector: {
    displayName: 'Detector de Recorrência',
    description: 'Correlacionador - consulta memória, calcula similaridade',
  },
  compliance_guardian: {
    displayName: 'Guardião de Conformidade',
    description: 'Gatekeeper - valida 5 políticas de conformidade',
  },
  resolution_composer: {
    displayName: 'Compositor de Resolução',
    description: 'Escritor - gera resoluções multilíngues',
  },
  inquiry_bridge: {
    displayName: 'Ponte de Consultas',
    description: 'Coordenador - gerencia casos vinculados',
  },
  writeback: {
    displayName: 'Writeback',
    description: 'Executor - grava no sistema TrackWise',
  },
  memory_curator: {
    displayName: 'Curador de Memória',
    description: 'Aprendiz - processa feedback, atualiza padrões',
  },
  csv_pack: {
    displayName: 'Pacote CSV',
    description: 'Documentador - gera documentação de conformidade',
  },
}

// ============================================
// Language Labels
// ============================================

export const languageLabels = {
  AUTO: 'Auto',
  PT: 'Português',
  EN: 'English',
  ES: 'Español',
  FR: 'Français',
} as const

// ============================================
// Date Locale
// ============================================

export const DATE_LOCALE = 'pt-BR'

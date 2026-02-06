import type { AgentName, TimelineEventType } from '@/types'

export interface ShellAction {
  id: string
  label: string
  variant?: 'default' | 'secondary' | 'destructive'
}

export interface ShellRouteMeta {
  title: string
  subtitle: string
  actions?: ShellAction[]
  showGlobalRail: boolean
}

const ROUTE_META: Array<{ matcher: RegExp; meta: ShellRouteMeta }> = [
  {
    matcher: /^\/sac$/,
    meta: {
      title: 'SAC / Atendimento',
      subtitle: 'Simulador de reclamações',
      showGlobalRail: false,
    },
  },
  {
    matcher: /^\/agent-room$/,
    meta: {
      title: 'Sala de Agentes',
      subtitle: 'Painel executivo com operações em tempo real',
      showGlobalRail: true,
    },
  },
  {
    matcher: /^\/cases$/,
    meta: {
      title: 'Casos',
      subtitle: 'Triagem, status e andamento operacional',
      showGlobalRail: false,
    },
  },
  {
    matcher: /^\/cases\//,
    meta: {
      title: 'Detalhe do Caso',
      subtitle: 'Resumo da execução, trilha e resolução',
      showGlobalRail: false,
    },
  },
  {
    matcher: /^\/network$/,
    meta: {
      title: 'Rede',
      subtitle: 'Topologia A2A e fluxo entre agentes',
      showGlobalRail: false,
    },
  },
  {
    matcher: /^\/memory$/,
    meta: {
      title: 'Memória',
      subtitle: 'Padrões, templates e políticas ativas',
      showGlobalRail: false,
    },
  },
  {
    matcher: /^\/ledger$/,
    meta: {
      title: 'Registro',
      subtitle: 'Trilha auditável das decisões de agentes',
      showGlobalRail: false,
    },
  },
  {
    matcher: /^\/csv-pack$/,
    meta: {
      title: 'Pacote CSV',
      subtitle: 'Artefatos de conformidade e validação',
      showGlobalRail: false,
    },
  },
]

const DEFAULT_META: ShellRouteMeta = {
  title: 'TrackWise AI',
  subtitle: 'Plataforma de execução assistida por agentes',
  showGlobalRail: false,
}

export function getShellRouteMeta(pathname: string): ShellRouteMeta {
  const match = ROUTE_META.find((route) => route.matcher.test(pathname))
  return match?.meta ?? DEFAULT_META
}

export interface GlobalKpiDeckProps {
  aiClosedCount: number
  humanHoursSaved: number
  risksAvoided: number
  totalCases: number
  loading: boolean
}

export interface LiveStripEvent {
  id: string
  message: string
  timestamp: string
  caseId?: string
  type: TimelineEventType
  agent?: AgentName
}

export interface GlobalLiveStripProps {
  events: LiveStripEvent[]
  isConnected: boolean
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// TypeScript Type Definitions
// ============================================

import { agentTranslations } from '@/i18n'

// ============================================
// Enums
// ============================================
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'RESOLVED' | 'CLOSED'
export type CaseSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type CaseType = 'COMPLAINT' | 'INQUIRY' | 'ADVERSE_EVENT'
export type ComplaintCategory = 'PACKAGING' | 'QUALITY' | 'EFFICACY' | 'SAFETY' | 'DOCUMENTATION' | 'SHIPPING' | 'OTHER'
export type ReporterType = 'CONSUMER' | 'HCP' | 'SALES_REP' | 'DISTRIBUTOR'
export type ReceivedChannel = 'PHONE' | 'EMAIL' | 'WEB' | 'SOCIAL_MEDIA' | 'IN_PERSON'
export type RegulatoryClassification = 'NONE' | 'MDR' | 'MIR' | 'FIELD_ALERT' | 'SERIOUS_AE'
export type InvestigationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_REQUIRED'
export type ExecutionMode = 'OBSERVE' | 'TRAIN' | 'ACT'
export type Language = 'AUTO' | 'PT' | 'EN' | 'ES' | 'FR'

// ============================================
// Case Types
// ============================================
export interface Case {
  case_id: string
  product_brand: string
  product_name: string
  complaint_text: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  case_type: CaseType
  category?: ComplaintCategory
  lot_number?: string
  linked_case_id?: string
  status: CaseStatus
  severity: CaseSeverity
  // Reporter & intake
  reporter_type?: ReporterType
  reporter_country?: string
  received_channel?: ReceivedChannel
  received_date?: string
  // Product traceability
  manufacturing_site?: string
  expiry_date?: string
  sample_available?: boolean
  // Compliance & regulatory
  adverse_event_flag?: boolean
  regulatory_reportable?: boolean
  regulatory_classification?: RegulatoryClassification
  // Investigation
  investigation_status?: InvestigationStatus
  root_cause?: string
  capa_reference?: string
  assigned_investigator?: string
  sla_due_date?: string
  // Resolution
  resolution_text?: string
  resolution_text_pt?: string
  resolution_text_en?: string
  resolution_text_es?: string
  resolution_text_fr?: string
  // AI processing
  ai_recommendation?: string
  ai_confidence?: number
  guardian_approved?: boolean
  processed_by_agent?: string
  run_id?: string
  // Metadata
  created_at: string
  updated_at: string
  closed_at?: string
}

export interface CaseCreate {
  product_brand: string
  product_name: string
  complaint_text: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  case_type?: CaseType
  category?: ComplaintCategory
  lot_number?: string
  linked_case_id?: string
}

export interface CaseUpdate {
  status?: CaseStatus
  severity?: CaseSeverity
  category?: ComplaintCategory
  resolution_text?: string
  ai_recommendation?: string
  ai_confidence?: number
  guardian_approved?: boolean
}

export interface CaseListResponse {
  total: number
  cases: Case[]
  page: number
  page_size: number
}

// ============================================
// Event Types
// ============================================
export type EventType =
  | 'CaseCreated'
  | 'CaseUpdated'
  | 'CaseClosed'
  | 'FactoryComplaintClosed'
  | 'BatchCreated'

export interface EventEnvelope {
  event_id: string
  event_type: EventType
  timestamp: string
  source: string
  payload: Record<string, unknown>
}

// ============================================
// Timeline Event Types
// ============================================
export type TimelineEventType =
  | 'run_started'
  | 'run_completed'
  | 'run_failed'
  | 'agent_invoked'
  | 'agent_completed'
  | 'agent_error'
  | 'tool_called'
  | 'tool_result'
  | 'case_created'
  | 'case_updated'
  | 'case_closed'
  | 'memory_query'
  | 'memory_write'
  | 'pattern_matched'
  | 'human_review_requested'
  | 'human_feedback_received'
  | 'system_message'
  | 'error'

export interface TimelineEvent {
  type: TimelineEventType
  timestamp: string
  run_id?: string
  case_id?: string
  agent?: string
  message?: string
  data?: Record<string, unknown>
}

// ============================================
// Agent Types
// ============================================
export type AgentName =
  | 'observer'
  | 'case_understanding'
  | 'recurring_detector'
  | 'compliance_guardian'
  | 'resolution_composer'
  | 'inquiry_bridge'
  | 'writeback'
  | 'memory_curator'
  | 'csv_pack'

export interface AgentInfo {
  name: AgentName
  displayName: string
  description: string
  model: 'OPUS' | 'HAIKU'
  color: string
}

export const AGENTS: Record<AgentName, AgentInfo> = {
  observer: {
    name: 'observer',
    displayName: agentTranslations.observer.displayName,
    description: agentTranslations.observer.description,
    model: 'HAIKU',
    color: '#8B5CF6',
  },
  case_understanding: {
    name: 'case_understanding',
    displayName: agentTranslations.case_understanding.displayName,
    description: agentTranslations.case_understanding.description,
    model: 'HAIKU',
    color: '#4A98B8',
  },
  recurring_detector: {
    name: 'recurring_detector',
    displayName: agentTranslations.recurring_detector.displayName,
    description: agentTranslations.recurring_detector.description,
    model: 'HAIKU',
    color: '#3C7356',
  },
  compliance_guardian: {
    name: 'compliance_guardian',
    displayName: agentTranslations.compliance_guardian.displayName,
    description: agentTranslations.compliance_guardian.description,
    model: 'OPUS',
    color: '#EF4444',
  },
  resolution_composer: {
    name: 'resolution_composer',
    displayName: agentTranslations.resolution_composer.displayName,
    description: agentTranslations.resolution_composer.description,
    model: 'OPUS',
    color: '#F59E0B',
  },
  inquiry_bridge: {
    name: 'inquiry_bridge',
    displayName: agentTranslations.inquiry_bridge.displayName,
    description: agentTranslations.inquiry_bridge.description,
    model: 'HAIKU',
    color: '#EC4899',
  },
  writeback: {
    name: 'writeback',
    displayName: agentTranslations.writeback.displayName,
    description: agentTranslations.writeback.description,
    model: 'HAIKU',
    color: '#84CC16',
  },
  memory_curator: {
    name: 'memory_curator',
    displayName: agentTranslations.memory_curator.displayName,
    description: agentTranslations.memory_curator.description,
    model: 'HAIKU',
    color: '#3860BE',
  },
  csv_pack: {
    name: 'csv_pack',
    displayName: agentTranslations.csv_pack.displayName,
    description: agentTranslations.csv_pack.description,
    model: 'HAIKU',
    color: '#6AAAE4',
  },
}

// ============================================
// Run Types
// ============================================
export type StepType =
  | 'OBSERVE'
  | 'THINK'
  | 'LEARN'
  | 'ACT'
  | 'TOOL_CALL'
  | 'A2A_CALL'
  | 'HUMAN_REVIEW'
  | 'ERROR'

export interface AgentStep {
  step_number: number
  agent_name: AgentName
  step_type: StepType
  input_summary?: string
  output_summary?: string
  reasoning?: string
  tools_called?: string[]
  started_at: string
  completed_at?: string
  duration_ms?: number
  tokens_used?: number
  model_id?: string
}

export interface Run {
  run_id: string
  case_id: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING_REVIEW'
  mode: ExecutionMode
  trigger: EventType
  started_at: string
  completed_at?: string
  duration_ms?: number
  agents_invoked: AgentName[]
  agent_steps?: AgentStep[]
  result?: string
  error?: string
}

// ============================================
// Memory Types
// ============================================
export type MemoryStrategy = 'RecurringPatterns' | 'ResolutionTemplates' | 'PolicyKnowledge'

export interface MemoryEntry {
  pattern_id: string
  strategy: MemoryStrategy
  content: Record<string, unknown>
  confidence_score: number
  status: 'NEW' | 'PENDING' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED'
  created_at: string
  updated_at: string
  version: number
}

// ============================================
// Ledger Types
// ============================================
export type LedgerAction =
  | 'CASE_ANALYZED'
  | 'PATTERN_MATCHED'
  | 'PATTERN_CREATED'
  | 'COMPLIANCE_CHECKED'
  | 'RESOLUTION_GENERATED'
  | 'WRITEBACK_EXECUTED'
  | 'HUMAN_REVIEW_REQUESTED'
  | 'HUMAN_APPROVED'
  | 'HUMAN_REJECTED'
  | 'MEMORY_UPDATED'
  | 'CASE_ESCALATED'
  | 'ERROR_OCCURRED'

export interface StateChange {
  field: string
  before: string | null
  after: string | null
}

export interface LedgerEntry {
  ledger_id: string
  run_id: string
  case_id: string
  agent_name: AgentName
  action: LedgerAction
  action_description?: string
  timestamp: string
  reasoning?: string
  decision?: string
  confidence?: number
  state_changes?: StateChange[]
  policies_evaluated?: string[]
  policy_violations?: string[]
  model_id?: string
  tokens_used?: number
  latency_ms?: number
  memory_strategy?: MemoryStrategy
  memory_pattern_id?: string
  requires_human_action?: boolean
  human_actor?: string
  human_action_taken?: string
  error_type?: string
  error_message?: string
  entry_hash?: string
  previous_hash?: string
}

// ============================================
// Batch Types
// ============================================
export interface BatchCreate {
  count: number
  include_recurring: boolean
  include_adverse_events: boolean
  include_linked_inquiries: boolean
}

export interface BatchResult {
  created_count: number
  case_ids: string[]
  events_emitted: number
}

// ============================================
// Statistics
// ============================================
export interface Statistics {
  total_cases: number
  open_cases: number
  in_progress_cases: number
  closed_cases: number
  complaints: number
  inquiries: number
  adverse_events: number
  low_severity: number
  medium_severity: number
  high_severity: number
  critical_severity: number
  total_events: number
}

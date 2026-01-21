// ============================================
// Galderma TrackWise AI Autopilot Demo
// TypeScript Type Definitions
// ============================================

// ============================================
// Enums
// ============================================
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'RESOLVED' | 'CLOSED'
export type CaseSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type CaseType = 'COMPLAINT' | 'INQUIRY' | 'ADVERSE_EVENT'
export type ComplaintCategory = 'PACKAGING' | 'QUALITY' | 'EFFICACY' | 'SAFETY' | 'DOCUMENTATION' | 'SHIPPING' | 'OTHER'
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
  resolution_text?: string
  resolution_text_pt?: string
  resolution_text_en?: string
  resolution_text_es?: string
  resolution_text_fr?: string
  ai_recommendation?: string
  ai_confidence?: number
  guardian_approved?: boolean
  processed_by_agent?: string
  run_id?: string
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
    displayName: 'Observer',
    description: 'Orchestrator - validates events, routes to specialists',
    model: 'HAIKU',
    color: '#8B5CF6',
  },
  case_understanding: {
    name: 'case_understanding',
    displayName: 'Case Understanding',
    description: 'Classifier - extracts product, category, severity',
    model: 'HAIKU',
    color: '#06B6D4',
  },
  recurring_detector: {
    name: 'recurring_detector',
    displayName: 'Recurring Detector',
    description: 'Pattern Matcher - queries memory, calculates similarity',
    model: 'HAIKU',
    color: '#10B981',
  },
  compliance_guardian: {
    name: 'compliance_guardian',
    displayName: 'Compliance Guardian',
    description: 'Gatekeeper - validates 5 compliance policies',
    model: 'OPUS',
    color: '#EF4444',
  },
  resolution_composer: {
    name: 'resolution_composer',
    displayName: 'Resolution Composer',
    description: 'Writer - generates multilingual resolutions',
    model: 'OPUS',
    color: '#F59E0B',
  },
  inquiry_bridge: {
    name: 'inquiry_bridge',
    displayName: 'Inquiry Bridge',
    description: 'Coordinator - handles linked cases',
    model: 'HAIKU',
    color: '#EC4899',
  },
  writeback: {
    name: 'writeback',
    displayName: 'Writeback',
    description: 'Executor - writes to TrackWise system',
    model: 'HAIKU',
    color: '#84CC16',
  },
  memory_curator: {
    name: 'memory_curator',
    displayName: 'Memory Curator',
    description: 'Learner - processes feedback, updates patterns',
    model: 'HAIKU',
    color: '#6366F1',
  },
  csv_pack: {
    name: 'csv_pack',
    displayName: 'CSV Pack',
    description: 'Documenter - generates compliance documentation',
    model: 'HAIKU',
    color: '#14B8A6',
  },
}

// ============================================
// Run Types
// ============================================
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
export interface LedgerEntry {
  ledger_id: string
  run_id: string
  case_id: string
  agent: AgentName
  action: string
  input_hash: string
  output_hash: string
  timestamp: string
  metadata?: Record<string, unknown>
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

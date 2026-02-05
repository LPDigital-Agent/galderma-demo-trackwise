// ============================================
// Galderma TrackWise AI Autopilot Demo
// API Client
// ============================================

import axios from 'axios'

import type {
  AgentName,
  BatchCreate,
  BatchResult,
  Case,
  CaseCreate,
  CaseListResponse,
  CaseSeverity,
  CaseStatus,
  CaseType,
  CaseUpdate,
  EventEnvelope,
  LedgerEntry,
  Run,
  Statistics,
} from '@/types'

// Get API base URL from environment or use relative path
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================
// Cases API
// ============================================
export async function getCases(params?: {
  status?: CaseStatus
  severity?: CaseSeverity
  case_type?: CaseType
  page?: number
  page_size?: number
}): Promise<CaseListResponse> {
  const response = await api.get<CaseListResponse>('/cases', { params })
  return response.data
}

export async function getCase(caseId: string): Promise<Case> {
  const response = await api.get<Case>(`/cases/${caseId}`)
  return response.data
}

export async function createCase(data: CaseCreate): Promise<Case> {
  const response = await api.post<Case>('/cases', data)
  return response.data
}

export async function updateCase(caseId: string, data: CaseUpdate): Promise<Case> {
  const response = await api.patch<Case>(`/cases/${caseId}`, data)
  return response.data
}

export async function closeCase(
  caseId: string,
  params: {
    resolution_text: string
    resolution_text_pt?: string
    resolution_text_en?: string
    resolution_text_es?: string
    resolution_text_fr?: string
    processed_by_agent?: string
  }
): Promise<Case> {
  const response = await api.post<Case>(`/cases/${caseId}/close`, null, { params })
  return response.data
}

export async function deleteCase(caseId: string): Promise<void> {
  await api.delete(`/cases/${caseId}`)
}

// ============================================
// Runs API
// ============================================
export async function getRuns(params?: {
  case_id?: string
  status?: string
}): Promise<Run[]> {
  const response = await api.get<Run[]>('/runs', { params })
  return response.data
}

export async function getRun(runId: string): Promise<Run> {
  const response = await api.get<Run>(`/runs/${runId}`)
  return response.data
}

// ============================================
// Ledger API
// ============================================
export async function getLedgerEntries(params?: {
  case_id?: string
  run_id?: string
  agent_name?: AgentName
  limit?: number
}): Promise<LedgerEntry[]> {
  const response = await api.get<LedgerEntry[]>('/ledger', { params })
  return response.data
}

// ============================================
// Events API
// ============================================
export async function getEvents(params?: {
  limit?: number
  event_type?: string
}): Promise<EventEnvelope[]> {
  const response = await api.get<EventEnvelope[]>('/events', { params })
  return response.data
}

// ============================================
// Batch API
// ============================================
export async function createBatch(data: BatchCreate): Promise<BatchResult> {
  const response = await api.post<BatchResult>('/batch', data)
  return response.data
}

// ============================================
// Statistics API
// ============================================
export async function getStats(): Promise<Statistics> {
  const response = await api.get<Statistics>('/stats')
  return response.data
}

export interface ExecutiveStats {
  ai_closed_count: number
  human_hours_saved: number
  risks_avoided: number
  total_cases: number
  open_cases: number
  closed_cases: number
}

export async function getExecutiveStats(): Promise<ExecutiveStats> {
  const response = await api.get<ExecutiveStats>('/stats/executive')
  return response.data
}

// ============================================
// CSV Pack API
// ============================================
export interface CSVPackArtifact {
  artifact_id: string
  artifact_type: string
  title: string
  description: string
  status: string
  [key: string]: unknown
}

export interface CSVPackResult {
  pack_id: string
  generated_at: string
  total_cases_analyzed: number
  closed_cases: number
  total_ledger_entries: number
  artifacts: CSVPackArtifact[]
  compliance_standard: string
  status: string
}

export async function generateCSVPack(): Promise<CSVPackResult> {
  const response = await api.post<CSVPackResult>('/csv-pack')
  return response.data
}

// ============================================
// Reset API
// ============================================
export async function resetDemo(): Promise<{ cases_cleared: number; events_cleared: number }> {
  const response = await api.post<{ cases_cleared: number; events_cleared: number }>('/reset')
  return response.data
}

export default api

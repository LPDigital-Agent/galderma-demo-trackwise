// ============================================
// Galderma TrackWise AI Autopilot Demo
// API Client
// ============================================

import axios from 'axios'

import type {
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
  Statistics,
} from '@/types'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
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

// ============================================
// Reset API
// ============================================
export async function resetDemo(): Promise<{ cases_cleared: number; events_cleared: number }> {
  const response = await api.post<{ cases_cleared: number; events_cleared: number }>('/reset')
  return response.data
}

export default api

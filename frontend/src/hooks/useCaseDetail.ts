// ============================================
// Galderma TrackWise AI Autopilot Demo
// Case Detail Hooks - Runs & Ledger
// ============================================

import { useQuery } from '@tanstack/react-query'

import * as api from '@/api/client'

// Query keys
export const runKeys = {
  all: ['runs'] as const,
  byCase: (caseId: string) => [...runKeys.all, 'case', caseId] as const,
  detail: (runId: string) => [...runKeys.all, 'detail', runId] as const,
}

export const ledgerKeys = {
  all: ['ledger'] as const,
  byCase: (caseId: string) => [...ledgerKeys.all, 'case', caseId] as const,
  byRun: (runId: string) => [...ledgerKeys.all, 'run', runId] as const,
  byAgent: (agentName: string) => [...ledgerKeys.all, 'agent', agentName] as const,
}

// Get runs for a specific case
export function useCaseRuns(caseId: string) {
  return useQuery({
    queryKey: runKeys.byCase(caseId),
    queryFn: () => api.getRuns({ case_id: caseId }),
    enabled: !!caseId,
  })
}

// Get a single run by ID
export function useRun(runId: string) {
  return useQuery({
    queryKey: runKeys.detail(runId),
    queryFn: () => api.getRun(runId),
    enabled: !!runId,
  })
}

// Get ledger entries for a specific case
export function useCaseLedger(caseId: string) {
  return useQuery({
    queryKey: ledgerKeys.byCase(caseId),
    queryFn: () => api.getLedgerEntries({ case_id: caseId }),
    enabled: !!caseId,
  })
}

// Get all ledger entries with optional filters
export function useLedger(params?: {
  agent_name?: string
  limit?: number
}) {
  return useQuery({
    queryKey: [...ledgerKeys.all, params],
    queryFn: () => api.getLedgerEntries(params as Parameters<typeof api.getLedgerEntries>[0]),
  })
}

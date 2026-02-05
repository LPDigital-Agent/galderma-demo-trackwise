// ============================================
// Galderma TrackWise AI Autopilot Demo
// Cases Hooks - TanStack Query
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as api from '@/api/client'
import type { CaseCreate, CaseSeverity, CaseStatus, CaseType, CaseUpdate } from '@/types'

// Query keys
export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...caseKeys.lists(), filters] as const,
  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
}

// Get cases list
export function useCases(params?: {
  status?: CaseStatus
  severity?: CaseSeverity
  case_type?: CaseType
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: caseKeys.list(params ?? {}),
    queryFn: () => api.getCases(params),
  })
}

// Get single case
export function useCase(caseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => api.getCase(caseId),
    enabled: (options?.enabled ?? true) && !!caseId,
  })
}

// Create case mutation
export function useCreateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CaseCreate) => api.createCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
    },
  })
}

// Update case mutation
export function useUpdateCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ caseId, data }: { caseId: string; data: CaseUpdate }) =>
      api.updateCase(caseId, data),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) })
    },
  })
}

// Close case mutation
export function useCloseCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      caseId,
      ...params
    }: {
      caseId: string
      resolution_text: string
      resolution_text_pt?: string
      resolution_text_en?: string
      resolution_text_es?: string
      resolution_text_fr?: string
      processed_by_agent?: string
    }) => api.closeCase(caseId, params),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) })
    },
  })
}

// Delete case mutation
export function useDeleteCase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (caseId: string) => api.deleteCase(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
    },
  })
}

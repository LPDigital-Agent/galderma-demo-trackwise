// ============================================
// Galderma TrackWise AI Autopilot Demo
// SAC Hooks - TanStack Query for SAC Generator
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import * as api from '@/api/client'
import { sac as t } from '@/i18n'
import { useSacStore } from '@/stores/sacStore'
import { caseKeys } from './useCases'

export const sacKeys = {
  all: ['sac'] as const,
  status: ['sac', 'status'] as const,
}

export function useSacGenerate() {
  const queryClient = useQueryClient()
  const { scenario, productBrand, batchCount, persistDynamo, addGeneratedCases } = useSacStore()

  return useMutation({
    mutationFn: async (mode: 'single' | 'batch') => {
      const count = mode === 'single' ? 1 : batchCount
      return api.sacGenerate({
        count,
        scenario_type: scenario,
        product_brand: productBrand,
        persist_dynamo: persistDynamo,
      })
    },
    onSuccess: (data) => {
      addGeneratedCases(data.cases)
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['executive-stats'] })
      if (data.generated_count === 1) {
        toast.success(t.toasts.singleSuccess)
      } else {
        toast.success(`${data.generated_count} ${t.toasts.batchSuccess}`)
      }
    },
    onError: () => {
      toast.error(t.toasts.error)
    },
  })
}

export function useSacStatus() {
  return useQuery({
    queryKey: sacKeys.status,
    queryFn: api.sacStatus,
    refetchInterval: 10000,
  })
}

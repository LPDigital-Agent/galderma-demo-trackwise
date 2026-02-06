// ============================================
// Galderma TrackWise AI Autopilot Demo
// Statistics Hooks
// ============================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as api from '@/api/client'
import type { BatchCreate } from '@/types'

// Query keys
export const statsKeys = {
  all: ['stats'] as const,
}

export const batchKeys = {
  all: ['batch'] as const,
}

export const memoryKeys = {
  all: ['memory'] as const,
}

// Get statistics
export function useStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: api.getStats,
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}

// Executive dashboard stats
export const executiveKeys = {
  all: ['executive-stats'] as const,
}

export function useExecutiveStats() {
  return useQuery({
    queryKey: executiveKeys.all,
    queryFn: api.getExecutiveStats,
    refetchInterval: 5000,
  })
}

// Create batch mutation
export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BatchCreate) => api.createBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}

// Memory entries (patterns, templates, policies)
export function useMemory() {
  return useQuery({
    queryKey: memoryKeys.all,
    queryFn: api.getMemory,
    refetchInterval: 10000, // Refetch every 10 seconds (memory changes less frequently)
  })
}

// Reset demo mutation
export function useResetDemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.resetDemo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
      queryClient.invalidateQueries({ queryKey: executiveKeys.all })
      queryClient.invalidateQueries({ queryKey: memoryKeys.all })
    },
  })
}

// Create Galderma scenario mutation
export function useCreateGaldermaScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createGaldermaScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
      queryClient.invalidateQueries({ queryKey: executiveKeys.all })
      queryClient.invalidateQueries({ queryKey: memoryKeys.all })
    },
  })
}

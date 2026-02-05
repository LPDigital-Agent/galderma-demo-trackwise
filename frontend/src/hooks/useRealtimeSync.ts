// ============================================
// Galderma TrackWise AI Autopilot Demo
// Real-time Sync Hook - Bridges WebSocket to TanStack Query
// ============================================

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useTimelineStore } from '@/stores'
import { caseKeys } from './useCases'
import { statsKeys, executiveKeys } from './useStats'
import { runKeys, ledgerKeys } from './useCaseDetail'

// Event types that trigger cache invalidation
const CASE_EVENTS = new Set([
  'case_created',
  'case_updated',
  'case_closed',
  'run_completed',
  'run_failed',
  'agent_completed',
])

/**
 * useRealtimeSync
 *
 * Subscribes to the timeline event store and invalidates
 * TanStack Query caches when relevant WebSocket events arrive.
 *
 * This makes the UI reactively update when agents process cases
 * without requiring manual refresh or aggressive polling.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const events = useTimelineStore((s) => s.events)
  const lastProcessedRef = useRef(0)

  useEffect(() => {
    // Only process new events since last check
    const newCount = events.length - lastProcessedRef.current
    if (newCount <= 0 || events.length === 0) {
      lastProcessedRef.current = events.length
      return
    }

    // Process only the new events (stored newest-first)
    const newEvents = events.slice(0, newCount)
    lastProcessedRef.current = events.length

    let shouldInvalidateCases = false
    let shouldInvalidateStats = false
    const caseIdsToInvalidate = new Set<string>()

    for (const event of newEvents) {
      if (CASE_EVENTS.has(event.type)) {
        shouldInvalidateCases = true
        shouldInvalidateStats = true

        if (event.case_id) {
          caseIdsToInvalidate.add(event.case_id)
        }
      }
    }

    // Batch invalidations
    if (shouldInvalidateCases) {
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
    }

    if (shouldInvalidateStats) {
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
      queryClient.invalidateQueries({ queryKey: executiveKeys.all })
    }

    // Invalidate specific case details and their associated runs/ledger
    for (const caseId of caseIdsToInvalidate) {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(caseId) })
      queryClient.invalidateQueries({ queryKey: runKeys.byCase(caseId) })
      queryClient.invalidateQueries({ queryKey: ledgerKeys.byCase(caseId) })
    }
  }, [events, queryClient])
}

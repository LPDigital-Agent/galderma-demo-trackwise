// ============================================
// Galderma TrackWise AI Autopilot Demo
// SAC Simulator Hook - Global interval for
// continuous case generation (runs in AppLayout)
// ============================================

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import * as api from '@/api/client'
import { useSacStore } from '@/stores/sacStore'
import { caseKeys } from './useCases'

/**
 * useSacSimulator
 *
 * Manages a global setInterval that generates one random case
 * every 5 seconds when the simulator is active. Runs in AppLayout
 * so the interval persists across page navigations — cases keep
 * flowing into the Cases page while the user watches.
 *
 * Uses api.sacGenerate() directly (not useMutation) to avoid
 * toast notifications on every automatic tick.
 */
export function useSacSimulator() {
  const queryClient = useQueryClient()
  const simulatorActive = useSacStore((s) => s.simulatorActive)
  const addGeneratedCases = useSacStore((s) => s.addGeneratedCases)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (simulatorActive) {
      intervalRef.current = setInterval(async () => {
        try {
          const result = await api.sacGenerate({
            count: 1,
            scenario_type: 'RANDOM',
          })
          addGeneratedCases(result.cases)
          queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
          queryClient.invalidateQueries({ queryKey: ['stats'] })
          queryClient.invalidateQueries({ queryKey: ['executive-stats'] })
        } catch (err) {
          console.error('[SAC Simulator]', err)
        }
      }, 5000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [simulatorActive, queryClient, addGeneratedCases])
}

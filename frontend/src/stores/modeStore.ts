// ============================================
// Galderma TrackWise AI Autopilot Demo
// Mode Store - Execution Mode State
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ExecutionMode } from '@/types'

interface ModeState {
  mode: ExecutionMode
  setMode: (mode: ExecutionMode) => void
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'OBSERVE',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'trackwise-mode',
    }
  )
)

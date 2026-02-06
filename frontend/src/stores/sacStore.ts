// ============================================
// Galderma TrackWise AI Autopilot Demo
// SAC Store - Session State for Case Generator
// ============================================

import { create } from 'zustand'

import type { Case } from '@/types'

export type SacScenario =
  | 'RECURRING_COMPLAINT'
  | 'ADVERSE_EVENT_HIGH'
  | 'LINKED_INQUIRY'
  | 'MISSING_DATA'
  | 'MULTI_PRODUCT_BATCH'
  | 'RANDOM'

interface SacSessionStats {
  total: number
  recurring: number
  adverse: number
  linked: number
}

interface SacState {
  scenario: SacScenario
  productBrand: string | null
  batchCount: number
  persistDynamo: boolean
  generatedCases: Case[]
  sessionStats: SacSessionStats
  isGenerating: boolean

  setScenario: (scenario: SacScenario) => void
  setProductBrand: (brand: string | null) => void
  setBatchCount: (count: number) => void
  setPersistDynamo: (persist: boolean) => void
  addGeneratedCases: (cases: Case[]) => void
  setIsGenerating: (generating: boolean) => void
  resetSession: () => void
}

const INITIAL_STATS: SacSessionStats = { total: 0, recurring: 0, adverse: 0, linked: 0 }

function computeStats(cases: Case[]): SacSessionStats {
  return {
    total: cases.length,
    recurring: cases.filter((c) => c.category === 'QUALITY' || c.linked_case_id).length,
    adverse: cases.filter((c) => c.case_type === 'ADVERSE_EVENT').length,
    linked: cases.filter((c) => c.linked_case_id).length,
  }
}

export const useSacStore = create<SacState>()((set, get) => ({
  scenario: 'RANDOM',
  productBrand: null,
  batchCount: 5,
  persistDynamo: false,
  generatedCases: [],
  sessionStats: INITIAL_STATS,
  isGenerating: false,

  setScenario: (scenario) => set({ scenario }),
  setProductBrand: (brand) => set({ productBrand: brand }),
  setBatchCount: (count) => set({ batchCount: Math.max(1, Math.min(20, count)) }),
  setPersistDynamo: (persist) => set({ persistDynamo: persist }),
  addGeneratedCases: (cases) => {
    const updated = [...cases, ...get().generatedCases]
    set({ generatedCases: updated, sessionStats: computeStats(updated) })
  },
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  resetSession: () =>
    set({ generatedCases: [], sessionStats: INITIAL_STATS, isGenerating: false }),
}))

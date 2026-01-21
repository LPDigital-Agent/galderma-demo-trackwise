// ============================================
// Galderma TrackWise AI Autopilot Demo
// Timeline Store - Real-time Events State
// ============================================

import { create } from 'zustand'

import type { TimelineEvent } from '@/types'

interface TimelineState {
  events: TimelineEvent[]
  isConnected: boolean
  autoScroll: boolean
  filter: string | null
  addEvent: (event: TimelineEvent) => void
  clearEvents: () => void
  setConnected: (connected: boolean) => void
  setAutoScroll: (autoScroll: boolean) => void
  setFilter: (filter: string | null) => void
}

const MAX_EVENTS = 1000

export const useTimelineStore = create<TimelineState>((set) => ({
  events: [],
  isConnected: false,
  autoScroll: true,
  filter: null,

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS),
    })),

  clearEvents: () => set({ events: [] }),

  setConnected: (isConnected) => set({ isConnected }),

  setAutoScroll: (autoScroll) => set({ autoScroll }),

  setFilter: (filter) => set({ filter }),
}))

// Selector for filtered events
export function useFilteredEvents() {
  return useTimelineStore((state) => {
    if (!state.filter) return state.events
    return state.events.filter(
      (event) =>
        event.type.includes(state.filter!) ||
        event.agent?.includes(state.filter!) ||
        event.run_id?.includes(state.filter!) ||
        event.case_id?.includes(state.filter!)
    )
  })
}

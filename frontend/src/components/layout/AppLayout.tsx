// ============================================
// Galderma TrackWise AI Autopilot Demo
// AppLayout Component - Apple Liquid Glass Shell
// ============================================

import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useExecutiveStats } from '@/hooks'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useSacSimulator } from '@/hooks/useSacSimulator'
import { useTimelineStore } from '@/stores'
import type { AgentName } from '@/types'
import { CommandPalette } from './CommandPalette'
import { GlobalKpiDeck } from './GlobalKpiDeck'
import { GlobalLiveStrip } from './GlobalLiveStrip'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { getShellRouteMeta } from './shellMeta'

const LIVE_EVENTS_LIMIT = 5

function formatLiveMessage(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function toAgentName(agent?: string): AgentName | undefined {
  if (!agent) return undefined

  const supportedAgents: AgentName[] = [
    'observer',
    'case_understanding',
    'recurring_detector',
    'compliance_guardian',
    'resolution_composer',
    'inquiry_bridge',
    'writeback',
    'memory_curator',
    'csv_pack',
  ]

  return supportedAgents.includes(agent as AgentName) ? (agent as AgentName) : undefined
}

export function AppLayout() {
  useRealtimeSync()
  useSacSimulator()

  const location = useLocation()
  const meta = getShellRouteMeta(location.pathname)

  const { data: executiveStats, isLoading: executiveLoading } = useExecutiveStats()
  const events = useTimelineStore((state) => state.events)
  const isConnected = useTimelineStore((state) => state.isConnected)

  const liveEvents = useMemo(
    () =>
      events.slice(0, LIVE_EVENTS_LIMIT).map((event, index) => ({
        id: `${event.timestamp}-${event.type}-${index}`,
        message: event.message || formatLiveMessage(event.type),
        timestamp: event.timestamp,
        caseId: event.case_id,
        type: event.type,
        agent: toAgentName(event.agent),
      })),
    [events]
  )

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Sidebar />

      <main
        className={[
          'relative z-10 h-screen overflow-hidden',
          'px-[var(--float-margin)] pt-[var(--float-margin)]',
          'pb-[calc(var(--float-margin)+var(--status-height))]',
          'lg:pl-[calc(var(--float-margin)*2+var(--sidebar-width))]',
        ].join(' ')}
      >
        <div className="h-full overflow-y-auto pr-1">
          <div className="mx-auto flex min-h-full max-w-[1720px] flex-col gap-[var(--shell-gap)]">
            {meta.showGlobalRail ? (
              <section className="shell-top-rail sticky top-0 z-20 space-y-3 pb-1">
                <header className="glass-shell px-4 py-3 lg:px-5 lg:py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lg-text-tertiary)]">
                    TrackWise AI Autopilot
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--lg-text-primary)] lg:text-[2rem]">
                    {meta.title}
                  </h1>
                  <p className="mt-0.5 text-sm text-[var(--lg-text-secondary)]">{meta.subtitle}</p>
                </header>

                <GlobalKpiDeck
                  aiClosedCount={executiveStats?.ai_closed_count ?? 0}
                  humanHoursSaved={executiveStats?.human_hours_saved ?? 0}
                  risksAvoided={executiveStats?.risks_avoided ?? 0}
                  totalCases={executiveStats?.total_cases ?? 0}
                  loading={executiveLoading}
                />

                <GlobalLiveStrip events={liveEvents} isConnected={isConnected} />
              </section>
            ) : null}

            <section className="route-stage flex-1 animate-route-in pb-2">
              <Outlet />
            </section>
          </div>
        </div>
      </main>

      <StatusBar />
      <CommandPalette />
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  )
}

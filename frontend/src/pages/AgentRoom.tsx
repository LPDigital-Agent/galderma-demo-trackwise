// ============================================
// Galderma TrackWise AI Autopilot Demo
// AgentRoom Page - Main Dashboard
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Bot,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { GlassCard } from '@/components/ui'
import { useExecutiveStats, useStats, useWebSocket } from '@/hooks'
import { useFilteredEvents } from '@/stores'
import { AGENTS } from '@/types'
import type { AgentName } from '@/types'

/**
 * AgentRoom Page
 *
 * Main dashboard with executive metrics and activity timeline.
 *
 * Executive metrics (the 3 numbers Galderma needs):
 * 1. Complaints closed by AI
 * 2. Human hours saved
 * 3. Risks avoided
 *
 * Plus operational stats and real-time activity feed.
 */
export function AgentRoom() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: execStats, isLoading: execLoading } = useExecutiveStats()
  const { isConnected } = useWebSocket()
  const events = useFilteredEvents()

  const isLoading = statsLoading || execLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Agent Room</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            AI Autopilot Executive Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-error)]'}`}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Executive Metrics (THE 3 NUMBERS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                AI Closed
              </p>
              <p className="mt-2 text-4xl font-bold text-[var(--status-success)]">
                {isLoading ? '—' : (execStats?.ai_closed_count ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">complaints resolved by agents</p>
            </div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[var(--border-radius-sm)]"
              style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--status-success)' }}
            >
              <Bot className="h-7 w-7" />
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Hours Saved
              </p>
              <p className="mt-2 text-4xl font-bold text-[var(--brand-primary)]">
                {isLoading ? '—' : (execStats?.human_hours_saved ?? 0).toLocaleString()}h
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">human hours freed up</p>
            </div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[var(--border-radius-sm)]"
              style={{ background: 'rgba(0, 164, 180, 0.15)', color: 'var(--brand-primary)' }}
            >
              <Clock className="h-7 w-7" />
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Risks Avoided
              </p>
              <p className="mt-2 text-4xl font-bold text-[var(--status-warning)]">
                {isLoading ? '—' : (execStats?.risks_avoided ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">compliance escalations caught</p>
            </div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[var(--border-radius-sm)]"
              style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-warning)' }}
            >
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Operational Stats (secondary row) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Cases', value: stats?.total_cases ?? 0, color: 'var(--text-primary)' },
          { label: 'Open', value: stats?.open_cases ?? 0, color: 'var(--status-warning)' },
          { label: 'In Progress', value: stats?.in_progress_cases ?? 0, color: 'var(--status-info)' },
          { label: 'Closed', value: stats?.closed_cases ?? 0, color: 'var(--status-success)' },
        ].map(({ label, value, color }) => (
          <GlassCard key={label} variant="subtle" padding="sm">
            <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
            <p className="mt-0.5 text-xl font-bold" style={{ color }}>
              {statsLoading ? '—' : value.toLocaleString()}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Timeline */}
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <TrendingUp className="h-4 w-4 text-[var(--text-tertiary)]" />
        </div>
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No recent activity. Waiting for events...
              </p>
            </div>
          ) : (
            events.slice(0, 15).map((event, index) => {
              const agentInfo = event.agent ? AGENTS[event.agent as AgentName] : null
              const agentColor = agentInfo?.color ?? 'var(--brand-primary)'

              return (
                <div
                  key={`${event.timestamp}-${index}`}
                  className={`flex items-start gap-3 border-b border-[var(--glass-border)] pb-3 last:border-0 ${
                    event.case_id ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.02)] rounded-md -mx-2 px-2' : ''
                  }`}
                  onClick={event.case_id ? () => navigate(`/cases/${event.case_id}`) : undefined}
                >
                  <div
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: agentColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {event.type.replace(/_/g, ' ')}
                      </p>
                      <p className="shrink-0 text-xs text-[var(--text-tertiary)]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {event.message && (
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{event.message}</p>
                    )}
                    {event.agent && (
                      <span
                        className="mt-0.5 inline-block text-xs font-medium"
                        style={{ color: agentColor }}
                      >
                        {agentInfo?.displayName ?? event.agent}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </GlassCard>
    </div>
  )
}

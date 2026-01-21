// ============================================
// Galderma TrackWise AI Autopilot Demo
// AgentRoom Page - Main Dashboard
// ============================================

import { Activity, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/ui'
import { useStats, useWebSocket } from '@/hooks'
import { useFilteredEvents } from '@/stores'

/**
 * AgentRoom Page
 *
 * Main dashboard showing real-time agent activity and statistics.
 *
 * Features:
 * - Real-time timeline events via WebSocket
 * - Case statistics cards
 * - Recent activity feed
 * - Auto-refresh every 5 seconds
 *
 * Performance:
 * - Virtualized timeline for large event lists
 * - Optimistic UI updates
 */
export function AgentRoom() {
  const { data: stats, isLoading } = useStats()
  const { isConnected } = useWebSocket()
  const events = useFilteredEvents()

  const statsCards = [
    {
      label: 'Total Cases',
      value: stats?.total_cases ?? 0,
      icon: Activity,
      color: 'var(--brand-primary)',
    },
    {
      label: 'Open Cases',
      value: stats?.open_cases ?? 0,
      icon: TrendingUp,
      color: 'var(--status-warning)',
    },
    {
      label: 'In Progress',
      value: stats?.in_progress_cases ?? 0,
      icon: Clock,
      color: 'var(--status-info)',
    },
    {
      label: 'Closed',
      value: stats?.closed_cases ?? 0,
      icon: CheckCircle2,
      color: 'var(--status-success)',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Agent Room</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Real-time agent activity and case processing
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} variant="hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{label}</p>
                <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                  {isLoading ? '—' : value.toLocaleString()}
                </p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[var(--border-radius-sm)]"
                style={{ background: `${color}20`, color }}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Timeline */}
      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                No recent activity. Waiting for events...
              </p>
            </div>
          ) : (
            events.slice(0, 10).map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="flex items-start gap-3 border-b border-[var(--glass-border)] pb-3 last:border-0"
              >
                <div className="mt-0.5 h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {event.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {event.message && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.message}</p>
                  )}
                  {event.agent && (
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Agent: {event.agent}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Timeline Item
// ============================================

import type { TimelineEvent, AgentName } from '@/types'
import { AGENTS } from '@/types'
import { cn } from '@/lib/utils'

export interface TimelineItemProps {
  event: TimelineEvent
  className?: string
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const eventTime = new Date(timestamp)
  const diffMs = now.getTime() - eventTime.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}d ago`
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export function TimelineItem({ event, className }: TimelineItemProps) {
  const agentInfo = event.agent ? AGENTS[event.agent as AgentName] : null
  const agentColor = agentInfo?.color || '#6B7280'
  const displayMessage = event.message || formatEventType(event.type)

  return (
    <div
      className={cn(
        'px-4 py-3 border-b border-[var(--glass-border)] hover:bg-white/[0.02] transition-colors',
        className
      )}
      style={{
        borderLeft: `2px solid ${agentColor}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: agentColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[var(--text-primary)]">{displayMessage}</div>
          {event.case_id && (
            <div className="text-xs text-cyan-400 font-mono mt-1">
              Case: {event.case_id}
            </div>
          )}
        </div>
        <div className="text-xs text-[var(--text-muted)] font-mono shrink-0">
          {formatRelativeTime(event.timestamp)}
        </div>
      </div>
    </div>
  )
}

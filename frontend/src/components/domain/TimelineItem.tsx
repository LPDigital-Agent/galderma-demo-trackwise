// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Timeline Item
// ============================================

import type { AgentName, TimelineEvent } from '@/types'

import { timeAgo, timeline } from '@/i18n'
import { cn } from '@/lib/utils'
import { AGENTS } from '@/types'

export interface TimelineItemProps {
  event: TimelineEvent
  className?: string
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const eventTime = new Date(timestamp)
  const diffMs = now.getTime() - eventTime.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return timeAgo.secondsAgo(diffSec)
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return timeAgo.minutesAgo(diffMin)
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return timeAgo.hoursAgo(diffHour)
  return timeAgo.daysAgo(Math.floor(diffHour / 24))
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function TimelineItem({ event, className }: TimelineItemProps) {
  const agentInfo = event.agent ? AGENTS[event.agent as AgentName] : null
  const agentColor = agentInfo?.color ?? '#718096'

  return (
    <article
      className={cn(
        'glass-control border-l-[3px] px-4 py-3 transition-all duration-[220ms] hover:translate-x-[1px] hover:shadow-[0_12px_20px_rgba(15,24,40,0.14)]',
        className
      )}
      style={{ borderLeftColor: agentColor }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: agentColor }} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--lg-text-primary)]">{event.message || formatEventType(event.type)}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--lg-text-tertiary)]">
            {agentInfo ? <span>{agentInfo.displayName}</span> : <span>Sistema</span>}
            {event.case_id ? (
              <>
                <span className="opacity-50">•</span>
                <span className="font-mono">
                  {timeline.casePrefix} {event.case_id}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <time className="shrink-0 text-[11px] font-medium text-[var(--lg-text-tertiary)]">
          {formatRelativeTime(event.timestamp)}
        </time>
      </div>
    </article>
  )
}

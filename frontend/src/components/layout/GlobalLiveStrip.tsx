import { Activity, Radio } from 'lucide-react'

import { AGENTS } from '@/types'
import { shell } from '@/i18n'
import type { GlobalLiveStripProps, LiveStripEvent } from './shellMeta'

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const eventTime = new Date(timestamp).getTime()
  const seconds = Math.max(0, Math.floor((now - eventTime) / 1000))

  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  return `${Math.floor(hours / 24)}d`
}

function LiveEvent({ event }: { event: LiveStripEvent }) {
  const agent = event.agent ? AGENTS[event.agent] : null

  return (
    <li className="glass-control min-w-[270px] max-w-[320px] px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--lg-text-primary)]">{event.message}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--lg-text-tertiary)]">
            {agent ? (
              <>
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="truncate">{agent.displayName}</span>
              </>
            ) : (
              <span>{shell.liveStrip.system}</span>
            )}

            {event.caseId ? (
              <>
                <span className="opacity-50">•</span>
                <span className="font-mono">{event.caseId}</span>
              </>
            ) : null}
          </div>
        </div>

        <time className="shrink-0 text-[11px] font-medium text-[var(--lg-text-tertiary)]">
          {formatRelativeTime(event.timestamp)}
        </time>
      </div>
    </li>
  )
}

export function GlobalLiveStrip({ events, isConnected }: GlobalLiveStripProps) {
  return (
    <section className="glass-shell px-3 py-3 sm:px-4" aria-label={shell.liveStrip.ariaLabel}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/45 border border-white/55">
            <Activity className="h-4 w-4 text-[var(--lg-text-secondary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--lg-text-primary)]">{shell.liveStrip.title}</p>
            <p className="text-xs text-[var(--lg-text-tertiary)]">{shell.liveStrip.subtitle}</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/35 px-2.5 py-1 text-xs text-[var(--lg-text-secondary)]">
          <Radio
            className={isConnected ? 'h-3.5 w-3.5 text-[var(--status-success)] animate-live-pulse' : 'h-3.5 w-3.5 text-[var(--status-error)]'}
          />
          <span>{isConnected ? shell.liveStrip.connected : shell.liveStrip.disconnected}</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="glass-control px-3 py-2 text-sm text-[var(--lg-text-tertiary)]">
          {shell.liveStrip.empty}
        </div>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {events.map((event) => (
            <LiveEvent key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  )
}

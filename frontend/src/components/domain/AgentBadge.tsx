// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Agent Badge
// ============================================

import type { AgentName } from '@/types'
import { AGENTS } from '@/types'
import { cn } from '@/lib/utils'

export interface AgentBadgeProps {
  agent: AgentName
  showModel?: boolean
  className?: string
}

export function AgentBadge({ agent, showModel = false, className }: AgentBadgeProps) {
  const agentInfo = AGENTS[agent]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: agentInfo.color }}
      />
      <span className="text-sm text-[var(--text-primary)]">{agentInfo.displayName}</span>
      {showModel && (
        <span
          className={cn(
            'text-[10px] font-mono uppercase px-1.5 py-0.5 rounded',
            agentInfo.model === 'OPUS'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
          )}
        >
          {agentInfo.model}
        </span>
      )}
    </div>
  )
}

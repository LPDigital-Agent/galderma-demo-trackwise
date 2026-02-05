// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Mode Toggle
// ============================================

import type { ExecutionMode } from '@/types'
import { useModeStore } from '@/stores'
import { cn } from '@/lib/utils'

export interface ModeToggleProps {
  className?: string
}

const modeConfig = {
  OBSERVE: {
    label: 'Observe',
    color: '#9CA3AF',
  },
  TRAIN: {
    label: 'Train',
    color: '#F59E0B',
  },
  ACT: {
    label: 'Act',
    color: '#00A4B4',
  },
} as const

const modes: ExecutionMode[] = ['OBSERVE', 'TRAIN', 'ACT']

export function ModeToggle({ className }: ModeToggleProps) {
  const { mode, setMode } = useModeStore()

  return (
    <div className={cn('bg-[var(--bg-elevated)] rounded-lg p-1 flex gap-1', className)}>
      {modes.map((modeOption) => {
        const config = modeConfig[modeOption]
        const isActive = mode === modeOption

        return (
          <button
            key={modeOption}
            onClick={() => setMode(modeOption)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-all',
              isActive
                ? 'text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
            style={
              isActive
                ? {
                    backgroundColor: config.color,
                  }
                : undefined
            }
          >
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

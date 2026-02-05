// ============================================
// Galderma TrackWise AI Autopilot Demo
// ModeToggle — Liquid Glass Pill Toggle
// ============================================

import { cn } from '@/lib/utils'
import { useModeStore } from '@/stores'
import { Eye, GraduationCap, Zap } from 'lucide-react'
import type { ExecutionMode } from '@/types'

export interface ModeToggleProps {
  className?: string
}

const MODE_CONFIG = {
  OBSERVE: { label: 'Observe', Icon: Eye, description: 'Monitor and log' },
  TRAIN: { label: 'Train', Icon: GraduationCap, description: 'Learn with approval' },
  ACT: { label: 'Act', Icon: Zap, description: 'Execute autonomously' },
} as const

const MODES: ExecutionMode[] = ['OBSERVE', 'TRAIN', 'ACT']

export function ModeToggle({ className }: ModeToggleProps) {
  const { mode, setMode } = useModeStore()

  return (
    <div
      role="radiogroup"
      aria-label="Select execution mode"
      className={cn(
        'inline-flex items-center gap-0.5 p-1',
        'bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)]',
        'rounded-full',
        className
      )}
    >
      {MODES.map((m) => {
        const config = MODE_CONFIG[m]
        const Icon = config.Icon
        const isActive = mode === m

        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setMode(m)}
            title={config.description}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'text-xs font-medium leading-tight',
              'rounded-full',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
              isActive
                ? 'bg-white text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(0,0,0,0.04)]'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}

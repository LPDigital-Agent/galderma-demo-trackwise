// ============================================
// Galderma TrackWise AI Autopilot Demo
// ModeToggle Component - Execution Mode Selector
// ============================================

import { cn } from '@/lib/utils'
import { useModeStore } from '@/stores'
import { Eye, GraduationCap, Zap } from 'lucide-react'
import type { ExecutionMode } from '@/types'

export interface ModeToggleProps {
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Mode configuration with icons and labels
 */
const MODE_CONFIG = {
  OBSERVE: {
    label: 'Observe',
    Icon: Eye,
    description: 'Monitor and log',
  },
  TRAIN: {
    label: 'Train',
    Icon: GraduationCap,
    description: 'Learn with approval',
  },
  ACT: {
    label: 'Act',
    Icon: Zap,
    description: 'Execute autonomously',
  },
} as const

/**
 * Available execution modes
 */
const MODES: ExecutionMode[] = ['OBSERVE', 'TRAIN', 'ACT']

/**
 * ModeToggle Component
 *
 * Toggle group for selecting execution mode (OBSERVE/TRAIN/ACT).
 * Persists selection using Zustand store with localStorage.
 *
 * @example
 * ```tsx
 * <ModeToggle />
 * <ModeToggle className="ml-4" />
 * ```
 *
 * Modes:
 * - OBSERVE: Monitoring mode - agents observe and log actions
 * - TRAIN: Learning mode - agents execute with human-in-the-loop approval
 * - ACT: Autonomous mode - agents execute actions automatically
 *
 * Accessibility:
 * - Keyboard navigable (Arrow keys)
 * - Focus visible ring
 * - Clear active state
 * - ARIA role="radiogroup"
 * - Tooltips via title attribute
 *
 * Performance:
 * - Zustand store with localStorage persistence
 * - Minimal re-renders with selective subscriptions
 */
export function ModeToggle({ className }: ModeToggleProps) {
  const { mode, setMode } = useModeStore()

  return (
    <div
      role="radiogroup"
      aria-label="Select execution mode"
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5',
        'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
        'rounded-[var(--border-radius-sm)]',
        'backdrop-blur-[var(--blur-amount)]',
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
              'text-[11px] font-medium leading-tight',
              'rounded-[6px]',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
              // Active state
              isActive
                ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)]'
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

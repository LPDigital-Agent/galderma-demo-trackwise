// ============================================
// Galderma TrackWise AI Autopilot Demo
// ModeBadge Component - Execution Mode Display
// ============================================

import { cn } from '@/lib/utils'
import { Eye, GraduationCap, Zap } from 'lucide-react'
import type { ExecutionMode } from '@/types'

export interface ModeBadgeProps {
  /**
   * Execution mode
   */
  mode: ExecutionMode
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Whether to show icon
   * @default true
   */
  showIcon?: boolean
}

/**
 * Mode configuration with colors and icons
 */
const MODE_CONFIG = {
  OBSERVE: {
    label: 'Observe',
    color: 'var(--mode-observe)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    Icon: Eye,
    description: 'Monitoring mode - agents observe and log actions',
  },
  TRAIN: {
    label: 'Train',
    color: 'var(--mode-train)',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    Icon: GraduationCap,
    description: 'Learning mode - agents execute with human-in-the-loop approval',
  },
  ACT: {
    label: 'Act',
    color: 'var(--mode-act)',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    Icon: Zap,
    description: 'Autonomous mode - agents execute actions automatically',
  },
} as const

/**
 * ModeBadge Component
 *
 * Displays execution mode (OBSERVE/TRAIN/ACT) with appropriate color and icon.
 * Represents the current operating mode of the agent system.
 *
 * @example
 * ```tsx
 * <ModeBadge mode="OBSERVE" />
 * <ModeBadge mode="ACT" showIcon={false} />
 * ```
 *
 * Mode Meanings:
 * - OBSERVE: Monitoring mode - agents observe and log actions
 * - TRAIN: Learning mode - agents execute with human approval required
 * - ACT: Autonomous mode - agents execute actions automatically
 *
 * Accessibility:
 * - Color is not the only indicator (includes text label and icon)
 * - Maintains WCAG AA contrast ratios
 * - Icon has proper aria-hidden attribute
 *
 * Performance:
 * - Static configuration object for fast lookups
 * - Minimal re-renders
 */
export function ModeBadge({ mode, className, showIcon = true }: ModeBadgeProps) {
  const config = MODE_CONFIG[mode]
  const Icon = config.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'text-[11px] font-medium leading-tight',
        'rounded-[var(--border-radius-sm)] border',
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.borderColor,
      }}
      title={config.description}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// Badge Component - Status Display Badge
// ============================================

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface BadgeProps {
  /**
   * Badge variant/status
   * - default: neutral gray
   * - success: green
   * - warning: amber
   * - error: red
   * - info: blue
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  /**
   * Badge content
   */
  children: ReactNode
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Badge Component
 *
 * Small badge component for displaying status, tags, or labels.
 * Uses status colors from design system.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error">Failed</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge>Default</Badge>
 * ```
 *
 * Accessibility:
 * - Maintains WCAG AA contrast ratios
 * - Clear visual distinction between variants
 *
 * Performance:
 * - Lightweight component with minimal CSS
 * - Uses CSS custom properties for theme consistency
 */
export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'text-[11px] font-medium leading-tight',
        'rounded-[var(--border-radius-sm)] border',
        // Variant styles
        {
          // Default: neutral gray
          'bg-[rgba(161,161,170,0.15)] text-[var(--text-secondary)] border-[rgba(161,161,170,0.3)]':
            variant === 'default',

          // Success: green
          'bg-[rgba(34,197,94,0.15)] text-[var(--status-success)] border-[rgba(34,197,94,0.3)]':
            variant === 'success',

          // Warning: amber
          'bg-[rgba(245,158,11,0.15)] text-[var(--status-warning)] border-[rgba(245,158,11,0.3)]':
            variant === 'warning',

          // Error: red
          'bg-[rgba(239,68,68,0.15)] text-[var(--status-error)] border-[rgba(239,68,68,0.3)]':
            variant === 'error',

          // Info: blue
          'bg-[rgba(59,130,246,0.15)] text-[var(--status-info)] border-[rgba(59,130,246,0.3)]':
            variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// Badge Component — Liquid Glass Pill Badge
// ============================================

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles — pill shape, no explicit border
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-xs font-medium leading-tight',
        'rounded-full',
        // Variant styles
        {
          'bg-[rgba(100,116,139,0.1)] text-[var(--text-secondary)]':
            variant === 'default',

          'bg-[rgba(22,163,74,0.1)] text-[var(--status-success)]':
            variant === 'success',

          'bg-[rgba(217,119,6,0.1)] text-[var(--status-warning)]':
            variant === 'warning',

          'bg-[rgba(220,38,38,0.1)] text-[var(--status-error)]':
            variant === 'error',

          'bg-[rgba(37,99,235,0.1)] text-[var(--status-info)]':
            variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

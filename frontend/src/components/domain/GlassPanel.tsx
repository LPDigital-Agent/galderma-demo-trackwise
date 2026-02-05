// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Glass Panel
// ============================================

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'surface' | 'elevated'
}

const variantClasses = {
  default: 'bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6',
  surface: 'bg-[var(--bg-surface)] border border-[var(--glass-border)] rounded-xl p-6',
  elevated: 'bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl shadow-lg p-6',
} as const

export function GlassPanel({ children, className, variant = 'default' }: GlassPanelProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  )
}

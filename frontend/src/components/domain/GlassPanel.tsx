// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Glass Panel
// ============================================

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'surface' | 'elevated' | 'floating'
}

const variantClasses = {
  default: 'glass p-6',
  surface: 'glass-surface p-6',
  elevated: 'glass-elevated p-6',
  floating: 'glass-float p-6',
} as const

export function GlassPanel({ children, className, variant = 'default' }: GlassPanelProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  )
}

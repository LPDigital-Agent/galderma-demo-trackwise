// ============================================
// Galderma TrackWise AI Autopilot Demo
// SeverityBadge — Liquid Glass Pill
// ============================================

import { cn } from '@/lib/utils'
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react'
import type { CaseSeverity } from '@/types'

export interface SeverityBadgeProps {
  severity: CaseSeverity
  className?: string
  showIcon?: boolean
}

const SEVERITY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'var(--severity-low)',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    Icon: CheckCircle2,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'var(--severity-medium)',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    Icon: Info,
  },
  HIGH: {
    label: 'High',
    color: 'var(--severity-high)',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'var(--severity-critical)',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    Icon: AlertOctagon,
  },
} as const

export function SeverityBadge({ severity, className, showIcon = true }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-xs font-medium leading-tight',
        'rounded-full',
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}

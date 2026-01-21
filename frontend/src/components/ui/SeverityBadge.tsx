// ============================================
// Galderma TrackWise AI Autopilot Demo
// SeverityBadge Component - Case Severity Display
// ============================================

import { cn } from '@/lib/utils'
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react'
import type { CaseSeverity } from '@/types'

export interface SeverityBadgeProps {
  /**
   * Case severity level
   */
  severity: CaseSeverity
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
 * Severity configuration with colors and icons
 */
const SEVERITY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'var(--severity-low)',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    Icon: CheckCircle2,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'var(--severity-medium)',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    Icon: Info,
  },
  HIGH: {
    label: 'High',
    color: 'var(--severity-high)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critical',
    color: 'var(--severity-critical)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    Icon: AlertOctagon,
  },
} as const

/**
 * SeverityBadge Component
 *
 * Displays case severity with appropriate color coding and icon.
 * Uses severity colors from design system.
 *
 * @example
 * ```tsx
 * <SeverityBadge severity="LOW" />
 * <SeverityBadge severity="CRITICAL" showIcon={false} />
 * ```
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
export function SeverityBadge({ severity, className, showIcon = true }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'text-[11px] font-medium leading-tight',
        'rounded-[var(--border-radius-sm)] border',
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.borderColor,
      }}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}

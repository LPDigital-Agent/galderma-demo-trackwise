// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Severity Badge
// ============================================

import { AlertTriangle } from 'lucide-react'
import type { CaseSeverity } from '@/types'
import { severities } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface SeverityBadgeProps {
  severity: CaseSeverity
  className?: string
}

const severityConfig = {
  LOW: {
    color: 'green',
    bgClass: 'bg-green-50',
    textClass: 'text-green-600',
    borderClass: 'border-green-200',
  },
  MEDIUM: {
    color: 'amber',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-200',
  },
  HIGH: {
    color: 'orange',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-200',
  },
  CRITICAL: {
    color: 'red',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    borderClass: 'border-red-200',
  },
} as const

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity]
  const showIcon = severity === 'CRITICAL'

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      )}
    >
      {showIcon && <AlertTriangle className="w-3 h-3" />}
      <span>{severities[severity]}</span>
    </Badge>
  )
}

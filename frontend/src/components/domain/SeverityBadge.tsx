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
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/20',
  },
  MEDIUM: {
    color: 'amber',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  HIGH: {
    color: 'orange',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/20',
  },
  CRITICAL: {
    color: 'red',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/20',
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

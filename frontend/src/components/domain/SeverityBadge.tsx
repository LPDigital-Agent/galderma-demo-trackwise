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
    bgClass: 'bg-green-500/10 backdrop-blur-sm',
    textClass: 'text-green-400',
    borderClass: 'border-green-400/30',
  },
  MEDIUM: {
    color: 'amber',
    bgClass: 'bg-amber-500/10 backdrop-blur-sm',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-400/30',
  },
  HIGH: {
    color: 'orange',
    bgClass: 'bg-orange-500/10 backdrop-blur-sm',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-400/30',
  },
  CRITICAL: {
    color: 'red',
    bgClass: 'bg-red-500/10 backdrop-blur-sm',
    textClass: 'text-red-400',
    borderClass: 'border-red-400/30',
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

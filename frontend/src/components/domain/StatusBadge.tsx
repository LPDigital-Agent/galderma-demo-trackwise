// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Status Badge
// ============================================

import type { CaseStatus } from '@/types'
import { statuses } from '@/i18n'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps {
  status: CaseStatus
  className?: string
}

const statusConfig = {
  OPEN: {
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/20',
  },
  IN_PROGRESS: {
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  PENDING_REVIEW: {
    bgClass: 'bg-violet-500/10',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-500/20',
  },
  RESOLVED: {
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/20',
  },
  CLOSED: {
    bgClass: 'bg-gray-500/10',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/20',
  },
} as const

function formatStatus(status: CaseStatus): string {
  return statuses[status]
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

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
      {formatStatus(status)}
    </Badge>
  )
}

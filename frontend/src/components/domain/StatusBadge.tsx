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
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-200',
  },
  IN_PROGRESS: {
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-200',
  },
  PENDING_REVIEW: {
    bgClass: 'bg-violet-50',
    textClass: 'text-violet-600',
    borderClass: 'border-violet-200',
  },
  RESOLVED: {
    bgClass: 'bg-green-50',
    textClass: 'text-green-600',
    borderClass: 'border-green-200',
  },
  CLOSED: {
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-200',
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

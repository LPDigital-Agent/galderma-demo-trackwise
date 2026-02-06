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
    bgClass: 'bg-blue-500/10 backdrop-blur-sm',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-300/30',
  },
  IN_PROGRESS: {
    bgClass: 'bg-amber-500/10 backdrop-blur-sm',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-300/30',
  },
  PENDING_REVIEW: {
    bgClass: 'bg-violet-500/10 backdrop-blur-sm',
    textClass: 'text-violet-600',
    borderClass: 'border-violet-300/30',
  },
  RESOLVED: {
    bgClass: 'bg-green-500/10 backdrop-blur-sm',
    textClass: 'text-green-600',
    borderClass: 'border-green-300/30',
  },
  CLOSED: {
    bgClass: 'bg-gray-500/10 backdrop-blur-sm',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300/30',
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

// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Empty State
// ============================================

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('glass-float flex flex-col items-center justify-center py-16 px-6', className)}>
      <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-[var(--brand-primary)]" />
      </div>
      <div className="text-sm font-medium text-[var(--text-secondary)] mt-4">
        {title}
      </div>
      {description && (
        <div className="text-xs text-[var(--text-muted)] mt-1 max-w-xs text-center">
          {description}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

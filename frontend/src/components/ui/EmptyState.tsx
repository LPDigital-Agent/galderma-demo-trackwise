// ============================================
// Galderma TrackWise AI Autopilot Demo
// EmptyState — Shared Empty State Component
// ============================================

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(0,164,180,0.08)]">
        <Icon className="h-8 w-8 text-[var(--brand-primary)]" />
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-[var(--text-tertiary)]">{description}</p>
      )}
    </div>
  )
}

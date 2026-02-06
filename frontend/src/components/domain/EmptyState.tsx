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

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section className={cn('glass-card flex flex-col items-center justify-center px-8 py-14 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/55 bg-white/45">
        <Icon className="h-8 w-8 text-[var(--brand-primary)]" />
      </div>

      <p className="mt-4 text-base font-semibold text-[var(--lg-text-primary)]">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-[var(--lg-text-secondary)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}

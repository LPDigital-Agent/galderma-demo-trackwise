// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Metric Card
// ============================================

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface MetricCardProps {
  value: number | string
  label: string
  sublabel?: string
  icon: LucideIcon
  color: string
  className?: string
}

export function MetricCard({ value, label, sublabel, icon: Icon, color, className }: MetricCardProps) {
  return (
    <article className={cn('glass-card p-5 lg:p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--lg-text-tertiary)]">{label}</p>
          <p className="mt-2 text-[2.15rem] font-semibold leading-none tracking-tight text-[var(--lg-text-primary)]">
            {value}
          </p>
          {sublabel ? <p className="mt-2 text-sm text-[var(--lg-text-secondary)]">{sublabel}</p> : null}
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60"
          style={{ background: `color-mix(in oklab, ${color} 16%, white 84%)` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </article>
  )
}

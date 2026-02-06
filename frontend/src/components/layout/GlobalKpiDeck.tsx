import { CheckCircle2, Shield, Zap } from 'lucide-react'

import { agentRoom as t } from '@/i18n'
import type { GlobalKpiDeckProps } from './shellMeta'

interface KpiItem {
  id: string
  label: string
  value: string
  sublabel: string
  icon: typeof CheckCircle2
  accent: string
}

function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon

  return (
    <article className="glass-card p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--lg-text-tertiary)] tracking-[0.02em] uppercase">
            {item.label}
          </p>
          <p className="text-3xl lg:text-[2.15rem] font-semibold tracking-tight text-[var(--lg-text-primary)]">
            {item.value}
          </p>
          <p className="text-sm text-[var(--lg-text-secondary)]">{item.sublabel}</p>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/50"
          style={{ background: `color-mix(in oklab, ${item.accent} 16%, white 84%)` }}
        >
          <Icon className="h-5 w-5" style={{ color: item.accent }} />
        </div>
      </div>
    </article>
  )
}

export function GlobalKpiDeck({
  aiClosedCount,
  humanHoursSaved,
  risksAvoided,
  totalCases,
  loading,
}: GlobalKpiDeckProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            className="glass-card h-[126px] animate-shimmer"
            aria-hidden
          />
        ))}
      </div>
    )
  }

  const metrics: KpiItem[] = [
    {
      id: 'ai-closed',
      label: t.metrics.aiClosed,
      value: aiClosedCount.toLocaleString(),
      sublabel: t.metrics.aiClosedSublabel(totalCases.toLocaleString()),
      icon: CheckCircle2,
      accent: 'var(--lg-accent-emerald)',
    },
    {
      id: 'hours-saved',
      label: t.metrics.hoursSaved,
      value: humanHoursSaved.toLocaleString(),
      sublabel: t.metrics.hoursSavedSublabel,
      icon: Zap,
      accent: 'var(--lg-accent-cyan)',
    },
    {
      id: 'risks-avoided',
      label: t.metrics.risksAvoided,
      value: risksAvoided.toLocaleString(),
      sublabel: t.metrics.risksAvoidedSublabel,
      icon: Shield,
      accent: 'var(--lg-accent-violet)',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      {metrics.map((item) => (
        <KpiCard key={item.id} item={item} />
      ))}
    </div>
  )
}

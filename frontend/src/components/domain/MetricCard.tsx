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

export function MetricCard({
  value,
  label,
  sublabel,
  icon: Icon,
  color,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'glass p-6',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ color }}
          >
            {value}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">{label}</div>
          {sublabel && (
            <div className="text-xs text-[var(--text-muted)] mt-1">{sublabel}</div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}10` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// ModeBadge — Liquid Glass Pill
// ============================================

import { cn } from '@/lib/utils'
import { Eye, GraduationCap, Zap } from 'lucide-react'
import type { ExecutionMode } from '@/types'

export interface ModeBadgeProps {
  mode: ExecutionMode
  className?: string
  showIcon?: boolean
}

const MODE_CONFIG = {
  OBSERVE: {
    label: 'Observe',
    color: 'var(--mode-observe)',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    Icon: Eye,
    description: 'Monitoring mode - agents observe and log actions',
  },
  TRAIN: {
    label: 'Train',
    color: 'var(--mode-train)',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    Icon: GraduationCap,
    description: 'Learning mode - agents execute with human-in-the-loop approval',
  },
  ACT: {
    label: 'Act',
    color: 'var(--mode-act)',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    Icon: Zap,
    description: 'Autonomous mode - agents execute actions automatically',
  },
} as const

export function ModeBadge({ mode, className, showIcon = true }: ModeBadgeProps) {
  const config = MODE_CONFIG[mode]
  const Icon = config.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'text-xs font-medium leading-tight',
        'rounded-full',
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
      title={config.description}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}

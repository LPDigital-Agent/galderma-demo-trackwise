// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Glass Panel
// ============================================

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type NormalizedGlassVariant = 'shell' | 'card' | 'control' | 'pill'
export type LegacyGlassVariant = 'default' | 'surface' | 'elevated' | 'floating'

export interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: NormalizedGlassVariant | LegacyGlassVariant
}

const normalizedVariantClasses: Record<NormalizedGlassVariant, string> = {
  shell: 'glass-shell p-6',
  card: 'glass-card p-6',
  control: 'glass-control p-4',
  pill: 'glass-pill p-4',
}

const legacyVariantMap: Record<LegacyGlassVariant, NormalizedGlassVariant> = {
  default: 'card',
  surface: 'card',
  elevated: 'shell',
  floating: 'card',
}

function normalizeVariant(variant: GlassPanelProps['variant']): NormalizedGlassVariant {
  if (!variant) return 'card'
  if (variant in normalizedVariantClasses) {
    return variant as NormalizedGlassVariant
  }
  return legacyVariantMap[variant as LegacyGlassVariant] ?? 'card'
}

export function GlassPanel({ children, className, variant = 'card' }: GlassPanelProps) {
  const normalizedVariant = normalizeVariant(variant)

  return <div className={cn(normalizedVariantClasses[normalizedVariant], className)}>{children}</div>
}

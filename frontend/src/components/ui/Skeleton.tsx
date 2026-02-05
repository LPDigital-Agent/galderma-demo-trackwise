// ============================================
// Galderma TrackWise AI Autopilot Demo
// Skeleton — Animated Loading Placeholder
// ============================================

import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--border-radius-md)] bg-[rgba(0,0,0,0.06)]',
        className
      )}
    />
  )
}

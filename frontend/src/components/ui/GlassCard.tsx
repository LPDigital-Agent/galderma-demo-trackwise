// ============================================
// Galderma TrackWise AI Autopilot Demo
// GlassCard Component — Apple Liquid Glass
// ============================================

import { cn } from '@/lib/utils'

export interface GlassCardProps {
  variant?: 'default' | 'surface' | 'elevated' | 'hover' | 'subtle' | 'strong'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export function GlassCard({
  variant = 'default',
  padding = 'md',
  className,
  children,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles — Liquid Glass
        'relative overflow-hidden rounded-[var(--border-radius-lg)] border transition-all duration-200',
        // Padding
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-5': padding === 'md',
          'p-6': padding === 'lg',
        },
        // Variant-specific styles
        {
          // Default: translucent white glass with backdrop blur
          'bg-[var(--glass-bg)] border-[var(--glass-border)] shadow-[var(--shadow-glass)] backdrop-blur-xl backdrop-saturate-[180%] backdrop-brightness-110':
            variant === 'default',

          // Surface: solid white
          'bg-[var(--bg-surface)] border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-glass)]':
            variant === 'surface',

          // Elevated: white with stronger shadow
          'bg-[var(--bg-elevated)] border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-elevated)] backdrop-blur-xl backdrop-saturate-[180%] backdrop-brightness-110':
            variant === 'elevated',

          // Hover: glass with interactive effects
          'bg-[var(--glass-bg)] border-[var(--glass-border)] shadow-[var(--shadow-glass)] backdrop-blur-xl backdrop-saturate-[180%] backdrop-brightness-110 cursor-pointer hover:bg-[var(--glass-hover)] hover:border-[var(--glass-border-strong)] hover:shadow-lg hover:scale-[1.01]':
            variant === 'hover',

          // Subtle: lighter glass
          'bg-[var(--glass-bg-subtle)] border-[var(--glass-border-subtle)] backdrop-blur-lg backdrop-saturate-150':
            variant === 'subtle',

          // Strong: stronger glass for modals
          'bg-[var(--glass-bg-strong)] border-[var(--glass-border-strong)] shadow-[var(--shadow-elevated)] backdrop-blur-2xl backdrop-saturate-[200%] backdrop-brightness-105':
            variant === 'strong',
        },
        className
      )}
    >
      {/* Specular highlight layer — Liquid Glass refraction */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-[1]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
        }}
      />
      {/* Content layer */}
      <div className="relative z-[2]">
        {children}
      </div>
    </div>
  )
}

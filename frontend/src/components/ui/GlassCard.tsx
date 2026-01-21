// ============================================
// Galderma TrackWise AI Autopilot Demo
// GlassCard Component - Glassmorphism Card
// ============================================

import { cn } from '@/lib/utils'

export interface GlassCardProps {
  /**
   * Visual variant of the glass card
   * - default: standard glass with translucent background
   * - surface: uses --bg-surface background
   * - elevated: elevated with stronger shadow
   * - hover: includes hover effect
   */
  variant?: 'default' | 'surface' | 'elevated' | 'hover'
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Card content
   */
  children: React.ReactNode
  /**
   * Optional onClick handler
   */
  onClick?: () => void
}

/**
 * GlassCard Component
 *
 * Glassmorphism card component with blur backdrop effect.
 * Based on Apple TV/tvOS design language.
 *
 * @example
 * ```tsx
 * <GlassCard variant="default">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </GlassCard>
 *
 * <GlassCard variant="hover" onClick={() => console.log('clicked')}>
 *   Interactive card
 * </GlassCard>
 * ```
 *
 * Accessibility:
 * - Provides solid fallback when backdrop-filter is not supported
 * - Maintains WCAG AA contrast ratios
 *
 * Performance:
 * - Uses CSS custom properties for theme consistency
 * - Hardware-accelerated backdrop-filter
 */
export function GlassCard({
  variant = 'default',
  className,
  children,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        'rounded-[var(--border-radius-lg)] border transition-colors duration-150',
        // Backdrop blur
        'backdrop-blur-[var(--blur-amount)]',
        // Variant-specific styles
        {
          // Default: standard glass with translucent bg
          'bg-[var(--glass-bg)] border-[var(--glass-border)] shadow-[var(--shadow-glass)]':
            variant === 'default',

          // Surface: solid surface background
          'bg-[var(--bg-surface)] border-[var(--glass-border)]':
            variant === 'surface',

          // Elevated: elevated with stronger shadow
          'bg-[var(--bg-elevated)] border-[var(--glass-border)] shadow-[var(--shadow-elevated)]':
            variant === 'elevated',

          // Hover: glass with hover effect
          'bg-[var(--glass-bg)] border-[var(--glass-border)] shadow-[var(--shadow-glass)] cursor-pointer hover:bg-[var(--glass-hover)] hover:border-[rgba(255,255,255,0.12)]':
            variant === 'hover',
        },
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Accessibility Fallback
 * For browsers that don't support backdrop-filter
 */
if (typeof window !== 'undefined' && !CSS.supports('backdrop-filter', 'blur(16px)')) {
  // Add fallback class to body to adjust glass backgrounds
  document.body.classList.add('no-backdrop-blur')
}

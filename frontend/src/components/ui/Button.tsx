// ============================================
// Galderma TrackWise AI Autopilot Demo
// Button Component - Interactive Button
// ============================================

import { cn } from '@/lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /**
   * Button visual variant
   * - primary: brand color, for main actions
   * - secondary: glass background, for secondary actions
   * - ghost: transparent, for tertiary actions
   * - danger: red, for destructive actions
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Button content
   */
  children: ReactNode
}

/**
 * Button Component
 *
 * Interactive button with multiple variants and sizes.
 * Supports all native button attributes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => console.log('clicked')}>
 *   Primary Action
 * </Button>
 *
 * <Button variant="secondary" size="sm" disabled>
 *   Secondary Action
 * </Button>
 *
 * <Button variant="danger" onClick={handleDelete}>
 *   Delete
 * </Button>
 * ```
 *
 * Accessibility:
 * - Keyboard navigable (Tab)
 * - Focus visible ring
 * - Disabled state with aria-disabled
 * - Proper contrast ratios
 *
 * Performance:
 * - CSS transitions for smooth interactions
 * - Hardware-accelerated transforms
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2',
        'font-medium rounded-[var(--border-radius-sm)]',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[var(--bg-base)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Size variants
        {
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        // Variant styles
        {
          // Primary: brand color
          'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus-visible:ring-[var(--brand-primary)] disabled:hover:bg-[var(--brand-primary)]':
            variant === 'primary',

          // Secondary: glass background with border
          'bg-transparent text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] active:bg-[rgba(255,255,255,0.08)] focus-visible:ring-[var(--glass-border)] disabled:hover:bg-transparent':
            variant === 'secondary',

          // Ghost: transparent, no border
          'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] active:bg-[rgba(255,255,255,0.08)] focus-visible:ring-[var(--glass-border)] disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]':
            variant === 'ghost',

          // Danger: red for destructive actions
          'bg-[var(--status-error)] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-[var(--status-error)] disabled:hover:bg-[var(--status-error)]':
            variant === 'danger',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

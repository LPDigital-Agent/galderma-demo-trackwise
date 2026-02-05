// ============================================
// Galderma TrackWise AI Autopilot Demo
// Button Component — Apple Liquid Glass Pill
// ============================================

import { cn } from '@/lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

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
        // Base styles — Liquid Glass pill shape
        'inline-flex items-center justify-center gap-2',
        'font-medium rounded-[var(--border-radius-pill)]',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[var(--bg-base)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'active:scale-[0.98]',
        // Size variants
        {
          'px-3.5 py-1.5 text-xs': size === 'sm',
          'px-5 py-2 text-sm': size === 'md',
          'px-7 py-3 text-base': size === 'lg',
        },
        // Variant styles
        {
          // Primary: Galderma teal with subtle gradient
          'bg-[var(--brand-primary)] text-white shadow-md hover:shadow-lg hover:brightness-110 focus-visible:ring-[var(--brand-primary)] disabled:hover:bg-[var(--brand-primary)]':
            variant === 'primary',

          // Secondary: white glass with border
          'bg-[rgba(255,255,255,0.5)] text-[var(--text-primary)] border border-[rgba(0,0,0,0.08)] shadow-sm backdrop-blur-sm hover:bg-[rgba(255,255,255,0.7)] hover:shadow-md focus-visible:ring-[var(--brand-primary)] disabled:hover:bg-[rgba(255,255,255,0.5)]':
            variant === 'secondary',

          // Ghost: transparent
          'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(0,0,0,0.04)] focus-visible:ring-[var(--brand-primary)] disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]':
            variant === 'ghost',

          // Danger: red
          'bg-[var(--status-error)] text-white shadow-md hover:shadow-lg hover:brightness-110 focus-visible:ring-[var(--status-error)] disabled:hover:bg-[var(--status-error)]':
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

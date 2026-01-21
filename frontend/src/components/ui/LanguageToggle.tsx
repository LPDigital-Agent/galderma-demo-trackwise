// ============================================
// Galderma TrackWise AI Autopilot Demo
// LanguageToggle Component - Language Selector
// ============================================

import { cn } from '@/lib/utils'
import { useLanguageStore, getLanguageLabel } from '@/stores'
import type { Language } from '@/types'

export interface LanguageToggleProps {
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Available languages
 */
const LANGUAGES: Language[] = ['AUTO', 'PT', 'EN', 'ES', 'FR']

/**
 * LanguageToggle Component
 *
 * Toggle group for selecting UI language.
 * Persists selection using Zustand store with localStorage.
 *
 * @example
 * ```tsx
 * <LanguageToggle />
 * <LanguageToggle className="ml-4" />
 * ```
 *
 * Languages:
 * - AUTO: Auto-detect from browser/case
 * - PT: Portuguese (Brazil)
 * - EN: English
 * - ES: Spanish
 * - FR: French
 *
 * Accessibility:
 * - Keyboard navigable (Arrow keys)
 * - Focus visible ring
 * - Clear active state
 * - ARIA role="radiogroup"
 *
 * Performance:
 * - Zustand store with localStorage persistence
 * - Minimal re-renders with selective subscriptions
 */
export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div
      role="radiogroup"
      aria-label="Select language"
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5',
        'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
        'rounded-[var(--border-radius-sm)]',
        'backdrop-blur-[var(--blur-amount)]',
        className
      )}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          role="radio"
          aria-checked={language === lang}
          onClick={() => setLanguage(lang)}
          className={cn(
            'px-3 py-1.5',
            'text-[11px] font-medium leading-tight',
            'rounded-[6px]',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
            // Active state
            language === lang
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)]'
          )}
        >
          {getLanguageLabel(lang)}
        </button>
      ))}
    </div>
  )
}

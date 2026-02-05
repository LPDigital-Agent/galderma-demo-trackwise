// ============================================
// Galderma TrackWise AI Autopilot Demo
// LanguageToggle — Liquid Glass Pill Toggle
// ============================================

import { cn } from '@/lib/utils'
import { useLanguageStore, getLanguageLabel } from '@/stores'
import type { Language } from '@/types'

export interface LanguageToggleProps {
  className?: string
}

const LANGUAGES: Language[] = ['AUTO', 'PT', 'EN', 'ES', 'FR']

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div
      role="radiogroup"
      aria-label="Select language"
      className={cn(
        'inline-flex items-center gap-0.5 p-1',
        'bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)]',
        'rounded-full',
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
            'text-xs font-medium leading-tight',
            'rounded-full',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
            language === lang
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(0,0,0,0.04)]'
          )}
        >
          {getLanguageLabel(lang)}
        </button>
      ))}
    </div>
  )
}

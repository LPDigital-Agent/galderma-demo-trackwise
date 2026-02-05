// ============================================
// Galderma TrackWise AI Autopilot Demo
// Domain Component: Language Selector
// ============================================

import { Globe, Check } from 'lucide-react'
import type { Language } from '@/types'
import { useLanguageStore, getLanguageLabel } from '@/stores'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface LanguageSelectorProps {
  className?: string
}

const languages: Language[] = ['AUTO', 'PT', 'EN', 'ES', 'FR']

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguageStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium',
          'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
          'hover:text-[var(--text-primary)] transition-colors',
          'border border-[var(--glass-border)]',
          className
        )}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{language}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-xs">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className="text-xs cursor-pointer"
          >
            <div className="flex items-center justify-between w-full gap-2">
              <span>{getLanguageLabel(lang)}</span>
              {language === lang && <Check className="w-3 h-3 text-[var(--brand-primary)]" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// StatusBar Component - Liquid Glass Floating Pill
// ============================================

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTimelineStore } from '@/stores'
import { useModeStore } from '@/stores/modeStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import { statusBar as t, languageLabels } from '@/i18n'
import type { ExecutionMode, Language } from '@/types'

const MODES: { value: ExecutionMode; label: string; color: string }[] = [
  { value: 'OBSERVE', label: t.modes.OBSERVE, color: 'var(--mode-observe)' },
  { value: 'TRAIN', label: t.modes.TRAIN, color: 'var(--mode-train)' },
  { value: 'ACT', label: t.modes.ACT, color: 'var(--mode-act)' },
]

const LANGUAGES: Language[] = ['AUTO', 'PT', 'EN', 'ES', 'FR']

export function StatusBar() {
  const isConnected = useTimelineStore((s) => s.isConnected)
  const { mode, setMode } = useModeStore()
  const { language, setLanguage } = useLanguageStore()

  return (
    <footer className="fixed bottom-[var(--float-margin)] left-1/2 -translate-x-1/2 z-30 glass-pill h-9 px-6 flex items-center gap-4 text-xs">
      {/* WebSocket Status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors duration-300',
            isConnected
              ? 'bg-[var(--status-success)] animate-live-pulse'
              : 'bg-[var(--status-error)]'
          )}
        />
        <span className="text-[var(--text-muted)] whitespace-nowrap">
          {isConnected ? t.connected : t.disconnected}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-black/10" />

      {/* Mode Toggle */}
      <div className="flex items-center gap-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'px-3 py-1 rounded-full transition-all duration-200',
              mode === m.value
                ? 'text-white font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
            style={
              mode === m.value
                ? { backgroundColor: m.color }
                : undefined
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-black/10" />

      {/* Language Selector + Command Hint */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200">
              {languageLabels[language]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[var(--bg-elevated)] border-[var(--glass-border)]">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'cursor-pointer',
                  language === lang && 'bg-black/5'
                )}
              >
                {languageLabels[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <kbd className="px-2 py-0.5 rounded-lg bg-white/30 border border-white/40 text-[var(--text-muted)] font-mono">
          ⌘K
        </kbd>
      </div>
    </footer>
  )
}

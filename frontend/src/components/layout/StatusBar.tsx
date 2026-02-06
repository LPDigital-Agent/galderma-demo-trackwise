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
    <footer
      className={cn(
        'fixed bottom-[var(--float-margin)] z-30',
        'left-[var(--float-margin)] right-[var(--float-margin)]',
        'lg:left-[calc(var(--sidebar-width)+var(--float-margin)*2)]',
        'glass-pill min-h-[var(--status-height)] px-3 md:px-4 lg:px-5',
        'flex items-center'
      )}
    >
      <div className="flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap">
        {/* WebSocket Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors duration-300',
              isConnected
                ? 'bg-[var(--status-success)] animate-live-pulse'
                : 'bg-[var(--status-error)]'
            )}
          />
          <span className="text-[var(--text-secondary)] whitespace-nowrap">
            {isConnected ? t.connected : t.disconnected}
          </span>
        </div>

        <div className="w-px h-4 bg-white/45 shrink-0" />

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'px-3 py-1 rounded-full transition-all duration-200',
                'text-xs',
                mode === m.value
                  ? 'text-white font-medium shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/35'
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

        <div className="w-px h-4 bg-white/45 shrink-0" />

        {/* Language Selector + Command Hint */}
        <div className="flex items-center gap-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200">
                {languageLabels[language]}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'cursor-pointer',
                    language === lang && 'bg-white/30'
                  )}
                >
                  {languageLabels[lang]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <kbd className="px-2 py-0.5 rounded-lg bg-white/38 border border-white/60 text-[var(--text-muted)] font-mono">
            ⌘K
          </kbd>
        </div>
      </div>
    </footer>
  )
}

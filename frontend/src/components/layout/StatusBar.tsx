// ============================================
// Galderma TrackWise AI Autopilot Demo
// StatusBar Component - Bottom Status Bar (VS Code-inspired)
// ============================================

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTimelineStore } from '@/stores'
import { useModeStore } from '@/stores/modeStore'
import { useLanguageStore, getLanguageLabel } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import type { ExecutionMode, Language } from '@/types'

const MODES: { value: ExecutionMode; label: string; color: string }[] = [
  { value: 'OBSERVE', label: 'Observe', color: 'var(--mode-observe)' },
  { value: 'TRAIN', label: 'Train', color: 'var(--mode-train)' },
  { value: 'ACT', label: 'Act', color: 'var(--mode-act)' },
]

const LANGUAGES: Language[] = ['AUTO', 'PT', 'EN', 'ES', 'FR']

export function StatusBar() {
  const isConnected = useTimelineStore((s) => s.isConnected)
  const { mode, setMode } = useModeStore()
  const { language, setLanguage } = useLanguageStore()

  return (
    <footer className="h-9 bg-[var(--bg-surface)] border-t border-[var(--glass-border)] flex items-center justify-between px-4 text-xs">
      {/* Left: WebSocket Status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors duration-300',
            isConnected
              ? 'bg-[var(--status-success)] animate-live-pulse'
              : 'bg-[var(--status-error)]'
          )}
        />
        <span className="text-[var(--text-muted)]">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Center: Mode Toggle */}
      <div className="flex items-center gap-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'px-3 py-1 rounded transition-all duration-200',
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

      {/* Right: Language Selector + Command Hint */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200">
              {getLanguageLabel(language)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[var(--bg-elevated)] border-[var(--glass-border)]">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'cursor-pointer',
                  language === lang && 'bg-white/5'
                )}
              >
                {getLanguageLabel(lang)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <kbd className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--text-muted)] font-mono">
          ⌘K
        </kbd>
      </div>
    </footer>
  )
}

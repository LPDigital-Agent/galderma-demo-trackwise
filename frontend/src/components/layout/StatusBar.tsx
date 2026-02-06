// ============================================
// Galderma TrackWise AI Autopilot Demo
// StatusBar Component - Apple Liquid Glass Utility Bar
// ============================================

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { statusBar as t, languageLabels } from '@/i18n'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useModeStore } from '@/stores/modeStore'
import { useTimelineStore } from '@/stores/timelineStore'
import type { ExecutionMode, Language } from '@/types'

const MODES: { value: ExecutionMode; label: string }[] = [
  { value: 'OBSERVE', label: t.modes.OBSERVE },
  { value: 'TRAIN', label: t.modes.TRAIN },
  { value: 'ACT', label: t.modes.ACT },
]

const LANGUAGES: Language[] = ['AUTO', 'PT', 'EN', 'ES', 'FR']

export function StatusBar() {
  const isConnected = useTimelineStore((state) => state.isConnected)
  const { mode, setMode } = useModeStore()
  const { language, setLanguage } = useLanguageStore()

  return (
    <footer
      className={cn(
        'glass-pill fixed bottom-[var(--float-margin)] z-30 flex min-h-[var(--status-height)] items-center px-3 md:px-4 lg:px-5',
        'left-[var(--float-margin)] right-[var(--float-margin)]',
        'lg:left-[calc(var(--sidebar-width)+var(--float-margin)*2)]'
      )}
    >
      <div className="flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap">
        <div className="inline-flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'inline-flex h-2 w-2 rounded-full transition-colors duration-300',
              isConnected ? 'bg-[var(--status-success)] animate-live-pulse' : 'bg-[var(--status-error)]'
            )}
          />
          <span className="text-sm font-medium text-[var(--lg-text-secondary)]">
            {isConnected ? t.connected : t.disconnected}
          </span>
        </div>

        <div className="h-4 w-px bg-white/15" />

        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/6 p-1">
          {MODES.map((modeItem) => (
            <button
              key={modeItem.value}
              type="button"
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                mode === modeItem.value
                  ? 'bg-[var(--system-blue)] text-white shadow-[0_4px_12px_rgba(0,122,255,0.35)]'
                  : 'text-[var(--lg-text-tertiary)] hover:text-[var(--lg-text-secondary)] hover:bg-white/8'
              )}
              onClick={() => setMode(modeItem.value)}
            >
              {modeItem.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/15" />

        <div className="inline-flex shrink-0 items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-sm font-medium text-[var(--lg-text-secondary)] transition-colors hover:text-[var(--lg-text-primary)] hover:bg-white/10"
              >
                {languageLabels[language]}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {LANGUAGES.map((languageItem) => (
                <DropdownMenuItem
                  key={languageItem}
                  onClick={() => setLanguage(languageItem)}
                  className={cn('cursor-pointer', language === languageItem ? 'bg-white/12' : undefined)}
                >
                  {languageLabels[languageItem]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <kbd className="rounded-lg border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-[11px] text-[var(--lg-text-tertiary)]">
            ⌘K
          </kbd>
        </div>
      </div>
    </footer>
  )
}

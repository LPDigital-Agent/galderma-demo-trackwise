// ============================================
// Galderma TrackWise AI Autopilot Demo
// StatusBar Component - Persistent Liquid Glass Utility Bar
// ============================================

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { statusBar as t, languageLabels } from '@/i18n'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useModeStore } from '@/stores/modeStore'
import { useTimelineStore } from '@/stores/timelineStore'
import type { ExecutionMode, Language } from '@/types'

const MODES: { value: ExecutionMode; label: string; color: string }[] = [
  { value: 'OBSERVE', label: t.modes.OBSERVE, color: 'var(--mode-observe)' },
  { value: 'TRAIN', label: t.modes.TRAIN, color: 'var(--mode-train)' },
  { value: 'ACT', label: t.modes.ACT, color: 'var(--mode-act)' },
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

        <div className="h-4 w-px bg-white/60" />

        <div className="glass-control inline-flex shrink-0 items-center gap-1 rounded-full p-1">
          {MODES.map((modeItem) => (
            <button
              key={modeItem.value}
              type="button"
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-[220ms]',
                mode === modeItem.value
                  ? 'text-white shadow-[0_10px_18px_rgba(20,26,40,0.26)]'
                  : 'text-[var(--lg-text-tertiary)] hover:text-[var(--lg-text-secondary)]'
              )}
              style={
                mode === modeItem.value
                  ? {
                      background:
                        modeItem.value === 'ACT'
                          ? 'linear-gradient(135deg, #5aa8ff 0%, #2464d7 100%)'
                          : modeItem.value === 'TRAIN'
                            ? 'linear-gradient(135deg, #f1b45b 0%, #dc7e2f 100%)'
                            : 'linear-gradient(135deg, #8f98a8 0%, #6f7c92 100%)',
                    }
                  : undefined
              }
              onClick={() => setMode(modeItem.value)}
            >
              {modeItem.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/60" />

        <div className="inline-flex shrink-0 items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="glass-control rounded-full px-3 py-1 text-sm font-medium text-[var(--lg-text-secondary)] transition-colors hover:text-[var(--lg-text-primary)]"
              >
                {languageLabels[language]}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {LANGUAGES.map((languageItem) => (
                <DropdownMenuItem
                  key={languageItem}
                  onClick={() => setLanguage(languageItem)}
                  className={cn('cursor-pointer', language === languageItem ? 'bg-white/55' : undefined)}
                >
                  {languageLabels[languageItem]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <kbd className="rounded-xl border border-white/65 bg-white/38 px-2 py-0.5 font-mono text-[11px] text-[var(--lg-text-tertiary)]">
            ⌘K
          </kbd>
        </div>
      </div>
    </footer>
  )
}

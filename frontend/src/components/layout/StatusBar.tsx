// ============================================
// Galderma TrackWise AI Autopilot Demo
// StatusBar Component - Minimal Utility Bar
// ============================================

import { cn } from '@/lib/utils'

export function StatusBar() {
  return (
    <footer
      className={cn(
        'glass-pill fixed bottom-[var(--float-margin)] z-30 flex min-h-[var(--status-height)] items-center justify-center px-4',
        'left-[var(--float-margin)] right-[var(--float-margin)]',
        'lg:left-[calc(var(--sidebar-width)+var(--float-margin)*2)]'
      )}
    >
      <kbd className="rounded-lg border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-[11px] text-[var(--lg-text-tertiary)]">
        ⌘K
      </kbd>
    </footer>
  )
}

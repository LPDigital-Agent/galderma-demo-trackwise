// ============================================
// Galderma TrackWise AI Autopilot Demo
// CommandPalette Component - Cmd+K Search/Navigation
// ============================================

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Activity, FileText, Network, Brain, BookOpen, Package, RotateCcw, PlusCircle, FileBox, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { commandPalette as t, sidebar } from '@/i18n'
import { useSidebarStore } from '@/stores'

const PAGES = [
  { icon: Activity, label: sidebar.nav.agentRoom, route: '/agent-room' },
  { icon: FileText, label: sidebar.nav.cases, route: '/cases' },
  { icon: Network, label: sidebar.nav.network, route: '/network' },
  { icon: Brain, label: sidebar.nav.memory, route: '/memory' },
  { icon: BookOpen, label: sidebar.nav.ledger, route: '/ledger' },
  { icon: Package, label: sidebar.nav.csvPack, route: '/csv-pack' },
] as const

const ACTIONS = [
  { icon: PanelLeft, label: sidebar.toggleMenu, action: 'toggle-sidebar' },
  { icon: RotateCcw, label: t.actionLabels.resetDemo, action: 'reset' },
  { icon: PlusCircle, label: t.actionLabels.createCase, action: 'create' },
  { icon: FileBox, label: t.actionLabels.generateCsv, action: 'csv' },
] as const

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (value: string) => {
    // Check if it's a page navigation
    const page = PAGES.find((p) => p.route === value)
    if (page) {
      navigate(value)
      setIsOpen(false)
      return
    }

    // Handle actions
    switch (value) {
      case 'toggle-sidebar':
        useSidebarStore.getState().toggle()
        break
      case 'reset':
        toast.success(t.toasts.resetRequested)
        break
      case 'create':
        navigate('/cases')
        toast.info(t.toasts.openingCreate)
        break
      case 'csv':
        navigate('/csv-pack')
        toast.info(t.toasts.openingCsv)
        break
    }
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="mx-auto mt-[15vh] max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className={cn(
            'rounded-2xl overflow-hidden',
            'bg-[var(--glass-bg)] backdrop-blur-3xl border-[0.5px] border-[var(--glass-border)]',
            'shadow-[var(--shadow-elevated)]'
          )}
        >
          <Command.Input
            placeholder={t.searchPlaceholder}
            className={cn(
              'w-full px-4 py-3 text-sm',
              'bg-transparent border-b border-[var(--glass-border)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'outline-none'
            )}
          />

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
              {t.noResults}
            </Command.Empty>

            {/* Pages Group */}
            <Command.Group
              heading={t.pages}
              className="text-xs text-[var(--text-muted)] px-2 py-1.5 font-medium"
            >
              {PAGES.map(({ icon: Icon, label, route }) => (
                <Command.Item
                  key={route}
                  value={route}
                  onSelect={handleSelect}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                    'text-sm text-[var(--text-secondary)]',
                    'hover:bg-white/20 hover:text-[var(--text-primary)]',
                    'transition-colors duration-150',
                    'aria-selected:bg-white/25 aria-selected:text-[var(--text-primary)]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Actions Group */}
            <Command.Group
              heading={t.actions}
              className="text-xs text-[var(--text-muted)] px-2 py-1.5 font-medium mt-2"
            >
              {ACTIONS.map(({ icon: Icon, label, action }) => (
                <Command.Item
                  key={action}
                  value={action}
                  onSelect={handleSelect}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                    'text-sm text-[var(--text-secondary)]',
                    'hover:bg-white/20 hover:text-[var(--text-primary)]',
                    'transition-colors duration-150',
                    'aria-selected:bg-white/25 aria-selected:text-[var(--text-primary)]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

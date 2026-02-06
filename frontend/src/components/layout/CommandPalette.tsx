// ============================================
// Galderma TrackWise AI Autopilot Demo
// CommandPalette Component - Cmd+K Search/Navigation
// ============================================

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { FileText, Brain, BookOpen, RotateCcw, PlusCircle, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { commandPalette as t, sidebar } from '@/i18n'
import { useSidebarStore } from '@/stores'

const PAGES = [
  { icon: FileText, label: sidebar.nav.cases, route: '/cases' },
  { icon: Brain, label: sidebar.nav.memory, route: '/memory' },
  { icon: BookOpen, label: sidebar.nav.ledger, route: '/ledger' },
] as const

const ACTIONS = [
  { icon: PanelLeft, label: sidebar.toggleMenu, action: 'toggle-sidebar' },
  { icon: RotateCcw, label: t.actionLabels.resetDemo, action: 'reset' },
  { icon: PlusCircle, label: t.actionLabels.createCase, action: 'create' },
] as const

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

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
    const page = PAGES.find((p) => p.route === value)
    if (page) {
      navigate(value)
      setIsOpen(false)
      return
    }

    switch (value) {
      case 'toggle-sidebar':
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          useSidebarStore.getState().toggle()
        }
        break
      case 'reset':
        toast.success(t.toasts.resetRequested)
        break
      case 'create':
        navigate('/cases')
        toast.info(t.toasts.openingCreate)
        break
    }
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-lg animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="mx-auto mt-[15vh] max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className={cn(
            'rounded-2xl overflow-hidden',
            'bg-white/12 backdrop-blur-3xl border-[0.5px] border-white/20',
            'shadow-[var(--shadow-elevated)]'
          )}
        >
          <Command.Input
            placeholder={t.searchPlaceholder}
            className={cn(
              'w-full px-4 py-3.5 text-sm',
              'bg-transparent border-b border-white/12',
              'text-[var(--lg-text-primary)] placeholder:text-[var(--lg-text-tertiary)]',
              'outline-none'
            )}
          />

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--lg-text-tertiary)]">
              {t.noResults}
            </Command.Empty>

            <Command.Group
              heading={t.pages}
              className="text-xs text-[var(--lg-text-tertiary)] px-2 py-1.5 font-medium"
            >
              {PAGES.map(({ icon: Icon, label, route }) => (
                <Command.Item
                  key={route}
                  value={route}
                  onSelect={handleSelect}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                    'text-sm text-[var(--lg-text-secondary)]',
                    'hover:bg-white/10 hover:text-[var(--lg-text-primary)]',
                    'transition-colors duration-150',
                    'aria-selected:bg-white/15 aria-selected:text-[var(--lg-text-primary)]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading={t.actions}
              className="text-xs text-[var(--lg-text-tertiary)] px-2 py-1.5 font-medium mt-2"
            >
              {ACTIONS.map(({ icon: Icon, label, action }) => (
                <Command.Item
                  key={action}
                  value={action}
                  onSelect={handleSelect}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                    'text-sm text-[var(--lg-text-secondary)]',
                    'hover:bg-white/10 hover:text-[var(--lg-text-primary)]',
                    'transition-colors duration-150',
                    'aria-selected:bg-white/15 aria-selected:text-[var(--lg-text-primary)]'
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

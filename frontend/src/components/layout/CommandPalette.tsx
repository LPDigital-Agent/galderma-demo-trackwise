// ============================================
// Galderma TrackWise AI Autopilot Demo
// CommandPalette Component - Cmd+K Search/Navigation
// ============================================

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Activity, FileText, Network, Brain, BookOpen, Package, RotateCcw, PlusCircle, FileBox } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

const PAGES = [
  { icon: Activity, label: 'Agent Room', route: '/agent-room' },
  { icon: FileText, label: 'Cases', route: '/cases' },
  { icon: Network, label: 'Network', route: '/network' },
  { icon: Brain, label: 'Memory', route: '/memory' },
  { icon: BookOpen, label: 'Ledger', route: '/ledger' },
  { icon: Package, label: 'CSV Pack', route: '/csv-pack' },
] as const

const ACTIONS = [
  { icon: RotateCcw, label: 'Reset Demo', action: 'reset' },
  { icon: PlusCircle, label: 'Create Case', action: 'create' },
  { icon: FileBox, label: 'Generate CSV Pack', action: 'csv' },
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
      case 'reset':
        toast.success('Demo reset requested')
        // In production, this would call an API endpoint
        break
      case 'create':
        navigate('/cases')
        toast.info('Opening case creation')
        break
      case 'csv':
        navigate('/csv-pack')
        toast.info('Opening CSV Pack generator')
        break
    }
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="mx-auto mt-[15vh] max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className={cn(
            'rounded-xl overflow-hidden',
            'bg-[var(--bg-elevated)] border border-[var(--glass-border)]',
            'shadow-[var(--shadow-elevated)]'
          )}
        >
          <Command.Input
            placeholder="Search pages and actions..."
            className={cn(
              'w-full px-4 py-3 text-sm',
              'bg-transparent border-b border-[var(--glass-border)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'outline-none'
            )}
          />

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
              No results found.
            </Command.Empty>

            {/* Pages Group */}
            <Command.Group
              heading="Pages"
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
                    'hover:bg-white/5 hover:text-[var(--text-primary)]',
                    'transition-colors duration-150',
                    'aria-selected:bg-white/5 aria-selected:text-[var(--text-primary)]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Actions Group */}
            <Command.Group
              heading="Actions"
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
                    'hover:bg-white/5 hover:text-[var(--text-primary)]',
                    'transition-colors duration-150',
                    'aria-selected:bg-white/5 aria-selected:text-[var(--text-primary)]'
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

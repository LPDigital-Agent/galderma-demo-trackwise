// ============================================
// Galderma TrackWise AI Autopilot Demo
// Sidebar Component - Liquid Glass Floating Panel
// ============================================

import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, FileText, Network, Brain, BookOpen, Package, ChevronLeft, ChevronRight } from 'lucide-react'

import { useSidebarStore } from '@/stores'
import { cn } from '@/lib/utils'
import { sidebar as t } from '@/i18n'

const NAV_ITEMS = [
  { icon: Activity, label: t.nav.agentRoom, route: '/agent-room' },
  { icon: FileText, label: t.nav.cases, route: '/cases' },
  { icon: Network, label: t.nav.network, route: '/network' },
  { icon: Brain, label: t.nav.memory, route: '/memory' },
  { icon: BookOpen, label: t.nav.ledger, route: '/ledger' },
  { icon: Package, label: t.nav.csvPack, route: '/csv-pack' },
] as const

const sidebarSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

export function Sidebar() {
  const { isOpen, close, toggle } = useSidebarStore()

  // Escape key closes sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={sidebarSpring}
            className={cn(
              'fixed top-0 left-0 z-40',
              'm-[var(--float-margin)]',
              'h-[calc(100vh-var(--float-margin)*2)]',
              'w-60',
              'glass-float-sidebar',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <div className="flex flex-col">
                <img
                  src="/assets/galderma-logo.svg"
                  alt="Galderma"
                  className="h-7 object-contain object-left"
                />
                <span className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t.subtitle}
                </span>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                aria-label={t.collapseSidebar}
              >
                <ChevronLeft className="h-4 w-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-2 px-3">
              <ul className="space-y-1">
                {NAV_ITEMS.map(({ icon: Icon, label, route }) => (
                  <li key={route}>
                    <NavLink
                      to={route}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                          'transition-all duration-200',
                          'text-sm font-medium',
                          isActive
                            ? 'bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)]'
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-5 pb-5 pt-2">
              <div className="text-[10px] text-[var(--text-muted)] text-center">
                TrackWise AI Autopilot
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating trigger button when sidebar is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={toggle}
            className="fixed top-[var(--float-margin)] left-[var(--float-margin)] z-40 w-11 h-11 glass-trigger flex items-center justify-center"
            aria-label={t.openMenu}
          >
            <ChevronRight className="h-5 w-5 text-[var(--text-secondary)]" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}

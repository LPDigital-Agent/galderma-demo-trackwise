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

interface SidebarBodyProps {
  onNavigate?: () => void
  onClose?: () => void
  showCloseButton?: boolean
}

function SidebarBody({ onNavigate, onClose, showCloseButton = false }: SidebarBodyProps) {
  return (
    <>
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
        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/45 transition-colors"
            aria-label={t.collapseSidebar}
          >
            <ChevronLeft className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-2 px-3">
        <ul className="space-y-1.5">
          {NAV_ITEMS.map(({ icon: Icon, label, route }) => (
            <li key={route}>
              <NavLink
                to={route}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-2xl',
                    'transition-all duration-200',
                    'text-sm font-medium',
                    isActive
                      ? 'bg-[var(--brand-primary)]/18 text-[var(--brand-secondary)] liquid-accent-ring'
                      : 'text-[var(--text-secondary)] hover:bg-white/35 hover:text-[var(--text-primary)]'
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

      <div className="px-5 pb-5 pt-2">
        <div className="text-[10px] text-[var(--text-muted)] text-center">
          TrackWise AI Autopilot
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const { isOpen, close, toggle } = useSidebarStore()

  // Escape key closes mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  const closeOnMobileNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      close()
    }
  }

  return (
    <>
      {/* Desktop sidebar: always visible */}
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 left-0 z-40',
          'm-[var(--float-margin)]',
          'h-[calc(100vh-var(--float-margin)*2)]',
          'w-[var(--sidebar-width)]',
          'glass-float-sidebar',
          'flex-col'
        )}
      >
        <SidebarBody onNavigate={closeOnMobileNavigate} />
      </aside>

      {/* Mobile sidebar: toggleable overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm lg:hidden"
            onClick={close}
          >
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={sidebarSpring}
              className={cn(
                'm-[var(--float-margin)]',
                'h-[calc(100vh-var(--float-margin)*2)]',
                'w-[min(86vw,var(--sidebar-width))]',
                'glass-float-sidebar',
                'flex flex-col'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarBody
                onNavigate={closeOnMobileNavigate}
                onClose={close}
                showCloseButton
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile floating trigger button when sidebar is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={toggle}
            className="fixed top-[var(--float-margin)] left-[var(--float-margin)] z-50 w-11 h-11 glass-trigger flex items-center justify-center lg:hidden"
            aria-label={t.openMenu}
          >
            <ChevronRight className="h-5 w-5 text-[var(--text-secondary)]" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// Sidebar Component - Apple Liquid Glass Navigation
// ============================================

import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Brain, BookOpen, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

import { sidebar as t } from '@/i18n'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores'

const NAV_ITEMS = [
  { icon: FileText, label: t.nav.cases, route: '/cases' },
  { icon: Brain, label: t.nav.memory, route: '/memory' },
  { icon: BookOpen, label: t.nav.ledger, route: '/ledger' },
] as const

const sidebarSpring = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 34,
  mass: 0.5,
}

interface SidebarBodyProps {
  onNavigate?: () => void
  onClose?: () => void
  showCloseButton?: boolean
}

function SidebarBody({ onNavigate, onClose, showCloseButton = false }: SidebarBodyProps) {
  return (
    <>
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center rounded-2xl border border-white/15 bg-white/8 px-4 py-2">
              <span className="text-[1.35rem] tracking-[0.18em] text-white font-normal" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                GALDERMA
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--lg-text-tertiary)]">TrackWise</p>
              <p className="text-sm font-semibold text-[var(--lg-text-primary)]">{t.subtitle}</p>
            </div>
          </div>

          {showCloseButton ? (
            <button
              onClick={onClose}
              className="glass-control flex h-8 w-8 items-center justify-center rounded-full"
              aria-label={t.collapseSidebar}
            >
              <ChevronLeft className="h-4 w-4 text-[var(--lg-text-secondary)]" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ icon: Icon, label, route }) => (
            <li key={route}>
              <NavLink
                to={route}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                    isActive
                      ? 'bg-white/18 text-[var(--lg-text-primary)] shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'text-[var(--lg-text-secondary)] hover:bg-white/10 hover:text-[var(--lg-text-primary)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
                        isActive
                          ? 'border-white/25 bg-white/15'
                          : 'border-white/10 bg-white/6 group-hover:border-white/18 group-hover:bg-white/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          isActive ? 'text-[var(--system-blue)]' : 'text-[var(--lg-text-secondary)]'
                        )}
                      />
                    </span>
                    <span className="truncate text-[0.94rem] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-5 pb-5 pt-2">
        <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-center">
          <p className="text-xs font-medium text-[var(--lg-text-secondary)]">TrackWise AI Autopilot</p>
          <p className="text-[11px] text-[var(--lg-text-tertiary)]">Liquid Glass v3</p>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const { isOpen, close, toggle } = useSidebarStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  const closeOnMobileNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      close()
    }
  }

  return (
    <>
      <aside
        className={cn(
          'glass-sidebar fixed left-0 top-0 z-40 hidden h-[calc(100vh-var(--float-margin)*2)] w-[var(--sidebar-width)] flex-col overflow-hidden lg:flex',
          'm-[var(--float-margin)]'
        )}
      >
        <SidebarBody onNavigate={closeOnMobileNavigate} />
      </aside>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.aside
              className="glass-sidebar m-[var(--float-margin)] flex h-[calc(100vh-var(--float-margin)*2)] w-[min(86vw,var(--sidebar-width))] flex-col overflow-hidden"
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={sidebarSpring}
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarBody onNavigate={closeOnMobileNavigate} onClose={close} showCloseButton />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            type="button"
            className="glass-control fixed left-[var(--float-margin)] top-[var(--float-margin)] z-50 flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={sidebarSpring}
            onClick={toggle}
            aria-label={t.openMenu}
          >
            <ChevronRight className="h-5 w-5 text-[var(--lg-text-secondary)]" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  )
}

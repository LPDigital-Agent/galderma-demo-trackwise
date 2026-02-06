// ============================================
// Galderma TrackWise AI Autopilot Demo
// Sidebar Component - Linear/Cursor-inspired Navigation
// ============================================

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, FileText, Network, Brain, BookOpen, Package, ChevronLeft, ChevronRight } from 'lucide-react'

import { useTimelineStore } from '@/stores'
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

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isConnected = useTimelineStore((s) => s.isConnected)

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-[var(--bg-surface)] border-r border-[var(--glass-border)]',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-[var(--glass-border)]">
        {isCollapsed ? (
          <span className="text-[var(--brand-primary)] font-bold text-lg mx-auto" style={{ fontFamily: 'Georgia, Cambria, serif' }}>G</span>
        ) : (
          <div className="flex flex-col overflow-hidden">
            <img
              src="/assets/galderma-logo.svg"
              alt="Galderma"
              className="h-7 object-contain object-left"
            />
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
              {t.subtitle}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ icon: Icon, label, route }) => (
            <li key={route}>
              <NavLink
                to={route}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    'text-sm font-medium',
                    isActive
                      ? 'bg-black/5 border-l-2 border-[var(--brand-primary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-black/[0.02] hover:text-[var(--text-primary)] border-l-2 border-transparent'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate transition-opacity duration-300">
                    {label}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[var(--glass-border)] px-4 py-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-300',
              isConnected
                ? 'bg-[var(--status-success)] animate-live-pulse'
                : 'bg-[var(--status-error)]'
            )}
          />
          {!isCollapsed && (
            <span className="text-xs text-[var(--text-muted)]">
              {isConnected ? t.live : t.offline}
            </span>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
            'text-xs text-[var(--text-muted)]',
            'hover:bg-black/[0.02] hover:text-[var(--text-secondary)]',
            'transition-colors duration-200',
            isCollapsed && 'justify-center'
          )}
          aria-label={isCollapsed ? t.expandSidebar : t.collapseSidebar}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>{t.collapse}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

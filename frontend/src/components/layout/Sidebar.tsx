// ============================================
// Galderma TrackWise AI Autopilot Demo
// Sidebar Component - Linear/Cursor-inspired Navigation
// ============================================

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, FileText, Network, Brain, BookOpen, Package, Cpu, ChevronLeft, ChevronRight } from 'lucide-react'

import { useTimelineStore } from '@/stores'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: Activity, label: 'Agent Room', route: '/agent-room' },
  { icon: FileText, label: 'Cases', route: '/cases' },
  { icon: Network, label: 'Network', route: '/network' },
  { icon: Brain, label: 'Memory', route: '/memory' },
  { icon: BookOpen, label: 'Ledger', route: '/ledger' },
  { icon: Package, label: 'CSV Pack', route: '/csv-pack' },
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
        <Cpu className="h-8 w-8 text-[var(--brand-primary)] shrink-0" />
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-gradient text-sm font-semibold whitespace-nowrap">
              TrackWise AI
            </span>
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
              Autopilot
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
                      ? 'bg-white/5 border-l-2 border-[var(--brand-primary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-white/[0.02] hover:text-[var(--text-primary)] border-l-2 border-transparent'
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
              {isConnected ? 'Live' : 'Offline'}
            </span>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
            'text-xs text-[var(--text-muted)]',
            'hover:bg-white/[0.02] hover:text-[var(--text-secondary)]',
            'transition-colors duration-200',
            isCollapsed && 'justify-center'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

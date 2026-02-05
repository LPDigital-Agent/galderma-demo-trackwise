// ============================================
// Galderma TrackWise AI Autopilot Demo
// TopBar Component — Liquid Glass Navigation
// ============================================

import { NavLink } from 'react-router-dom'
import { Activity, Network, Brain, BookOpen, FileText, Package } from 'lucide-react'
import { ModeToggle, LanguageToggle } from '@/components/ui'
import { useWebSocket } from '@/hooks'
import { cn } from '@/lib/utils'

/**
 * TopBar Component
 *
 * Liquid Glass navigation bar with pill-shaped tab group.
 * The nav items sit inside a subtle container pill, with
 * the active tab rendered as a white raised pill.
 */
export function TopBar() {
  const { isConnected } = useWebSocket()

  const navLinks = [
    { to: '/agent-room', label: 'Agent Room', icon: Activity },
    { to: '/cases', label: 'Cases', icon: FileText },
    { to: '/network', label: 'Network', icon: Network },
    { to: '/memory', label: 'Memory', icon: Brain },
    { to: '/ledger', label: 'Ledger', icon: BookOpen },
    { to: '/csv-pack', label: 'CSV Pack', icon: Package },
  ]

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.5)]"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[var(--border-radius-sm)]"
              style={{
                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
              }}
            >
              <span className="text-sm font-bold text-white">G</span>
            </div>
            <h1 className="flex flex-col leading-none">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-[var(--text-secondary)]">
                GALDERMA
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                TrackWise AI
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Glass Pill Navigation */}
        <nav
          className="flex items-center gap-0.5 rounded-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)] p-1"
          aria-label="Main navigation"
        >
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5',
                  'text-xs font-medium leading-tight',
                  'rounded-full',
                  'transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
                  isActive
                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(0,0,0,0.04)]'
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status Pill */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              'bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.06)]',
              'backdrop-blur-sm'
            )}
            title={isConnected ? 'Connected to WebSocket' : 'Disconnected'}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full transition-colors duration-300',
                isConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-error)]'
              )}
            />
            <span className="hidden text-xs font-medium text-[var(--text-secondary)] sm:inline">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Mode Toggle */}
          <ModeToggle />

          {/* Language Toggle */}
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

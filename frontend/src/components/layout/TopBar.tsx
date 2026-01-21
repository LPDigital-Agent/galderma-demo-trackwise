// ============================================
// Galderma TrackWise AI Autopilot Demo
// TopBar Component - Navigation Bar
// ============================================

import { NavLink } from 'react-router-dom'
import { Activity, Network, Brain, BookOpen, FileText, Package } from 'lucide-react'
import { ModeToggle, LanguageToggle } from '@/components/ui'
import { useWebSocket } from '@/hooks'
import { cn } from '@/lib/utils'

/**
 * TopBar Component
 *
 * Main navigation bar with glassmorphism design.
 * Includes logo, navigation links, and utility controls.
 *
 * Features:
 * - Sticky positioning at top
 * - Glass effect with backdrop blur
 * - Active link highlighting
 * - Connection status indicator
 * - Mode and language toggles
 *
 * Accessibility:
 * - Keyboard navigable (Tab)
 * - Active link indication via aria-current
 * - Proper heading hierarchy (h1 for logo)
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
      className="sticky top-0 z-50 w-full border-b border-[var(--glass-border)]"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[var(--border-radius-sm)]"
              style={{
                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
              }}
            >
              <span className="text-sm font-bold text-white">G</span>
            </div>
            <h1 className="flex flex-col leading-none">
              <span className="text-xs font-semibold tracking-wider text-[var(--text-secondary)]">
                GALDERMA
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                TrackWise AI
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--border-radius-sm)]',
                  'transition-all duration-150',
                  'hover:bg-[var(--glass-hover)]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-border)]',
                  isActive
                    ? 'text-[var(--text-primary)] bg-[var(--glass-hover)]'
                    : 'text-[var(--text-secondary)]'
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--border-radius-sm)]"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}
            title={isConnected ? 'Connected to WebSocket' : 'Disconnected'}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full transition-colors duration-300',
                isConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-error)]'
              )}
            />
            <span className="hidden text-xs text-[var(--text-secondary)] sm:inline">
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

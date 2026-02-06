// ============================================
// Galderma TrackWise AI Autopilot Demo
// AppLayout Component - Liquid Glass Floating Layout
// ============================================

import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'

export function AppLayout() {
  // Initialize real-time sync (invalidates TanStack Query caches on WebSocket events)
  useRealtimeSync()

  const location = useLocation()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sidebar — floating overlay */}
      <Sidebar />

      {/* Main Content — offset to keep persistent menu/status visible */}
      <main
        className={`
          relative z-10 h-screen overflow-hidden
          px-[var(--float-margin)] pt-[var(--float-margin)]
          pb-[calc(var(--float-margin)+var(--status-height))]
          lg:pl-[calc(var(--float-margin)*2+var(--sidebar-width))]
        `}
      >
        <div className="h-full overflow-y-auto">
          <div
            key={location.pathname}
            className="mx-auto max-w-[1600px] min-h-full animate-fade-in"
          >
            <Outlet />
          </div>
        </div>
      </main>

      {/* StatusBar — floating glass pill */}
      <StatusBar />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Toast Notifications */}
      <Toaster theme="light" position="bottom-right" richColors />
    </div>
  )
}

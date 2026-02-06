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
    <div className="relative h-screen overflow-hidden">
      {/* Sidebar — floating overlay */}
      <Sidebar />

      {/* Main Content — full width, panels float over wallpaper */}
      <main className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div
            key={location.pathname}
            className="mx-auto max-w-7xl px-[var(--float-margin)] py-[var(--float-margin)] h-full animate-fade-in"
          >
            <Outlet />
          </div>
        </div>

        {/* StatusBar — floating glass pill */}
        <StatusBar />
      </main>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Toast Notifications */}
      <Toaster theme="light" position="bottom-right" richColors />
    </div>
  )
}

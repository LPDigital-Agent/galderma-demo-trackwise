// ============================================
// Galderma TrackWise AI Autopilot Demo
// AppLayout Component - Main Layout Wrapper
// ============================================

import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'

/**
 * AppLayout Component
 *
 * Main layout wrapper with:
 * - Sidebar navigation (collapsible)
 * - Real-time WebSocket sync (useRealtimeSync hook)
 * - Command palette (Cmd+K)
 * - Status bar (bottom)
 * - Toast notifications
 *
 * Layout:
 * - Sidebar (60px collapsed / 240px expanded)
 * - Main content area (flex-1)
 * - Status bar (fixed 36px height)
 */
export function AppLayout() {
  // Initialize real-time sync (invalidates TanStack Query caches on WebSocket events)
  useRealtimeSync()

  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Animate route transitions with key */}
          <div
            key={location.pathname}
            className="mx-auto max-w-7xl px-8 py-6 h-full animate-fade-in"
          >
            <Outlet />
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />
      </main>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Toast Notifications */}
      <Toaster theme="light" position="bottom-right" richColors />
    </div>
  )
}

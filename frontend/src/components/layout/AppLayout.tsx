// ============================================
// Galderma TrackWise AI Autopilot Demo
// AppLayout Component - Main Layout Wrapper
// ============================================

import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { useRealtimeSync } from '@/hooks'

/**
 * AppLayout Component
 *
 * Main layout wrapper for the application.
 * Includes TopBar and content area with proper spacing.
 *
 * Features:
 * - Sticky TopBar at top
 * - Scrollable content area
 * - Consistent padding
 * - Flexible height (full viewport)
 *
 * Usage:
 * Used as parent route in React Router to wrap all pages.
 */
export function AppLayout() {
  // Bridge WebSocket events to TanStack Query cache invalidation
  useRealtimeSync()

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

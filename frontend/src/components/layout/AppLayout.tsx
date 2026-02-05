// ============================================
// Galderma TrackWise AI Autopilot Demo
// AppLayout Component — Main Layout Wrapper
// ============================================

import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { useRealtimeSync } from '@/hooks'

/**
 * AppLayout Component
 *
 * Main layout wrapper with Liquid Glass page transitions.
 * Each route change triggers a subtle entrance animation.
 */
export function AppLayout() {
  const location = useLocation()

  // Bridge WebSocket events to TanStack Query cache invalidation
  useRealtimeSync()

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <div
          key={location.pathname}
          className="container mx-auto px-6 py-8 animate-liquid-in"
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}

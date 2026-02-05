// ============================================
// Galderma TrackWise AI Autopilot Demo
// App Component - Main Application
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { AgentRoom, Cases, CaseDetail, Network, Memory, Ledger, CSVPack } from '@/pages'

/**
 * App Component
 *
 * Main application component with routing.
 *
 * Routes:
 * - / - Redirects to /agent-room
 * - /agent-room - Main dashboard with timeline and stats
 * - /cases - Cases list with filtering
 * - /network - A2A network visualization
 * - /memory - Memory browser (3 strategies)
 * - /ledger - Decision ledger (audit trail)
 * - /csv-pack - CSV Pack generator (compliance docs)
 *
 * Architecture:
 * - AppLayout wraps all pages with TopBar
 * - Uses React Router v7 with nested routes
 * - All pages use glassmorphism design system
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/agent-room" replace />} />
        <Route path="agent-room" element={<AgentRoom />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:caseId" element={<CaseDetail />} />
        <Route path="network" element={<Network />} />
        <Route path="memory" element={<Memory />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="csv-pack" element={<CSVPack />} />
      </Route>
    </Routes>
  )
}

export default App

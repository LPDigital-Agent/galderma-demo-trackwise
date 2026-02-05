// ============================================
// Galderma TrackWise AI Autopilot Demo
// App Component - Main Application
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import AgentRoom from '@/pages/AgentRoom'
import Cases from '@/pages/Cases'
import CaseDetail from '@/pages/CaseDetail'
import Network from '@/pages/Network'
import Memory from '@/pages/Memory'
import Ledger from '@/pages/Ledger'
import CSVPack from '@/pages/CSVPack'

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

// ============================================
// Galderma TrackWise AI Autopilot Demo
// App Component - Main Application
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import Cases from '@/pages/Cases'
import CaseDetail from '@/pages/CaseDetail'
import Memory from '@/pages/Memory'
import Ledger from '@/pages/Ledger'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/cases" replace />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:caseId" element={<CaseDetail />} />
        <Route path="memory" element={<Memory />} />
        <Route path="ledger" element={<Ledger />} />
      </Route>
    </Routes>
  )
}

export default App

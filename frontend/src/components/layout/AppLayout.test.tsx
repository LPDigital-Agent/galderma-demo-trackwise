import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { useTimelineStore } from '@/stores'
import { AppLayout } from './AppLayout'

vi.mock('@/hooks', () => ({
  useExecutiveStats: () => ({
    data: {
      ai_closed_count: 5,
      human_hours_saved: 12,
      risks_avoided: 3,
      total_cases: 10,
      open_cases: 4,
      closed_cases: 6,
    },
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useRealtimeSync', () => ({
  useRealtimeSync: () => undefined,
}))

function AgentRoomStub() {
  return (
    <div>
      <p>Agent room content</p>
      <Link to="/cases">Go to cases</Link>
    </div>
  )
}

function CasesStub() {
  return <p>Cases content</p>
}

describe('AppLayout shell persistence', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      events: [
        {
          type: 'system_message',
          timestamp: new Date().toISOString(),
          message: 'Evento de teste',
        },
      ],
      isConnected: true,
      autoScroll: true,
      filter: null,
    })
  })

  it('keeps global KPI deck and live strip visible', () => {
    render(
      <MemoryRouter initialEntries={['/agent-room']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="agent-room" element={<AgentRoomStub />} />
            <Route path="cases" element={<CasesStub />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Fluxo em Tempo Real')).toBeInTheDocument()
    expect(screen.getByText('Fechados por IA')).toBeInTheDocument()
    expect(screen.getByText('Agent room content')).toBeInTheDocument()
  })

  it('hides global rail when navigating to cases', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/agent-room']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="agent-room" element={<AgentRoomStub />} />
            <Route path="cases" element={<CasesStub />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('link', { name: 'Go to cases' }))

    expect(screen.getByText('Cases content')).toBeInTheDocument()
    expect(screen.queryByText('Fluxo em Tempo Real')).not.toBeInTheDocument()
    expect(screen.queryByText('Fechados por IA')).not.toBeInTheDocument()
  })
})

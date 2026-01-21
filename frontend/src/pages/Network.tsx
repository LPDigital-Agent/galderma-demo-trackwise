// ============================================
// Galderma TrackWise AI Autopilot Demo
// Network Page - A2A Network Visualization
// ============================================

import { Network as NetworkIcon, Circle } from 'lucide-react'
import { GlassCard } from '@/components/ui'
import { AGENTS } from '@/types'
import { useWebSocket } from '@/hooks'

/**
 * Network Page
 *
 * Visualize the A2A (Agent-to-Agent) network.
 *
 * Features:
 * - Force-directed graph visualization (placeholder)
 * - Agent cards with colors and models
 * - Connection status
 * - Interactive graph (future)
 *
 * Future:
 * - react-force-graph-2d integration
 * - Real-time agent communication visualization
 * - Click to inspect agent details
 */
export function Network() {
  const { isConnected } = useWebSocket()

  const agentList = Object.values(AGENTS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">A2A Network</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Agent-to-Agent communication mesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Circle
            className={`h-3 w-3 ${isConnected ? 'fill-[var(--status-success)]' : 'fill-[var(--status-error)]'}`}
          />
          <span className="text-sm text-[var(--text-secondary)]">
            {isConnected ? '9 agents online' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Graph Placeholder */}
      <GlassCard className="aspect-video">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <NetworkIcon className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Network graph visualization coming soon
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Will use react-force-graph-2d for interactive A2A mesh
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Agent Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Agents</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentList.map((agent) => (
            <GlassCard key={agent.name} variant="hover">
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 flex-shrink-0 rounded-[var(--border-radius-sm)]"
                  style={{
                    background: `${agent.color}20`,
                    border: `2px solid ${agent.color}`,
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {agent.displayName}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: agent.model === 'OPUS' ? '#EF444420' : '#06B6D420',
                        color: agent.model === 'OPUS' ? '#EF4444' : '#06B6D4',
                      }}
                    >
                      {agent.model}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{agent.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}

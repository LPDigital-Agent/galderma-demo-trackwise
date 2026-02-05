// ============================================
// Galderma TrackWise AI Autopilot Demo
// Network Page - A2A Network Visualization
// ============================================

import { useRef, useCallback, useMemo, useEffect } from 'react'
import { Circle } from 'lucide-react'
import ForceGraph2D from 'react-force-graph-2d'
import { GlassCard, Badge } from '@/components/ui'
import { AGENTS } from '@/types'
import { useWebSocket } from '@/hooks'
import type { AgentName } from '@/types'

// A2A communication edges (the real agent-to-agent call graph)
const A2A_EDGES: { source: AgentName; target: AgentName; label: string }[] = [
  { source: 'observer', target: 'case_understanding', label: 'routes event' },
  { source: 'case_understanding', target: 'recurring_detector', label: 'CaseAnalysis' },
  { source: 'recurring_detector', target: 'compliance_guardian', label: 'PatternResult' },
  { source: 'compliance_guardian', target: 'resolution_composer', label: 'ComplianceDecision' },
  { source: 'resolution_composer', target: 'writeback', label: 'ResolutionPackage' },
  { source: 'writeback', target: 'memory_curator', label: 'success log' },
  { source: 'observer', target: 'inquiry_bridge', label: 'FactoryComplaintClosed' },
  { source: 'inquiry_bridge', target: 'writeback', label: 'cascade close' },
  { source: 'writeback', target: 'csv_pack', label: 'trigger pack' },
]

interface GraphNode {
  id: string
  name: string
  displayName: string
  model: 'OPUS' | 'HAIKU'
  color: string
  description: string
  // Added by force-graph simulation at runtime
  x?: number
  y?: number
}

interface GraphLink {
  source: string
  target: string
  label: string
}

/**
 * Network Page
 *
 * Interactive force-directed graph showing the 9-agent A2A mesh.
 * Nodes are agents (color-coded, sized by model importance).
 * Edges are A2A communication channels with directional arrows.
 */
export function Network() {
  const { isConnected } = useWebSocket()
  const graphRef = useRef<ReturnType<typeof ForceGraph2D> | null>(null)

  const agentList = Object.values(AGENTS)

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = agentList.map((agent) => ({
      id: agent.name,
      name: agent.name,
      displayName: agent.displayName,
      model: agent.model,
      color: agent.color,
      description: agent.description,
    }))

    const links: GraphLink[] = A2A_EDGES.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.label,
    }))

    return { nodes, links }
  }, [agentList])

  // Custom node rendering on canvas
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = node.model === 'OPUS' ? 8 : 6
      const fontSize = 12 / globalScale
      const x = node.x ?? 0
      const y = node.y ?? 0

      // Glow effect
      ctx.shadowColor = node.color
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fillStyle = node.color
      ctx.fill()
      ctx.shadowBlur = 0

      // Border ring for OPUS agents
      if (node.model === 'OPUS') {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Label
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(node.displayName, x, y + size + 3)

      // Model badge
      if (globalScale > 0.8) {
        const badgeText = node.model
        ctx.font = `${fontSize * 0.7}px sans-serif`
        ctx.fillStyle = node.model === 'OPUS' ? 'rgba(239,68,68,0.8)' : 'rgba(6,182,212,0.5)'
        ctx.fillText(badgeText, x, y + size + 3 + fontSize + 2)
      }
    },
    []
  )

  // Custom link rendering
  const paintLink = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = link.source as unknown as GraphNode
      const target = link.target as unknown as GraphNode
      if (!source.x || !target.x) return

      // Draw line
      ctx.beginPath()
      ctx.moveTo(source.x, source.y ?? 0)
      ctx.lineTo(target.x, target.y ?? 0)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw arrow
      const dx = (target.x) - (source.x)
      const dy = (target.y ?? 0) - (source.y ?? 0)
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len === 0) return
      const nx = dx / len
      const ny = dy / len
      const arrowSize = 4
      const arrowX = (target.x) - nx * 10
      const arrowY = (target.y ?? 0) - ny * 10

      ctx.beginPath()
      ctx.moveTo(arrowX, arrowY)
      ctx.lineTo(arrowX - nx * arrowSize + ny * arrowSize * 0.5, arrowY - ny * arrowSize - nx * arrowSize * 0.5)
      ctx.lineTo(arrowX - nx * arrowSize - ny * arrowSize * 0.5, arrowY - ny * arrowSize + nx * arrowSize * 0.5)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fill()

      // Label on hover scale
      if (globalScale > 1.2) {
        const midX = ((source.x) + (target.x)) / 2
        const midY = ((source.y ?? 0) + (target.y ?? 0)) / 2
        ctx.font = `${8 / globalScale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillText(link.label, midX, midY - 4)
      }
    },
    []
  )

  // Fit graph to viewport on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const fg = graphRef.current as unknown as { zoomToFit?: (ms: number, px: number) => void }
      fg?.zoomToFit?.(400, 60)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">A2A Network</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Agent-to-Agent communication mesh &bull; {A2A_EDGES.length} connections
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

      {/* Force Graph */}
      <GlassCard padding="none" className="overflow-hidden">
        <ForceGraph2D
          ref={graphRef as never}
          graphData={graphData}
          nodeCanvasObject={paintNode as never}
          linkCanvasObject={paintLink as never}
          nodePointerAreaPaint={(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
            const size = node.model === 'OPUS' ? 10 : 8
            ctx.beginPath()
            ctx.arc(node.x ?? 0, node.y ?? 0, size, 0, 2 * Math.PI)
            ctx.fillStyle = color
            ctx.fill()
          }}
          backgroundColor="transparent"
          linkDirectionalArrowLength={0}
          d3VelocityDecay={0.3}
          warmupTicks={50}
          cooldownTime={2000}
          width={undefined}
          height={500}
        />
      </GlassCard>

      {/* Agent Legend */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Agents</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentList.map((agent) => (
            <GlassCard key={agent.name} variant="hover" padding="sm">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: agent.color, boxShadow: `0 0 8px ${agent.color}60` }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {agent.displayName}
                    </h3>
                    <Badge variant={agent.model === 'OPUS' ? 'error' : 'info'}>
                      {agent.model}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{agent.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}

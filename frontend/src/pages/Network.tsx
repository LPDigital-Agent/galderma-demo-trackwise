// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: Network - Agent Mesh Visualization
// ============================================

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AGENTS, type AgentName } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// ============================================
// Custom Agent Node Component
// ============================================
interface AgentNodeData extends Record<string, unknown> {
  agent: AgentName
}

function AgentNode({ data }: { data: AgentNodeData }) {
  const agentInfo = AGENTS[data.agent]

  return (
    <div
      className={cn(
        'px-6 py-4 rounded-xl bg-[var(--bg-elevated)] border-[var(--glass-border)] border',
        'min-w-[240px] max-w-[280px]',
        'transition-all duration-300 hover:scale-105'
      )}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: agentInfo.color,
        boxShadow: `0 0 20px ${agentInfo.color}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: agentInfo.color }}
        />
        <div className="text-sm font-bold text-[var(--text-primary)]">
          {agentInfo.displayName}
        </div>
      </div>
      <div className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
        {agentInfo.description}
      </div>
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] font-mono uppercase px-2 py-0.5',
          agentInfo.model === 'OPUS'
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        )}
      >
        {agentInfo.model}
      </Badge>
    </div>
  )
}

// ============================================
// Network Page Component
// ============================================
export default function NetworkPage() {
  // Define node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      agent: AgentNode,
    }),
    []
  )

  // Define nodes with DAG layout positions
  const nodes: Node[] = useMemo(
    () => [
      {
        id: 'observer',
        type: 'agent',
        position: { x: 0, y: 200 },
        data: { agent: 'observer' },
      },
      {
        id: 'case_understanding',
        type: 'agent',
        position: { x: 350, y: 200 },
        data: { agent: 'case_understanding' },
      },
      {
        id: 'recurring_detector',
        type: 'agent',
        position: { x: 700, y: 200 },
        data: { agent: 'recurring_detector' },
      },
      {
        id: 'compliance_guardian',
        type: 'agent',
        position: { x: 1050, y: 200 },
        data: { agent: 'compliance_guardian' },
      },
      {
        id: 'resolution_composer',
        type: 'agent',
        position: { x: 1400, y: 200 },
        data: { agent: 'resolution_composer' },
      },
      {
        id: 'writeback',
        type: 'agent',
        position: { x: 1750, y: 200 },
        data: { agent: 'writeback' },
      },
      {
        id: 'inquiry_bridge',
        type: 'agent',
        position: { x: 1050, y: 450 },
        data: { agent: 'inquiry_bridge' },
      },
      {
        id: 'memory_curator',
        type: 'agent',
        position: { x: 1400, y: 450 },
        data: { agent: 'memory_curator' },
      },
      {
        id: 'csv_pack',
        type: 'agent',
        position: { x: 1750, y: 450 },
        data: { agent: 'csv_pack' },
      },
    ],
    []
  )

  // Define edges (A2A communication paths)
  const edges: Edge[] = useMemo(
    () => [
      // Main pipeline
      {
        id: 'e-observer-case_understanding',
        source: 'observer',
        target: 'case_understanding',
        animated: true,
        style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 },
      },
      {
        id: 'e-case_understanding-recurring_detector',
        source: 'case_understanding',
        target: 'recurring_detector',
        animated: true,
        style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 },
      },
      {
        id: 'e-recurring_detector-compliance_guardian',
        source: 'recurring_detector',
        target: 'compliance_guardian',
        animated: true,
        style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 },
      },
      {
        id: 'e-compliance_guardian-resolution_composer',
        source: 'compliance_guardian',
        target: 'resolution_composer',
        animated: true,
        style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 },
      },
      {
        id: 'e-resolution_composer-writeback',
        source: 'resolution_composer',
        target: 'writeback',
        animated: true,
        style: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 },
      },
      // Inquiry bridge path
      {
        id: 'e-observer-inquiry_bridge',
        source: 'observer',
        target: 'inquiry_bridge',
        animated: true,
        style: { stroke: 'rgba(236, 72, 153, 0.3)', strokeWidth: 2 },
      },
      {
        id: 'e-inquiry_bridge-resolution_composer',
        source: 'inquiry_bridge',
        target: 'resolution_composer',
        animated: true,
        style: { stroke: 'rgba(236, 72, 153, 0.3)', strokeWidth: 2 },
      },
      // Memory curator path
      {
        id: 'e-recurring_detector-memory_curator',
        source: 'recurring_detector',
        target: 'memory_curator',
        animated: true,
        style: { stroke: 'rgba(99, 102, 241, 0.3)', strokeWidth: 2 },
      },
      {
        id: 'e-memory_curator-resolution_composer',
        source: 'memory_curator',
        target: 'resolution_composer',
        animated: true,
        style: { stroke: 'rgba(99, 102, 241, 0.3)', strokeWidth: 2 },
      },
      // CSV Pack path
      {
        id: 'e-writeback-csv_pack',
        source: 'writeback',
        target: 'csv_pack',
        animated: true,
        style: { stroke: 'rgba(20, 184, 166, 0.3)', strokeWidth: 2 },
      },
    ],
    []
  )

  const onNodesChange = useCallback(() => {
    // Handle node changes if needed
  }, [])

  const onEdgesChange = useCallback(() => {
    // Handle edge changes if needed
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--glass-border)]">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Network</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Agent mesh architecture - 9 agents connected via A2A protocol
        </p>
      </div>

      {/* React Flow Canvas */}
      <div
        className="flex-1 bg-[var(--bg-base)]"
        style={{
          height: 'calc(100vh - 120px)',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          minZoom={0.3}
          maxZoom={1.5}
          attributionPosition="bottom-right"
          className="react-flow-dark"
        >
          <Background
            color="#333"
            gap={16}
            size={1}
          />
          <Controls className="react-flow-controls-dark" />
          <MiniMap
            nodeColor={(node) => {
              const agent = node.data.agent as AgentName
              return AGENTS[agent].color
            }}
            maskColor="rgba(10, 10, 15, 0.8)"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
            }}
          />
        </ReactFlow>
      </div>

      {/* Inline dark theme styles */}
      <style>{`
        .react-flow-dark {
          background-color: var(--bg-base);
        }
        .react-flow-dark .react-flow__node {
          cursor: pointer;
        }
        .react-flow-dark .react-flow__edge-path {
          stroke: rgba(255, 255, 255, 0.3);
        }
        .react-flow-dark .react-flow__attribution {
          background: var(--bg-elevated);
          color: var(--text-muted);
          border: 1px solid var(--glass-border);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
        }
      `}</style>
    </div>
  )
}

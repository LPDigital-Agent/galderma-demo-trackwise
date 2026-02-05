// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: Ledger - Decision Audit Trail
// ============================================

import { useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AGENTS, type AgentName } from '@/types'
import { useLedger } from '@/hooks/useCaseDetail'
import { AgentBadge } from '@/components/domain/AgentBadge'
import { EmptyState } from '@/components/domain/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ============================================
// Action Badge Helper
// ============================================
function getActionColor(action: string): string {
  if (action.includes('APPROVED') || action.includes('GENERATED')) return 'bg-green-500/10 text-green-400 border-green-500/20'
  if (action.includes('REVIEW') || action.includes('PENDING')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (action.includes('REJECTED') || action.includes('ERROR') || action.includes('ESCALATED')) return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (action.includes('PATTERN')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  if (action.includes('COMPLIANCE')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

// ============================================
// Ledger Page Component
// ============================================
export default function Ledger() {
  const navigate = useNavigate()
  const [selectedAgent, setSelectedAgent] = useState<AgentName | 'all'>('all')

  // Fetch ledger entries
  const { data: entries, isLoading } = useLedger(
    selectedAgent === 'all' ? { limit: 100 } : { agent_name: selectedAgent, limit: 100 }
  )

  // Export to JSON
  const handleExport = () => {
    if (!entries || entries.length === 0) {
      toast.error('No ledger entries to export')
      return
    }

    const dataStr = JSON.stringify(entries, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ledger-export-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Ledger exported successfully')
  }

  // Format confidence as percentage with color
  const getConfidenceDisplay = (confidence?: number) => {
    if (!confidence) return null
    const percent = Math.round(confidence * 100)
    const colorClass = confidence >= 0.8 ? 'text-green-400' : confidence >= 0.5 ? 'text-amber-400' : 'text-red-400'
    return <span className={cn('font-mono', colorClass)}>{percent}%</span>
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ledger</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Decision Audit Trail - Immutable log of all agent actions
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={!entries || entries.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Agent:</span>
            <Select value={selectedAgent} onValueChange={(value) => setSelectedAgent(value as AgentName | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {Object.keys(AGENTS).map((agentName) => (
                  <SelectItem key={agentName} value={agentName}>
                    {AGENTS[agentName as AgentName].displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No ledger entries found"
            description="Start processing cases to see decision audit trail"
          />
        ) : (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--glass-border)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">Timestamp</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="font-mono">Case ID</TableHead>
                  <TableHead className="font-mono">Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.ledger_id}
                    className={cn(
                      'cursor-pointer hover:bg-[var(--bg-elevated)]/50 transition-colors',
                      entry.requires_human_action && 'border-l-2 border-amber-500'
                    )}
                    onClick={() => navigate(`/cases/${entry.case_id}`)}
                  >
                    <TableCell className="font-mono text-xs text-[var(--text-secondary)]">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      <AgentBadge agent={entry.agent_name} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(entry.action)}>
                        {entry.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-secondary)] max-w-md truncate">
                      {entry.decision || entry.action_description || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getConfidenceDisplay(entry.confidence) || '—'}
                    </TableCell>
                    <TableCell
                      className="font-mono text-cyan-400 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/cases/${entry.case_id}`)
                      }}
                    >
                      {entry.case_id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                      {entry.entry_hash ? `${entry.entry_hash.slice(0, 8)}...` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

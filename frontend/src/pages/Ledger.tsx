// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: Ledger - Decision Audit Trail
// ============================================

import { useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ledger as t, DATE_LOCALE } from '@/i18n'
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
  if (action.includes('APPROVED') || action.includes('GENERATED')) return 'bg-green-500/10 backdrop-blur-sm text-green-400 border-green-400/30'
  if (action.includes('REVIEW') || action.includes('PENDING')) return 'bg-amber-500/10 backdrop-blur-sm text-amber-400 border-amber-400/30'
  if (action.includes('REJECTED') || action.includes('ERROR') || action.includes('ESCALATED')) return 'bg-red-500/10 backdrop-blur-sm text-red-400 border-red-400/30'
  if (action.includes('PATTERN')) return 'bg-cyan-500/10 backdrop-blur-sm text-cyan-400 border-cyan-400/30'
  if (action.includes('COMPLIANCE')) return 'bg-purple-500/10 backdrop-blur-sm text-purple-400 border-purple-400/30'
  return 'bg-gray-500/10 backdrop-blur-sm text-gray-400 border-gray-400/30'
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
      toast.error(t.toasts.exportEmpty)
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
    toast.success(t.toasts.exportSuccess)
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
    return new Date(timestamp).toLocaleString(DATE_LOCALE, {
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
    <div className="flex flex-col h-full gap-[var(--float-gap)]">
      {/* Header */}
      <div className="glass-shell p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lg-text-primary)]">{t.title}</h1>
            <p className="text-sm text-[var(--lg-text-secondary)] mt-1">
              {t.subtitle}
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
            {t.exportJson}
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--lg-text-secondary)]">{t.agentFilter}</span>
            <Select value={selectedAgent} onValueChange={(value) => setSelectedAgent(value as AgentName | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allAgents}</SelectItem>
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
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t.empty.title}
            description={t.empty.description}
          />
        ) : (
          <div className="glass-shell overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">{t.table.timestamp}</TableHead>
                  <TableHead>{t.table.agent}</TableHead>
                  <TableHead>{t.table.action}</TableHead>
                  <TableHead>{t.table.decision}</TableHead>
                  <TableHead className="text-right">{t.table.confidence}</TableHead>
                  <TableHead className="font-mono">{t.table.caseId}</TableHead>
                  <TableHead className="font-mono">{t.table.hash}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.ledger_id}
                    className={cn(
                      'cursor-pointer hover:bg-white/15 transition-colors',
                      entry.requires_human_action && 'border-l-2 border-amber-500'
                    )}
                    onClick={() => navigate(`/cases/${entry.case_id}`)}
                  >
                    <TableCell className="font-mono text-xs text-[var(--lg-text-secondary)]">
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
                    <TableCell className="text-sm text-[var(--lg-text-secondary)] max-w-md truncate">
                      {entry.decision || entry.action_description || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getConfidenceDisplay(entry.confidence) || '—'}
                    </TableCell>
                    <TableCell
                      className="font-mono text-[var(--brand-accent)] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/cases/${entry.case_id}`)
                      }}
                    >
                      {entry.case_id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[var(--lg-text-tertiary)]">
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

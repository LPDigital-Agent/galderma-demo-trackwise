// ============================================
// Galderma TrackWise AI Autopilot Demo
// Ledger Page - Decision Ledger (Audit Trail)
// ============================================

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Download, Filter, Shield, ExternalLink } from 'lucide-react'
import { GlassCard, Button, Badge } from '@/components/ui'
import { useLedger } from '@/hooks/useCaseDetail'
import { AGENTS } from '@/types'
import type { AgentName, LedgerEntry } from '@/types'

/**
 * Ledger Page
 *
 * Immutable decision ledger for compliance and audit trail.
 * Now wired to the /api/ledger endpoint with real data.
 */
export function Ledger() {
  const navigate = useNavigate()
  const [agentFilter, setAgentFilter] = useState<AgentName | 'ALL'>('ALL')

  const { data: entries, isLoading } = useLedger({
    agent_name: agentFilter === 'ALL' ? undefined : agentFilter,
    limit: 200,
  })

  const agentList = Object.values(AGENTS)

  const handleExport = useCallback(() => {
    if (!entries || entries.length === 0) return
    const json = JSON.stringify(entries, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `galderma-ledger-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [entries])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Decision Ledger</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Immutable audit trail of all agent decisions &bull; {entries?.length ?? 0} entries
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleExport}
          disabled={!entries || entries.length === 0}
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Filters</h2>
          </div>

          {/* Agent Filter */}
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Agent</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={agentFilter === 'ALL' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAgentFilter('ALL')}
              >
                All
              </Button>
              {agentList.map((agent) => (
                <Button
                  key={agent.name}
                  variant={agentFilter === agent.name ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAgentFilter(agent.name)}
                >
                  {agent.displayName}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Ledger Table */}
      <GlassCard padding="none">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Entries</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                All entries are cryptographically signed and immutable
              </p>
            </div>
            <Shield className="h-5 w-5 text-[var(--brand-primary)]" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading ledger...</p>
            </div>
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
              <p className="mt-4 text-sm text-[var(--text-secondary)]">No ledger entries yet</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Create cases and let agents process them to see entries
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Decision
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Case
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Hash
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {entries.map((entry) => (
                  <LedgerRow
                    key={entry.ledger_id}
                    entry={entry}
                    onCaseClick={(id) => navigate(`/cases/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function LedgerRow({
  entry,
  onCaseClick,
}: {
  entry: LedgerEntry
  onCaseClick: (caseId: string) => void
}) {
  const agentInfo = AGENTS[entry.agent_name as AgentName]
  const agentColor = agentInfo?.color ?? 'var(--text-secondary)'

  const actionVariant =
    entry.action === 'WRITEBACK_EXECUTED'
      ? 'success'
      : entry.action === 'ERROR_OCCURRED'
        ? 'error'
        : entry.action === 'HUMAN_REVIEW_REQUESTED'
          ? 'warning'
          : entry.action === 'COMPLIANCE_CHECKED'
            ? 'info'
            : 'default'

  return (
    <tr className="hover:bg-[rgba(255,255,255,0.02)]">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-tertiary)]">
        {new Date(entry.timestamp).toLocaleString()}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="text-xs font-semibold" style={{ color: agentColor }}>
          {agentInfo?.displayName ?? entry.agent_name}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <Badge variant={actionVariant}>{entry.action.replace(/_/g, ' ')}</Badge>
      </td>
      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[var(--text-secondary)]">
        {entry.decision || '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {entry.confidence != null ? (
          <span
            className={`text-xs font-medium ${
              entry.confidence >= 0.9
                ? 'text-[var(--status-success)]'
                : entry.confidence >= 0.7
                  ? 'text-[var(--status-warning)]'
                  : 'text-[var(--status-error)]'
            }`}
          >
            {(entry.confidence * 100).toFixed(0)}%
          </span>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <button
          className="flex items-center gap-1 text-xs text-[var(--brand-primary)] hover:underline"
          onClick={() => onCaseClick(entry.case_id)}
        >
          {entry.case_id.slice(0, 11)}...
          <ExternalLink className="h-3 w-3" />
        </button>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-[var(--text-tertiary)] opacity-50">
        {entry.entry_hash?.slice(0, 12) ?? '—'}
      </td>
    </tr>
  )
}

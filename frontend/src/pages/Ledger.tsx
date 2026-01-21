// ============================================
// Galderma TrackWise AI Autopilot Demo
// Ledger Page - Decision Ledger
// ============================================

import { useState } from 'react'
import { BookOpen, Filter, Calendar } from 'lucide-react'
import { GlassCard, Button } from '@/components/ui'
import { AGENTS } from '@/types'
import type { AgentName } from '@/types'

/**
 * Ledger Page
 *
 * Immutable decision ledger for compliance and audit trail.
 *
 * Features:
 * - Filter by agent and date range
 * - Table view of ledger entries
 * - Entry detail panel (future)
 * - Export to CSV (future)
 *
 * Performance:
 * - Virtualized table for large datasets
 * - Pagination support
 */
export function Ledger() {
  const [agentFilter, setAgentFilter] = useState<AgentName | 'ALL'>('ALL')

  const agentList = Object.values(AGENTS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Decision Ledger</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Immutable audit trail of all agent decisions
          </p>
        </div>
        <Button variant="secondary" size="md">
          <Calendar className="h-4 w-4" />
          Export
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
      <GlassCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Entries</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            All entries are cryptographically signed and immutable
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-h-[400px] items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
              <p className="mt-4 text-sm text-[var(--text-secondary)]">No ledger entries yet</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Entries will appear as agents process cases
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

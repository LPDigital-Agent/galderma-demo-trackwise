// ============================================
// Galderma TrackWise AI Autopilot Demo
// Cases Page - Cases List
// ============================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Filter, Link2 } from 'lucide-react'
import { GlassCard, Button, SeverityBadge, Badge } from '@/components/ui'
import { CreateCaseModal } from '@/components/CreateCaseModal'
import { useCases } from '@/hooks'
import type { CaseStatus, CaseSeverity } from '@/types'

const STATUS_FILTERS: { value: CaseStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

const SEVERITY_FILTERS: { value: CaseSeverity | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

/**
 * Cases Page
 *
 * List and manage cases with filtering capabilities.
 *
 * Features:
 * - Filter by status and severity
 * - Grid layout with case cards
 * - Create new case (modal placeholder)
 * - Real-time updates via TanStack Query
 *
 * Performance:
 * - Optimistic updates for mutations
 * - Virtualized list for large datasets (future)
 */
export function Cases() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<CaseSeverity | 'ALL'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading } = useCases({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    severity: severityFilter === 'ALL' ? undefined : severityFilter,
  })

  const cases = data?.cases ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Cases</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {data?.total ?? 0} total cases
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Create Case
        </Button>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Filters</h2>
          </div>

          {/* Status Filter */}
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Severity</p>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_FILTERS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={severityFilter === value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSeverityFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Cases Grid */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Loading cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <GlassCard>
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="mt-2 text-sm text-[var(--text-secondary)]">No cases found</p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {cases.map((caseItem) => (
            <GlassCard key={caseItem.case_id} variant="hover" className="flex flex-col" onClick={() => navigate(`/cases/${caseItem.case_id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {caseItem.case_id}
                    </Badge>
                    <SeverityBadge severity={caseItem.severity} />
                  </div>
                  <h3 className="mt-2 font-semibold text-[var(--text-primary)]">
                    {caseItem.product_brand} - {caseItem.product_name}
                  </h3>
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
                {caseItem.complaint_text}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      caseItem.status === 'CLOSED'
                        ? 'success'
                        : caseItem.status === 'OPEN'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {caseItem.status.replace(/_/g, ' ')}
                  </Badge>
                  {caseItem.linked_case_id && (
                    <Link2 className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-label="Linked case" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {new Date(caseItem.created_at).toLocaleDateString()}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <CreateCaseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(caseId) => navigate(`/cases/${caseId}`)}
        />
      )}
    </div>
  )
}

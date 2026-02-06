import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Link as LinkIcon } from 'lucide-react'
import { cases as t, DATE_LOCALE } from '@/i18n'
import { useCases } from '@/hooks'
import { StatusBadge, SeverityBadge } from '@/components/domain'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateCaseModal } from '@/components/overlays/CreateCaseModal'
import type { CaseStatus, CaseSeverity } from '@/types'

export default function Cases() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<CaseSeverity | 'ALL'>('ALL')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data, isLoading } = useCases({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    severity: severityFilter === 'ALL' ? undefined : severityFilter,
    page: 1,
    page_size: 100,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DATE_LOCALE, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full gap-[var(--float-gap)]">
      {/* Header */}
      <div className="glass-shell p-5 lg:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--lg-text-primary)]">{t.title}</h1>
          {data && (
            <Badge
              variant="outline"
              className="glass-control px-2.5 py-1 text-[var(--brand-accent)]"
            >
              {data.total}
            </Badge>
          )}
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t.newCase}
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-shell p-4 flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as CaseStatus | 'ALL')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.filters.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.filters.allStatuses}</SelectItem>
            <SelectItem value="OPEN">{t.filters.open}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t.filters.inProgress}</SelectItem>
            <SelectItem value="PENDING_REVIEW">{t.filters.pendingReview}</SelectItem>
            <SelectItem value="RESOLVED">{t.filters.resolved}</SelectItem>
            <SelectItem value="CLOSED">{t.filters.closed}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={severityFilter}
          onValueChange={(value) => setSeverityFilter(value as CaseSeverity | 'ALL')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.filters.filterBySeverity} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.filters.allSeverities}</SelectItem>
            <SelectItem value="LOW">{t.filters.low}</SelectItem>
            <SelectItem value="MEDIUM">{t.filters.medium}</SelectItem>
            <SelectItem value="HIGH">{t.filters.high}</SelectItem>
            <SelectItem value="CRITICAL">{t.filters.critical}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 glass-shell overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--lg-border-soft)] hover:bg-transparent">
              <TableHead className="text-[var(--lg-text-secondary)] font-medium">{t.table.caseId}</TableHead>
              <TableHead className="text-[var(--lg-text-secondary)] font-medium">{t.table.product}</TableHead>
              <TableHead className="text-[var(--lg-text-secondary)] font-medium">{t.table.status}</TableHead>
              <TableHead className="text-[var(--lg-text-secondary)] font-medium">{t.table.severity}</TableHead>
              <TableHead className="text-[var(--lg-text-secondary)] font-medium">{t.table.type}</TableHead>
              <TableHead className="text-[var(--lg-text-secondary)] font-medium">{t.table.created}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-[var(--lg-border-soft)]">
                  <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-white/10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-white/10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 bg-white/10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 bg-white/10" /></TableCell>
                </TableRow>
              ))
            ) : data && data.cases.length > 0 ? (
              data.cases.map((caseItem) => (
                <TableRow
                  key={caseItem.case_id}
                  onClick={() => navigate(`/cases/${caseItem.case_id}`)}
                  className="border-[var(--lg-border-soft)] hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <TableCell className="font-mono text-[var(--brand-accent)]">
                    <div className="flex items-center gap-2">
                      {caseItem.case_id}
                      {caseItem.linked_case_id && (
                        <LinkIcon className="w-3 h-3 text-[var(--lg-text-tertiary)]" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[var(--lg-text-primary)]">
                    <div className="flex flex-col">
                      <span className="font-medium">{caseItem.product_brand}</span>
                      <span className="text-sm text-[var(--lg-text-secondary)]">{caseItem.product_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={caseItem.status} />
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={caseItem.severity} />
                  </TableCell>
                  <TableCell className="text-[var(--lg-text-secondary)]">
                    {caseItem.case_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-[var(--lg-text-secondary)] font-mono text-sm">
                    {formatDate(caseItem.created_at)}
                  </TableCell>
                </TableRow>
              ))
            ) : null}
          </TableBody>
        </Table>

      </div>

      {/* Create Case Modal */}
      <CreateCaseModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  )
}

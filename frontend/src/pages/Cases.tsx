import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Link as LinkIcon } from 'lucide-react'
import { useCases } from '@/hooks'
import { StatusBadge, SeverityBadge, EmptyState } from '@/components/domain'
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
    page_size: 20,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-text-primary">Cases</h1>
          {data && (
            <Badge
              variant="outline"
              className="bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
            >
              {data.total}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as CaseStatus | 'ALL')}
        >
          <SelectTrigger className="w-[180px] bg-glass-bg border-glass-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={severityFilter}
          onValueChange={(value) => setSeverityFilter(value as CaseSeverity | 'ALL')}
        >
          <SelectTrigger className="w-[180px] bg-glass-bg border-glass-border">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-lg border border-glass-border bg-glass-bg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-glass-border hover:bg-transparent">
              <TableHead className="text-text-secondary font-medium">Case ID</TableHead>
              <TableHead className="text-text-secondary font-medium">Product</TableHead>
              <TableHead className="text-text-secondary font-medium">Status</TableHead>
              <TableHead className="text-text-secondary font-medium">Severity</TableHead>
              <TableHead className="text-text-secondary font-medium">Type</TableHead>
              <TableHead className="text-text-secondary font-medium">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-glass-border">
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 bg-white/5" /></TableCell>
                </TableRow>
              ))
            ) : data && data.cases.length > 0 ? (
              data.cases.map((caseItem) => (
                <TableRow
                  key={caseItem.case_id}
                  onClick={() => navigate(`/cases/${caseItem.case_id}`)}
                  className="border-glass-border hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <TableCell className="font-mono text-brand-accent">
                    <div className="flex items-center gap-2">
                      {caseItem.case_id}
                      {caseItem.linked_case_id && (
                        <LinkIcon className="w-3 h-3 text-text-muted" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-primary">
                    <div className="flex flex-col">
                      <span className="font-medium">{caseItem.product_brand}</span>
                      <span className="text-sm text-text-secondary">{caseItem.product_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={caseItem.status} />
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={caseItem.severity} />
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {caseItem.case_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-text-secondary font-mono text-sm">
                    {formatDate(caseItem.created_at)}
                  </TableCell>
                </TableRow>
              ))
            ) : null}
          </TableBody>
        </Table>

        {!isLoading && data && data.cases.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <EmptyState
              icon={FileText}
              title="No cases found"
              description="Try adjusting your filters or create a new case"
              action={
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Case
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      <CreateCaseModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  )
}

import { useMemo } from 'react'
import { CheckCircle2, XCircle, Shield, Hash, TrendingUp } from 'lucide-react'
import { auditorView as t, DATE_LOCALE } from '@/i18n'
import { useCaseLedger } from '@/hooks'
import { AgentBadge } from '@/components/domain'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface AuditorViewProps {
  caseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditorView({ caseId, open, onOpenChange }: AuditorViewProps) {
  const { data: ledger, isLoading } = useCaseLedger(caseId)

  const integrity = useMemo(() => {
    if (!ledger || ledger.length === 0) return null

    const hasHashes = ledger.every((entry) => entry.entry_hash)
    const firstEntry = ledger[0]
    const lastEntry = ledger[ledger.length - 1]

    return {
      valid: hasHashes,
      firstHash: firstEntry?.entry_hash || null,
      lastHash: lastEntry?.entry_hash || null,
      previousHash: lastEntry?.previous_hash || null,
    }
  }, [ledger])

  const policySummary = useMemo(() => {
    if (!ledger) return { evaluated: 0, passed: 0, violated: 0, violations: [] }

    let evaluated = 0
    let violated = 0
    const violationsList: string[] = []

    ledger.forEach((entry) => {
      if (entry.policies_evaluated) {
        evaluated += entry.policies_evaluated.length
      }
      if (entry.policy_violations) {
        violated += entry.policy_violations.length
        violationsList.push(...entry.policy_violations)
      }
    })

    const passed = evaluated - violated

    return {
      evaluated,
      passed,
      violated,
      violations: violationsList,
    }
  }, [ledger])

  const decisionEntries = useMemo(() => {
    if (!ledger) return []
    return ledger.filter(
      (entry) =>
        entry.action === 'COMPLIANCE_CHECKED' ||
        entry.action === 'RESOLUTION_GENERATED' ||
        entry.decision
    )
  }, [ledger])

  const stateChanges = useMemo(() => {
    if (!ledger) return []
    return ledger
      .filter((entry) => entry.state_changes && entry.state_changes.length > 0)
      .flatMap((entry) =>
        entry.state_changes!.map((change) => ({
          ...change,
          agent: entry.agent_name,
          timestamp: entry.timestamp,
        }))
      )
  }, [ledger])

  const modelStats = useMemo((): { modelId: string | null; totalTokens: number; totalLatency: number } => {
    if (!ledger) return { modelId: null, totalTokens: 0, totalLatency: 0 }

    let totalTokens = 0
    let totalLatency = 0
    let modelId: string | null = null

    ledger.forEach((entry) => {
      if (entry.model_id && !modelId) {
        modelId = entry.model_id
      }
      if (entry.tokens_used) {
        totalTokens += entry.tokens_used
      }
      if (entry.latency_ms) {
        totalLatency += entry.latency_ms
      }
    })

    return { modelId, totalTokens, totalLatency }
  }, [ledger])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DATE_LOCALE, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px] bg-bg-surface border-glass-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-primary" />
            {t.title}
          </SheetTitle>
          <SheetDescription className="text-text-secondary">
            {t.subtitle}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-24 bg-black/5" />
            <Skeleton className="h-32 bg-black/5" />
            <Skeleton className="h-48 bg-black/5" />
          </div>
        ) : ledger && ledger.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-120px)] mt-6">
            <div className="space-y-6">
              {/* Integrity Banner */}
              <div
                className={cn(
                  'p-4 rounded-lg border',
                  integrity?.valid
                    ? 'bg-green-50 border-green-300'
                    : 'bg-yellow-50 border-yellow-300'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-semibold text-text-primary">
                    {integrity?.valid ? t.integrity.chainValid : t.integrity.unverified}
                  </span>
                </div>
                {integrity?.valid ? (
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary">
                      {t.integrity.firstHash}{' '}
                      <span className="font-mono text-text-primary">
                        {integrity.firstHash?.substring(0, 16)}...
                      </span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t.integrity.lastHash}{' '}
                      <span className="font-mono text-text-primary">
                        {integrity.lastHash?.substring(0, 16)}...
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary">
                    {t.integrity.missingHashes}
                  </p>
                )}
              </div>

              {/* Policy Summary */}
              <div className="p-4 rounded-lg bg-glass-bg border border-glass-border">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-brand-primary" />
                  <span className="text-sm font-semibold text-text-primary">{t.policySummary}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">
                      {policySummary.evaluated}
                    </p>
                    <p className="text-xs text-text-muted">{t.evaluated}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{policySummary.passed}</p>
                    <p className="text-xs text-text-muted">{t.passed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{policySummary.violated}</p>
                    <p className="text-xs text-text-muted">{t.violated}</p>
                  </div>
                </div>
                {policySummary.violations.length > 0 && (
                  <div className="mt-3">
                    <Separator className="bg-glass-border mb-3" />
                    <p className="text-xs text-text-muted mb-2">{t.violations}</p>
                    <div className="space-y-1">
                      {policySummary.violations.map((violation, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-text-secondary">{violation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Decision Cards */}
              {decisionEntries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    {t.criticalDecisions}
                  </h3>
                  <div className="space-y-3">
                    {decisionEntries.map((entry) => (
                      <div
                        key={entry.ledger_id}
                        className="p-4 rounded-lg bg-glass-bg border border-glass-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AgentBadge agent={entry.agent_name} />
                            <Badge variant="outline" className="text-xs">
                              {entry.action}
                            </Badge>
                          </div>
                          <span className="text-xs text-text-muted font-mono">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>

                        {entry.decision && (
                          <p className="text-sm text-text-secondary mb-3">{entry.decision}</p>
                        )}

                        {entry.confidence !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-text-muted">{t.confidence}</span>
                              <span className="text-xs text-text-secondary">
                                {(entry.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-bg-base rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all',
                                  entry.confidence >= 0.8
                                    ? 'bg-green-500'
                                    : entry.confidence >= 0.6
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                )}
                                style={{ width: `${entry.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {entry.policies_evaluated && entry.policies_evaluated.length > 0 && (
                          <div className="space-y-1">
                            {entry.policies_evaluated.map((policy, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-text-secondary">{policy}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {entry.policy_violations && entry.policy_violations.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {entry.policy_violations.map((violation, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-text-secondary">{violation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* State Changes Table */}
              {stateChanges.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">{t.stateChanges}</h3>
                  <div className="rounded-lg border border-glass-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-glass-border hover:bg-transparent">
                          <TableHead className="text-text-muted text-xs">{t.stateTable.field}</TableHead>
                          <TableHead className="text-text-muted text-xs">{t.stateTable.before}</TableHead>
                          <TableHead className="text-text-muted text-xs">{t.stateTable.after}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stateChanges.map((change, idx) => (
                          <TableRow key={idx} className="border-glass-border">
                            <TableCell className="text-xs text-text-primary font-medium">
                              {change.field}
                            </TableCell>
                            <TableCell className="text-xs text-red-600 font-mono">
                              {change.before || 'null'}
                            </TableCell>
                            <TableCell className="text-xs text-green-600 font-mono">
                              {change.after || 'null'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Footer: Model Stats */}
              <div className="p-4 rounded-lg bg-glass-bg border border-glass-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t.modelStats.model}</p>
                    <p className="text-sm text-text-primary font-mono">
                      {modelStats.modelId ? modelStats.modelId.split('/').pop() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t.modelStats.totalTokens}</p>
                    <p className="text-sm text-text-primary font-semibold">
                      {modelStats.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">{t.modelStats.totalLatency}</p>
                    <p className="text-sm text-text-primary font-semibold">
                      {(modelStats.totalLatency / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-text-muted">{t.noAuditTrail}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

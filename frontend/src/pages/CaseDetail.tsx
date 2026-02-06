import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { caseDetail as t, DATE_LOCALE } from '@/i18n'
import { ArrowLeft, ChevronDown, ChevronRight, Link as LinkIcon } from 'lucide-react'
import { useCase, useCaseRuns, useCaseLedger } from '@/hooks'
import { useLanguageStore } from '@/stores/languageStore'
import { useSacStore } from '@/stores/sacStore'
import { StatusBadge, SeverityBadge, AgentBadge, GlassPanel } from '@/components/domain'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AuditorView } from '@/components/overlays/AuditorView'
import { cn } from '@/lib/utils'
import type { Case, Language } from '@/types'

// Helper to get resolution text based on language
function getResolutionForLanguage(caseData: Case, language: Language): string {
  if (language === 'AUTO') return caseData.resolution_text || ''
  const key = `resolution_text_${language.toLowerCase()}` as keyof Case
  return (caseData[key] as string) || caseData.resolution_text || ''
}

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguageStore()
  const [auditorOpen, setAuditorOpen] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  // Check SAC store first — if the case exists in browser memory,
  // skip all API calls (they'd fail anyway due to container recycling).
  const sacCases = useSacStore((s) => s.generatedCases)
  const sacCase = sacCases.find((c) => c.case_id === caseId)

  const { data: caseData, isLoading: caseLoading } = useCase(caseId ?? '', { enabled: !sacCase })
  const { data: runs, isLoading: runsLoading } = useCaseRuns(caseId ?? '', { enabled: !sacCase })
  const { data: ledger, isLoading: ledgerLoading } = useCaseLedger(caseId ?? '', { enabled: !sacCase })

  // Use API data if available, otherwise use SAC store data
  const effectiveCaseData = caseData ?? sacCase

  const firstRun = runs?.[0]
  const agentSteps = firstRun?.agent_steps || []

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber)
    } else {
      newExpanded.add(stepNumber)
    }
    setExpandedSteps(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DATE_LOCALE, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (caseLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-[var(--float-gap)] h-full">
        <div className="lg:w-1/3 space-y-[var(--float-gap)]">
          <Skeleton className="h-10 w-32 bg-white/10" />
          <Skeleton className="h-64 bg-white/10" />
          <Skeleton className="h-48 bg-white/10" />
        </div>
        <div className="lg:w-2/3 space-y-[var(--float-gap)]">
          <Skeleton className="h-96 bg-white/10" />
        </div>
      </div>
    )
  }

  if (!effectiveCaseData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[var(--lg-text-secondary)]">{t.notFound}</p>
          <Button
            onClick={() => navigate('/cases')}
            variant="outline"
            className="mt-4"
          >
            {t.backToCases}
          </Button>
        </div>
      </div>
    )
  }

  const resolutionText = getResolutionForLanguage(effectiveCaseData, language)

  return (
    <div className="flex flex-col lg:flex-row gap-[var(--float-gap)] h-full overflow-hidden">
      {/* Left Column */}
      <div className="lg:w-1/3 flex flex-col gap-[var(--float-gap)] overflow-auto">
        {/* Back Button */}
        <div className="glass-control p-1.5 w-fit rounded-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/cases')}
            className="w-fit text-[var(--lg-text-secondary)] hover:text-[var(--lg-text-primary)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToCases}
          </Button>
        </div>

        {/* Case Info Card */}
        <GlassPanel variant="shell">
          <div className="space-y-4">
            <div>
              <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.caseId}</p>
              <p className="font-mono text-[var(--brand-accent)] text-lg">{effectiveCaseData.case_id}</p>
            </div>

            <Separator className="bg-[var(--lg-border-soft)]" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.status}</p>
                <StatusBadge status={effectiveCaseData.status} />
              </div>
              <div>
                <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.severity}</p>
                <SeverityBadge severity={effectiveCaseData.severity} />
              </div>
            </div>

            <Separator className="bg-[var(--lg-border-soft)]" />

            <div>
              <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.productBrand}</p>
              <p className="text-[var(--lg-text-primary)] font-medium">{effectiveCaseData.product_brand}</p>
            </div>

            <div>
              <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.productName}</p>
              <p className="text-[var(--lg-text-primary)]">{effectiveCaseData.product_name}</p>
            </div>

            {effectiveCaseData.lot_number && (
              <div>
                <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.lotNumber}</p>
                <p className="font-mono text-[var(--lg-text-primary)]">{effectiveCaseData.lot_number}</p>
              </div>
            )}

            <Separator className="bg-[var(--lg-border-soft)]" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.type}</p>
                <p className="text-[var(--lg-text-primary)]">{effectiveCaseData.case_type.replace('_', ' ')}</p>
              </div>
              {effectiveCaseData.category && (
                <div>
                  <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.category}</p>
                  <p className="text-[var(--lg-text-primary)]">{effectiveCaseData.category}</p>
                </div>
              )}
            </div>

            <Separator className="bg-[var(--lg-border-soft)]" />

            <div>
              <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.customer}</p>
              <p className="text-[var(--lg-text-primary)] font-medium">{effectiveCaseData.customer_name}</p>
              {effectiveCaseData.customer_email && (
                <p className="text-[var(--lg-text-secondary)] text-sm">{effectiveCaseData.customer_email}</p>
              )}
              {effectiveCaseData.customer_phone && (
                <p className="text-[var(--lg-text-secondary)] text-sm">{effectiveCaseData.customer_phone}</p>
              )}
            </div>

            <Separator className="bg-[var(--lg-border-soft)]" />

            <div>
              <p className="text-[var(--lg-text-tertiary)] text-sm mb-1">{t.labels.created}</p>
              <p className="text-[var(--lg-text-secondary)] text-sm font-mono">{formatDate(effectiveCaseData.created_at)}</p>
            </div>
          </div>
        </GlassPanel>

        {/* Complaint Text */}
        <GlassPanel variant="card">
          <h3 className="text-[var(--lg-text-primary)] font-semibold mb-3">{t.complaint}</h3>
          <p className="text-[var(--lg-text-secondary)] leading-relaxed">{effectiveCaseData.complaint_text}</p>
        </GlassPanel>

        {/* Resolution Text */}
        {resolutionText && (
          <GlassPanel variant="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--lg-text-primary)] font-semibold">{t.resolution}</h3>
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">{t.languages.AUTO}</SelectItem>
                  <SelectItem value="EN">{t.languages.EN}</SelectItem>
                  <SelectItem value="PT">{t.languages.PT}</SelectItem>
                  <SelectItem value="ES">{t.languages.ES}</SelectItem>
                  <SelectItem value="FR">{t.languages.FR}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[var(--lg-text-secondary)] leading-relaxed">{resolutionText}</p>
          </GlassPanel>
        )}

        {/* Linked Case */}
        {effectiveCaseData.linked_case_id && (
          <GlassPanel variant="card">
            <h3 className="text-[var(--lg-text-primary)] font-semibold mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {t.linkedCase}
            </h3>
            <div
              onClick={() => navigate(`/cases/${effectiveCaseData.linked_case_id}`)}
              className="glass-control flex items-center justify-between p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <span className="font-mono text-[var(--brand-accent)]">{effectiveCaseData.linked_case_id}</span>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Right Column */}
      <div className="lg:w-2/3 flex flex-col gap-[var(--float-gap)] overflow-auto">
        {/* Processing Timeline */}
        <GlassPanel variant="shell" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--lg-text-primary)] font-semibold text-lg">{t.processingTimeline}</h3>
            <Button
              onClick={() => setAuditorOpen(true)}
              variant="outline"
              size="sm"
              className="border-white/15 text-[var(--brand-primary)] hover:bg-white/10"
            >
              {t.openAuditor}
            </Button>
          </div>

          {runsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 bg-white/10" />
              ))}
            </div>
          ) : agentSteps.length > 0 ? (
            <div className="space-y-4">
              {agentSteps.map((step) => (
                <div key={step.step_number} className="relative">
                  {/* Timeline connector */}
                  {step.step_number < agentSteps.length && (
                    <div className="absolute left-3 top-10 bottom-0 w-px bg-[var(--lg-border-soft)]" />
                  )}

                  <div className="flex gap-4">
                    {/* Agent dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border-[1.5px] border-[var(--brand-primary)]/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AgentBadge agent={step.agent_name} showModel />
                        <Badge variant="outline" className="text-xs">
                          {step.step_type}
                        </Badge>
                        <span className="text-[var(--lg-text-tertiary)] text-sm">
                          {formatDuration(step.duration_ms)}
                        </span>
                      </div>

                      {step.output_summary && (
                        <p className="text-[var(--lg-text-secondary)] text-sm mb-2">{step.output_summary}</p>
                      )}

                      {step.tools_called && step.tools_called.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {step.tools_called.map((tool, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {step.reasoning && (
                        <div>
                          <button
                            onClick={() => toggleStep(step.step_number)}
                            className="flex items-center gap-1 text-[var(--brand-accent)] text-sm hover:text-[var(--brand-accent)]/80 transition-colors"
                          >
                            {expandedSteps.has(step.step_number) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {t.reasoning}
                          </button>
                          {expandedSteps.has(step.step_number) && (
                            <div className="glass-control mt-2 p-3 rounded-xl">
                              <p className="text-[var(--lg-text-secondary)] text-sm leading-relaxed">
                                {step.reasoning}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--lg-text-tertiary)] text-center py-8">{t.noProcessingSteps}</p>
          )}
        </GlassPanel>

        {/* Audit Trail */}
        <GlassPanel variant="shell">
          <h3 className="text-[var(--lg-text-primary)] font-semibold text-lg mb-4">{t.auditTrail}</h3>

          {ledgerLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 bg-white/10" />
              ))}
            </div>
          ) : ledger && ledger.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {ledger.map((entry) => (
                  <div
                    key={entry.ledger_id}
                    className="glass-control p-4 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AgentBadge agent={entry.agent_name} />
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </div>
                      <span className="text-[var(--lg-text-tertiary)] text-xs font-mono">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>

                    {entry.decision && (
                      <p className="text-[var(--lg-text-secondary)] text-sm mb-2">{entry.decision}</p>
                    )}

                    {entry.confidence !== undefined && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--lg-text-tertiary)] text-xs">{t.confidence}</span>
                        <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden max-w-xs">
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
                        <span className="text-[var(--lg-text-secondary)] text-xs">
                          {(entry.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {entry.state_changes && entry.state_changes.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {entry.state_changes.map((change, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-[var(--lg-text-tertiary)]">{change.field}:</span>{' '}
                            <span className="text-red-400">{change.before || 'null'}</span>
                            {' → '}
                            <span className="text-green-400">{change.after || 'null'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-[var(--lg-text-tertiary)] text-center py-8">{t.noAuditTrail}</p>
          )}
        </GlassPanel>
      </div>

      {/* Auditor View */}
      <AuditorView caseId={caseId ?? ''} open={auditorOpen} onOpenChange={setAuditorOpen} />
    </div>
  )
}

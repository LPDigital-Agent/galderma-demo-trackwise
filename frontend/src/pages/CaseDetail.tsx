import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { caseDetail as t, DATE_LOCALE } from '@/i18n'
import { ArrowLeft, ChevronDown, ChevronRight, Link as LinkIcon } from 'lucide-react'
import { useCase, useCaseRuns, useCaseLedger } from '@/hooks'
import { useLanguageStore } from '@/stores/languageStore'
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

  const { data: caseData, isLoading: caseLoading } = useCase(caseId ?? '')
  const { data: runs, isLoading: runsLoading } = useCaseRuns(caseId ?? '')
  const { data: ledger, isLoading: ledgerLoading } = useCaseLedger(caseId ?? '')

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
          <Skeleton className="h-10 w-32 bg-white/15" />
          <Skeleton className="h-64 bg-white/15" />
          <Skeleton className="h-48 bg-white/15" />
        </div>
        <div className="lg:w-2/3 space-y-[var(--float-gap)]">
          <Skeleton className="h-96 bg-white/15" />
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-text-secondary">{t.notFound}</p>
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

  const resolutionText = getResolutionForLanguage(caseData, language)

  return (
    <div className="flex flex-col lg:flex-row gap-[var(--float-gap)] h-full overflow-hidden">
      {/* Left Column */}
      <div className="lg:w-1/3 flex flex-col gap-[var(--float-gap)] overflow-auto">
        {/* Back Button */}
        <div className="glass-float p-2 w-fit">
          <Button
            variant="ghost"
            onClick={() => navigate('/cases')}
            className="w-fit text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToCases}
          </Button>
        </div>

        {/* Case Info Card */}
        <GlassPanel variant="floating">
          <div className="space-y-4">
            <div>
              <p className="text-text-muted text-sm mb-1">{t.labels.caseId}</p>
              <p className="font-mono text-brand-accent text-lg">{caseData.case_id}</p>
            </div>

            <Separator className="bg-glass-border" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-sm mb-1">{t.labels.status}</p>
                <StatusBadge status={caseData.status} />
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">{t.labels.severity}</p>
                <SeverityBadge severity={caseData.severity} />
              </div>
            </div>

            <Separator className="bg-glass-border" />

            <div>
              <p className="text-text-muted text-sm mb-1">{t.labels.productBrand}</p>
              <p className="text-text-primary font-medium">{caseData.product_brand}</p>
            </div>

            <div>
              <p className="text-text-muted text-sm mb-1">{t.labels.productName}</p>
              <p className="text-text-primary">{caseData.product_name}</p>
            </div>

            {caseData.lot_number && (
              <div>
                <p className="text-text-muted text-sm mb-1">{t.labels.lotNumber}</p>
                <p className="font-mono text-text-primary">{caseData.lot_number}</p>
              </div>
            )}

            <Separator className="bg-glass-border" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-sm mb-1">{t.labels.type}</p>
                <p className="text-text-primary">{caseData.case_type.replace('_', ' ')}</p>
              </div>
              {caseData.category && (
                <div>
                  <p className="text-text-muted text-sm mb-1">{t.labels.category}</p>
                  <p className="text-text-primary">{caseData.category}</p>
                </div>
              )}
            </div>

            <Separator className="bg-glass-border" />

            <div>
              <p className="text-text-muted text-sm mb-1">{t.labels.customer}</p>
              <p className="text-text-primary font-medium">{caseData.customer_name}</p>
              {caseData.customer_email && (
                <p className="text-text-secondary text-sm">{caseData.customer_email}</p>
              )}
              {caseData.customer_phone && (
                <p className="text-text-secondary text-sm">{caseData.customer_phone}</p>
              )}
            </div>

            <Separator className="bg-glass-border" />

            <div>
              <p className="text-text-muted text-sm mb-1">{t.labels.created}</p>
              <p className="text-text-secondary text-sm font-mono">{formatDate(caseData.created_at)}</p>
            </div>
          </div>
        </GlassPanel>

        {/* Complaint Text */}
        <GlassPanel variant="floating">
          <h3 className="text-text-primary font-semibold mb-3">{t.complaint}</h3>
          <p className="text-text-secondary leading-relaxed">{caseData.complaint_text}</p>
        </GlassPanel>

        {/* Resolution Text */}
        {resolutionText && (
          <GlassPanel variant="floating">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-primary font-semibold">{t.resolution}</h3>
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="w-[120px] h-8 bg-bg-elevated border-glass-border">
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
            <p className="text-text-secondary leading-relaxed">{resolutionText}</p>
          </GlassPanel>
        )}

        {/* Linked Case */}
        {caseData.linked_case_id && (
          <GlassPanel variant="floating">
            <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {t.linkedCase}
            </h3>
            <div
              onClick={() => navigate(`/cases/${caseData.linked_case_id}`)}
              className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated backdrop-blur-sm border-[0.5px] border-glass-border hover:bg-white/15 cursor-pointer transition-colors"
            >
              <span className="font-mono text-brand-accent">{caseData.linked_case_id}</span>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Right Column */}
      <div className="lg:w-2/3 flex flex-col gap-[var(--float-gap)] overflow-auto">
        {/* Processing Timeline */}
        <GlassPanel variant="floating" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary font-semibold text-lg">{t.processingTimeline}</h3>
            <Button
              onClick={() => setAuditorOpen(true)}
              variant="outline"
              size="sm"
              className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
            >
              {t.openAuditor}
            </Button>
          </div>

          {runsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 bg-white/15" />
              ))}
            </div>
          ) : agentSteps.length > 0 ? (
            <div className="space-y-4">
              {agentSteps.map((step) => (
                <div key={step.step_number} className="relative">
                  {/* Timeline connector */}
                  {step.step_number < agentSteps.length && (
                    <div className="absolute left-3 top-10 bottom-0 w-px bg-glass-border" />
                  )}

                  <div className="flex gap-4">
                    {/* Agent dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-brand-primary/15 backdrop-blur-sm border-[1.5px] border-brand-primary/60 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-brand-primary" />
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AgentBadge agent={step.agent_name} showModel />
                        <Badge variant="outline" className="text-xs">
                          {step.step_type}
                        </Badge>
                        <span className="text-text-muted text-sm">
                          {formatDuration(step.duration_ms)}
                        </span>
                      </div>

                      {step.output_summary && (
                        <p className="text-text-secondary text-sm mb-2">{step.output_summary}</p>
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
                            className="flex items-center gap-1 text-brand-accent text-sm hover:text-brand-accent/80 transition-colors"
                          >
                            {expandedSteps.has(step.step_number) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {t.reasoning}
                          </button>
                          {expandedSteps.has(step.step_number) && (
                            <div className="mt-2 p-3 rounded-xl bg-bg-elevated backdrop-blur-xl border-[0.5px] border-glass-border">
                              <p className="text-text-secondary text-sm leading-relaxed">
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
            <p className="text-text-muted text-center py-8">{t.noProcessingSteps}</p>
          )}
        </GlassPanel>

        {/* Audit Trail */}
        <GlassPanel variant="floating">
          <h3 className="text-text-primary font-semibold text-lg mb-4">{t.auditTrail}</h3>

          {ledgerLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 bg-white/15" />
              ))}
            </div>
          ) : ledger && ledger.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {ledger.map((entry) => (
                  <div
                    key={entry.ledger_id}
                    className="p-4 rounded-xl bg-bg-elevated backdrop-blur-xl border-[0.5px] border-glass-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AgentBadge agent={entry.agent_name} />
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </div>
                      <span className="text-text-muted text-xs font-mono">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>

                    {entry.decision && (
                      <p className="text-text-secondary text-sm mb-2">{entry.decision}</p>
                    )}

                    {entry.confidence !== undefined && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-text-muted text-xs">{t.confidence}</span>
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden max-w-xs">
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
                        <span className="text-text-secondary text-xs">
                          {(entry.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {entry.state_changes && entry.state_changes.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {entry.state_changes.map((change, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-text-muted">{change.field}:</span>{' '}
                            <span className="text-red-600">{change.before || 'null'}</span>
                            {' → '}
                            <span className="text-green-600">{change.after || 'null'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-text-muted text-center py-8">{t.noAuditTrail}</p>
          )}
        </GlassPanel>
      </div>

      {/* Auditor View */}
      <AuditorView caseId={caseId ?? ''} open={auditorOpen} onOpenChange={setAuditorOpen} />
    </div>
  )
}

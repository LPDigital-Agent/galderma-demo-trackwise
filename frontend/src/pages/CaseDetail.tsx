import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { caseDetail as t, DATE_LOCALE } from '@/i18n'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  AlertTriangle,
  Shield,
  Clock,
} from 'lucide-react'
import { useCase, useCaseRuns, useCaseLedger } from '@/hooks'
import { useLanguageStore } from '@/stores/languageStore'
import { useSacStore } from '@/stores/sacStore'
import { StatusBadge, SeverityBadge, AgentBadge } from '@/components/domain'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AuditorView } from '@/components/overlays/AuditorView'
import { cn } from '@/lib/utils'
import type { Case, Language } from '@/types'

// ── Helpers ──────────────────────────────────────────────
function getResolutionForLanguage(caseData: Case, language: Language): string {
  if (language === 'AUTO') return caseData.resolution_text || ''
  const key = `resolution_text_${language.toLowerCase()}` as keyof Case
  return (caseData[key] as string) || caseData.resolution_text || ''
}

// Reusable label-value field renderer
function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[var(--lg-text-tertiary)] text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('text-[var(--lg-text-primary)]', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function BooleanField({ label, value }: { label: string; value?: boolean | null }) {
  if (value === undefined || value === null) return null
  return (
    <div>
      <p className="text-[var(--lg-text-tertiary)] text-xs uppercase tracking-wider mb-1">{label}</p>
      <Badge
        variant="outline"
        className={cn(
          'text-xs',
          value
            ? 'border-red-400/30 text-red-600 bg-red-500/10'
            : 'border-green-400/30 text-green-600 bg-green-500/10',
        )}
      >
        {value ? t.booleanYes : t.booleanNo}
      </Badge>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────
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
  const isSacOnly = !!sacCase && !caseData

  const firstRun = runs?.[0]
  const agentSteps = firstRun?.agent_steps || []

  const toggleStep = (stepNumber: number) => {
    const next = new Set(expandedSteps)
    if (next.has(stepNumber)) next.delete(stepNumber)
    else next.add(stepNumber)
    setExpandedSteps(next)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
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

  // ── Loading state ─────────────────────────────────────
  if (caseLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--float-gap)]">
        <div className="col-span-full">
          <Skeleton className="h-28 bg-white/10 rounded-2xl" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 bg-white/10 rounded-2xl" />
        ))}
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────
  if (!effectiveCaseData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[var(--lg-text-secondary)]">{t.notFound}</p>
          <Button onClick={() => navigate('/cases')} variant="outline" className="mt-4">
            {t.backToCases}
          </Button>
        </div>
      </div>
    )
  }

  const resolutionText = getResolutionForLanguage(effectiveCaseData, language)

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-[var(--float-gap)]">
      {/* ═══════════════════════════════════════════════════
          CARD 1: Case Header (full-width)
          ═══════════════════════════════════════════════════ */}
      <div className="glass-shell p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cases')}
          className="w-fit text-[var(--lg-text-secondary)] hover:text-[var(--lg-text-primary)]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {t.backToCases}
        </Button>

        <div className="flex items-center gap-3 flex-wrap flex-1">
          <span className="font-mono text-[var(--brand-accent)] text-lg font-semibold">
            {effectiveCaseData.case_id}
          </span>
          <StatusBadge status={effectiveCaseData.status} />
          <SeverityBadge severity={effectiveCaseData.severity} />
          <Badge variant="outline" className="text-xs">
            {effectiveCaseData.case_type.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-sm text-[var(--lg-text-tertiary)] shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{formatDate(effectiveCaseData.created_at)}</span>
          {effectiveCaseData.sla_due_date && (
            <>
              <Separator orientation="vertical" className="h-4 bg-[var(--lg-border-soft)]" />
              <span className="text-xs">SLA: {formatDate(effectiveCaseData.sla_due_date)}</span>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          GRID: 3-column responsive layout
          ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--float-gap)]">

        {/* ─── CARD 2: Product & Complaint ─────────────── */}
        <div className="glass-shell p-6">
          <h3 className="text-[var(--lg-text-primary)] font-semibold mb-4">
            {t.sections.productComplaint}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label={t.labels.productBrand} value={effectiveCaseData.product_brand} />
            <Field label={t.labels.productName} value={effectiveCaseData.product_name} />
            <Field label={t.labels.lotNumber} value={effectiveCaseData.lot_number} mono />
            <Field label={t.labels.expiryDate} value={formatDate(effectiveCaseData.expiry_date)} />
            <Field label={t.labels.manufacturingSite} value={effectiveCaseData.manufacturing_site} />
            <BooleanField label={t.labels.sampleAvailable} value={effectiveCaseData.sample_available} />
          </div>
          {effectiveCaseData.category && (
            <>
              <Separator className="bg-[var(--lg-border-soft)] mb-4" />
              <Field label={t.labels.category} value={effectiveCaseData.category} />
            </>
          )}
          <Separator className="bg-[var(--lg-border-soft)] my-4" />
          <div>
            <p className="text-[var(--lg-text-tertiary)] text-xs uppercase tracking-wider mb-2">
              {t.complaint}
            </p>
            <p className="text-[var(--lg-text-secondary)] leading-relaxed text-sm">
              {effectiveCaseData.complaint_text}
            </p>
          </div>
        </div>

        {/* ─── CARD 3: Reporter & Channel ──────────────── */}
        <div className="glass-shell p-6">
          <h3 className="text-[var(--lg-text-primary)] font-semibold mb-4">
            {t.sections.reporterChannel}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field
              label={t.labels.reporterType}
              value={effectiveCaseData.reporter_type
                ? t.reporterTypes[effectiveCaseData.reporter_type]
                : undefined}
            />
            <Field label={t.labels.reporterCountry} value={effectiveCaseData.reporter_country} />
            <Field
              label={t.labels.receivedChannel}
              value={effectiveCaseData.received_channel
                ? t.receivedChannels[effectiveCaseData.received_channel]
                : undefined}
            />
            <Field label={t.labels.receivedDate} value={formatDate(effectiveCaseData.received_date)} />
          </div>

          <Separator className="bg-[var(--lg-border-soft)] my-4" />

          <div>
            <p className="text-[var(--lg-text-tertiary)] text-xs uppercase tracking-wider mb-1">
              {t.labels.customer}
            </p>
            <p className="text-[var(--lg-text-primary)] font-medium">{effectiveCaseData.customer_name}</p>
            {effectiveCaseData.customer_email && (
              <p className="text-[var(--lg-text-secondary)] text-sm">{effectiveCaseData.customer_email}</p>
            )}
            {effectiveCaseData.customer_phone && (
              <p className="text-[var(--lg-text-secondary)] text-sm">{effectiveCaseData.customer_phone}</p>
            )}
          </div>
        </div>

        {/* ─── CARD 4: Compliance & Regulatory ─────────── */}
        <div className="glass-shell p-6">
          <h3 className="text-[var(--lg-text-primary)] font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--brand-primary)]" />
            {t.sections.complianceRegulatory}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <BooleanField label={t.labels.adverseEventFlag} value={effectiveCaseData.adverse_event_flag} />
            <BooleanField label={t.labels.regulatoryReportable} value={effectiveCaseData.regulatory_reportable} />
          </div>

          <Field
            label={t.labels.regulatoryClassification}
            value={effectiveCaseData.regulatory_classification
              ? t.regulatoryClassifications[effectiveCaseData.regulatory_classification]
              : undefined}
          />

          <Separator className="bg-[var(--lg-border-soft)] my-4" />

          <div className="space-y-3">
            <BooleanField label={t.labels.guardianApproved} value={effectiveCaseData.guardian_approved} />

            {effectiveCaseData.ai_confidence !== undefined && effectiveCaseData.ai_confidence !== null && (
              <div>
                <p className="text-[var(--lg-text-tertiary)] text-xs uppercase tracking-wider mb-1.5">
                  {t.labels.aiConfidence}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        effectiveCaseData.ai_confidence >= 0.8
                          ? 'bg-green-500'
                          : effectiveCaseData.ai_confidence >= 0.6
                            ? 'bg-yellow-500'
                            : 'bg-red-500',
                      )}
                      style={{ width: `${effectiveCaseData.ai_confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[var(--lg-text-secondary)] text-sm font-mono">
                    {(effectiveCaseData.ai_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            <Field label={t.labels.aiRecommendation} value={effectiveCaseData.ai_recommendation} />
          </div>
        </div>

        {/* ─── CARD 5: Investigation ───────────────────── */}
        <div className="glass-shell p-6">
          <h3 className="text-[var(--lg-text-primary)] font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--brand-primary)]" />
            {t.sections.investigation}
          </h3>
          <div className="space-y-4">
            <Field
              label={t.labels.investigationStatus}
              value={effectiveCaseData.investigation_status
                ? t.investigationStatuses[effectiveCaseData.investigation_status]
                : undefined}
            />
            <Field label={t.labels.assignedInvestigator} value={effectiveCaseData.assigned_investigator} />
            <Field label={t.labels.rootCause} value={effectiveCaseData.root_cause} />
            <Field label={t.labels.capaReference} value={effectiveCaseData.capa_reference} mono />
          </div>
        </div>

        {/* ─── CARD 6: Resolution (2-col span) ─────────── */}
        <div className="glass-shell p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--lg-text-primary)] font-semibold">{t.sections.resolution}</h3>
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

          {resolutionText ? (
            <p className="text-[var(--lg-text-secondary)] leading-relaxed">{resolutionText}</p>
          ) : (
            <p className="text-[var(--lg-text-tertiary)] text-sm italic">—</p>
          )}

          <Separator className="bg-[var(--lg-border-soft)] my-4" />

          <div className="flex flex-wrap gap-6">
            <Field label={t.labels.processedByAgent} value={effectiveCaseData.processed_by_agent} />
            {effectiveCaseData.linked_case_id && (
              <div>
                <p className="text-[var(--lg-text-tertiary)] text-xs uppercase tracking-wider mb-1">
                  {t.linkedCase}
                </p>
                <button
                  onClick={() => navigate(`/cases/${effectiveCaseData.linked_case_id}`)}
                  className="flex items-center gap-1.5 font-mono text-[var(--brand-accent)] hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {effectiveCaseData.linked_case_id}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── CARD 7: Processing Timeline (2-col span) ── */}
        <div className="glass-shell p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--lg-text-primary)] font-semibold text-lg">
              {t.sections.processingTimeline}
            </h3>
            <Button
              onClick={() => setAuditorOpen(true)}
              variant="outline"
              size="sm"
              className="border-white/15 text-[var(--brand-primary)] hover:bg-white/10"
            >
              {t.openAuditor}
            </Button>
          </div>

          {isSacOnly ? (
            <p className="text-[var(--lg-text-tertiary)] text-center py-8 text-sm italic">
              {t.awaitingProcessing}
            </p>
          ) : runsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 bg-white/10 rounded-xl" />
              ))}
            </div>
          ) : agentSteps.length > 0 ? (
            <div>
              {agentSteps.map((step, idx) => (
                <div
                  key={step.step_number}
                  className={cn(
                    'py-4',
                    idx < agentSteps.length - 1 && 'border-b border-[var(--lg-border-soft)]',
                  )}
                >
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border-[1.5px] border-[var(--brand-primary)]/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                      </div>
                      {idx < agentSteps.length - 1 && (
                        <div className="absolute left-[11px] top-7 bottom-[-16px] w-px bg-[var(--lg-border-soft)]" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <AgentBadge agent={step.agent_name} showModel />
                        <Badge variant="outline" className="text-xs">
                          {step.step_type}
                        </Badge>
                        <span className="text-[var(--lg-text-tertiary)] text-sm font-mono">
                          {formatDuration(step.duration_ms)}
                        </span>
                      </div>

                      {step.output_summary && (
                        <p className="text-[var(--lg-text-secondary)] text-sm mb-2">{step.output_summary}</p>
                      )}

                      {step.tools_called && step.tools_called.length > 0 && (
                        <div className="flex gap-1.5 mb-2 flex-wrap">
                          {step.tools_called.map((tool, toolIdx) => (
                            <Badge key={toolIdx} variant="secondary" className="text-xs">
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
                            <div className="mt-2 p-3 bg-white/5 rounded-lg">
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
        </div>

        {/* ─── CARD 8: Audit Trail ─────────────────────── */}
        <div className="glass-shell p-6">
          <h3 className="text-[var(--lg-text-primary)] font-semibold text-lg mb-4">
            {t.sections.auditTrail}
          </h3>

          {isSacOnly ? (
            <p className="text-[var(--lg-text-tertiary)] text-center py-8 text-sm italic">
              {t.awaitingProcessing}
            </p>
          ) : ledgerLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 bg-white/10 rounded-xl" />
              ))}
            </div>
          ) : ledger && ledger.length > 0 ? (
            <ScrollArea className="h-[480px]">
              <div>
                {ledger.map((entry, idx) => (
                  <div
                    key={entry.ledger_id}
                    className={cn(
                      'py-3',
                      idx < ledger.length - 1 && 'border-b border-[var(--lg-border-soft)]',
                    )}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <AgentBadge agent={entry.agent_name} />
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </div>
                      <span className="text-[var(--lg-text-tertiary)] text-xs font-mono shrink-0 ml-2">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>

                    {entry.decision && (
                      <p className="text-[var(--lg-text-secondary)] text-sm mb-1.5">{entry.decision}</p>
                    )}

                    {entry.confidence !== undefined && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[var(--lg-text-tertiary)] text-xs">{t.confidence}</span>
                        <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              entry.confidence >= 0.8
                                ? 'bg-green-500'
                                : entry.confidence >= 0.6
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500',
                            )}
                            style={{ width: `${entry.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[var(--lg-text-secondary)] text-xs font-mono">
                          {(entry.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {entry.state_changes && entry.state_changes.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {entry.state_changes.map((change, changeIdx) => (
                          <div key={changeIdx} className="text-xs">
                            <span className="text-[var(--lg-text-tertiary)]">{change.field}:</span>{' '}
                            <span className="text-red-500">{change.before || 'null'}</span>
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
            <p className="text-[var(--lg-text-tertiary)] text-center py-8">{t.noAuditTrail}</p>
          )}
        </div>
      </div>

      {/* Auditor View */}
      <AuditorView caseId={caseId ?? ''} open={auditorOpen} onOpenChange={setAuditorOpen} />
    </div>
  )
}

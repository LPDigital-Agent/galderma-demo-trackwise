// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: CSV Pack - Computer System Validation
// ============================================

import { useState } from 'react'
import { Shield, FileText, Database, Download, Loader2, CheckCircle2, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { csvPack as t, DATE_LOCALE } from '@/i18n'
import { generateCSVPack, type CSVPackResult, type CSVPackArtifact } from '@/api/client'
import { GlassPanel } from '@/components/domain/GlassPanel'
import { EmptyState } from '@/components/domain/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ============================================
// Helper Functions
// ============================================
function getArtifactIcon(artifactType: string) {
  if (artifactType.toLowerCase().includes('compliance') || artifactType.toLowerCase().includes('validation')) {
    return Shield
  }
  if (artifactType.toLowerCase().includes('data') || artifactType.toLowerCase().includes('ledger')) {
    return Database
  }
  return FileText
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString(DATE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function downloadArtifact(artifact: CSVPackArtifact) {
  // Generate artifact content based on type (PT-BR)
  let content = ''

  if (artifact.artifact_type.includes('Validation')) {
    content = t.downloadContent.validation(artifact.title, artifact.description, artifact.artifact_id, artifact.status)
  } else if (artifact.artifact_type.includes('Report')) {
    content = t.downloadContent.report(artifact.title, artifact.description, artifact.artifact_id, artifact.status)
  } else {
    content = t.downloadContent.generic(artifact.title, artifact.description, artifact.artifact_id, artifact.status)
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${artifact.artifact_id}.txt`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(t.toasts.downloaded(artifact.title))
}

// ============================================
// CSV Pack Page Component
// ============================================
export default function CSVPack() {
  const [result, setResult] = useState<CSVPackResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const packResult = await generateCSVPack()
      setResult(packResult)
      toast.success(t.toasts.success)
    } catch (error) {
      console.error('Failed to generate CSV Pack:', error)
      toast.error(t.toasts.error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.title}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t.subtitle}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.generating}
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                {t.generatePack}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        {!result ? (
          <EmptyState
            icon={Shield}
            title={t.empty.title}
            description={t.empty.description}
            action={
              <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {t.generatePack}
                  </>
                )}
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Summary Banner */}
            <GlassPanel className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t.packGenerated}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {t.readyForAudit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-600 border-green-200"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.auditReady}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-600 border-green-200"
                  >
                    {result.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {t.summary.packId}
                  </div>
                  <div className="text-sm font-mono text-cyan-600 mt-1">
                    {result.pack_id}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {t.summary.generatedAt}
                  </div>
                  <div className="text-sm text-[var(--text-primary)] mt-1">
                    {formatDate(result.generated_at)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {t.summary.casesAnalyzed}
                  </div>
                  <div className="text-sm font-mono text-[var(--text-primary)] mt-1">
                    {result.total_cases_analyzed}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {t.summary.complianceStandard}
                  </div>
                  <div className="text-sm font-mono text-[var(--text-primary)] mt-1">
                    {result.compliance_standard}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {t.summary.closedCases}
                  </div>
                  <div className="text-sm font-mono text-green-600 mt-1">
                    {result.closed_cases}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {t.summary.totalLedgerEntries}
                  </div>
                  <div className="text-sm font-mono text-[var(--text-primary)] mt-1">
                    {result.total_ledger_entries}
                  </div>
                </div>
              </div>
            </GlassPanel>

            {/* Artifacts Grid */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {t.complianceArtifacts} ({result.artifacts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.artifacts.map((artifact) => {
                  const Icon = getArtifactIcon(artifact.artifact_type)
                  return (
                    <GlassPanel key={artifact.artifact_id} className="p-5 hover:border-[var(--brand-primary)]/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-[var(--brand-primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                            {artifact.title}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                            {artifact.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                artifact.status === 'COMPLETE'
                                  ? 'bg-green-50 text-green-600 border-green-200'
                                  : 'bg-amber-50 text-amber-600 border-amber-200'
                              )}
                            >
                              {artifact.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadArtifact(artifact)}
                              className="gap-1 h-7 px-2 text-xs"
                            >
                              <Download className="w-3 h-3" />
                              {t.download}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">{t.artifactId}</span>
                          <span className="font-mono text-cyan-600">{artifact.artifact_id}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-[var(--text-muted)]">{t.type}</span>
                          <span className="font-mono text-[var(--text-secondary)]">{artifact.artifact_type}</span>
                        </div>
                      </div>
                    </GlassPanel>
                  )
                })}
              </div>
            </div>

            {/* Extensibility Roadmap */}
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-[var(--brand-accent)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t.extensibility.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t.extensibility.description}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {t.extensibility.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--glass-border)]"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {item.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-4 shrink-0 text-[10px]',
                        item.status === 'EM DESENVOLVIMENTO'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  )
}

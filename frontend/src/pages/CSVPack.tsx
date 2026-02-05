// ============================================
// Galderma TrackWise AI Autopilot Demo
// CSVPack Page - CSV Pack Generator
// ============================================

import { useState, useCallback } from 'react'
import {
  Package,
  FileText,
  CheckCircle2,
  Shield,
  Download,
  Clock,
  AlertTriangle,
  Brain,
  List,
  History,
  Database,
} from 'lucide-react'
import { GlassCard, Button, Badge } from '@/components/ui'
import type { CSVPackResult, CSVPackArtifact } from '@/api/client'
import { generateCSVPack } from '@/api/client'

const ARTIFACT_ICONS: Record<string, typeof FileText> = {
  URS: FileText,
  RiskAssessment: Shield,
  TraceabilityMatrix: List,
  TestExecutionLogs: CheckCircle2,
  VersionHistory: History,
  MemoryDump: Database,
}

const ARTIFACT_COLORS: Record<string, string> = {
  URS: '#06B6D4',
  RiskAssessment: '#EF4444',
  TraceabilityMatrix: '#8B5CF6',
  TestExecutionLogs: '#10B981',
  VersionHistory: '#F59E0B',
  MemoryDump: '#6366F1',
}

/**
 * CSVPack Page
 *
 * Generate Computer System Validation (CSV) compliance documentation.
 * CSV = Computer System Validation (21 CFR Part 11), NOT Comma Separated Values.
 *
 * Generates 6 artifacts from current case data:
 * 1. URS (User Requirements Specification)
 * 2. Risk Assessment (FMEA)
 * 3. Traceability Matrix
 * 4. Test Execution Logs
 * 5. Version History
 * 6. Memory Dump
 */
export function CSVPack() {
  const [pack, setPack] = useState<CSVPackResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const result = await generateCSVPack()
      setPack(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate CSV Pack')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleDownloadArtifact = useCallback((artifact: CSVPackArtifact) => {
    const json = JSON.stringify(artifact, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.artifact_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleDownloadAll = useCallback(() => {
    if (!pack) return
    const json = JSON.stringify(pack, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pack.pack_id}-full-pack.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [pack])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">CSV Pack</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Computer System Validation compliance documentation (21 CFR Part 11)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pack && (
            <Button variant="secondary" size="md" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" />
              Download All
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Pack'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <GlassCard>
          <div className="flex items-center gap-3 text-[var(--status-error)]">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </GlassCard>
      )}

      {/* Pack Summary */}
      {pack && (
        <GlassCard variant="elevated">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[var(--status-success)]" />
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">Pack {pack.pack_id}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{pack.compliance_standard}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--brand-primary)]" />
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {new Date(pack.generated_at).toLocaleString()}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Generated</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {pack.total_cases_analyzed} cases / {pack.total_ledger_entries} entries
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Data analyzed</p>
              </div>
            </div>
            <Badge variant="success">{pack.artifacts.length} ARTIFACTS</Badge>
          </div>
        </GlassCard>
      )}

      {/* Artifacts Grid */}
      {pack ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Artifacts</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pack.artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.artifact_id}
                artifact={artifact}
                onDownload={() => handleDownloadArtifact(artifact)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Info card when no pack generated */}
          <GlassCard>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">What is CSV Pack?</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  The CSV Pack generates complete Computer System Validation documentation required for
                  FDA 21 CFR Part 11 compliance. Each pack includes 6 essential artifacts generated from
                  the agent processing data.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'User Requirements Specification', type: 'URS' },
                  { name: 'Risk Assessment (FMEA)', type: 'RiskAssessment' },
                  { name: 'Traceability Matrix', type: 'TraceabilityMatrix' },
                  { name: 'Test Execution Logs', type: 'TestExecutionLogs' },
                  { name: 'Version History', type: 'VersionHistory' },
                  { name: 'AgentCore Memory Dump', type: 'MemoryDump' },
                ].map(({ name, type }) => {
                  const Icon = ARTIFACT_ICONS[type] ?? FileText
                  const color = ARTIFACT_COLORS[type] ?? 'var(--brand-primary)'
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-3 rounded-[var(--border-radius-sm)] border border-[var(--glass-border)] p-3"
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                      <span className="text-sm text-[var(--text-primary)]">{name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </GlassCard>

          {/* Empty state */}
          <GlassCard>
            <div className="flex min-h-[200px] items-center justify-center py-12">
              <div className="text-center">
                <Package className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
                <p className="mt-4 text-sm text-[var(--text-secondary)]">No CSV packs generated yet</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Click &quot;Generate Pack&quot; to create compliance documentation from current case data
                </p>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}

function ArtifactCard({
  artifact,
  onDownload,
}: {
  artifact: CSVPackArtifact
  onDownload: () => void
}) {
  const Icon = ARTIFACT_ICONS[artifact.artifact_type] ?? FileText
  const color = ARTIFACT_COLORS[artifact.artifact_type] ?? 'var(--brand-primary)'

  return (
    <GlassCard variant="hover">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{artifact.title}</h3>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{artifact.artifact_id}</p>
          </div>
        </div>
        <Badge variant="success">{artifact.status}</Badge>
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">{artifact.description}</p>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-3">
        <span className="text-xs text-[var(--text-tertiary)]">{artifact.artifact_type}</span>
        <Button variant="ghost" size="sm" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
          JSON
        </Button>
      </div>
    </GlassCard>
  )
}

// ============================================
// Galderma TrackWise AI Autopilot Demo
// CreateCaseModal - Case Creation Form
// ============================================

import { useState, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { GlassCard, Button } from '@/components/ui'
import { useCreateCase } from '@/hooks'
import type { CaseType } from '@/types'

interface CreateCaseModalProps {
  onClose: () => void
  onSuccess?: (caseId: string) => void
}

// Realistic Galderma products for the demo
const PRODUCTS = [
  { brand: 'Cetaphil', name: 'Gentle Skin Cleanser' },
  { brand: 'Cetaphil', name: 'Moisturizing Cream' },
  { brand: 'Cetaphil', name: 'Daily Facial Cleanser' },
  { brand: 'Differin', name: 'Adapalene Gel 0.1%' },
  { brand: 'Epiduo', name: 'Adapalene/BPO Gel' },
  { brand: 'Restylane', name: 'Lyft' },
  { brand: 'Azzalure', name: 'Botulinum Toxin Type A' },
  { brand: 'Sculptra', name: 'Poly-L-lactic Acid' },
]

const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'INQUIRY', label: 'Inquiry' },
  { value: 'ADVERSE_EVENT', label: 'Adverse Event' },
]

/**
 * CreateCaseModal
 *
 * Simple modal for creating demo cases with realistic Galderma product data.
 * Uses the existing useCreateCase mutation hook.
 */
export function CreateCaseModal({ onClose, onSuccess }: CreateCaseModalProps) {
  const createCase = useCreateCase()
  const [selectedProduct, setSelectedProduct] = useState(0)
  const [caseType, setCaseType] = useState<CaseType>('COMPLAINT')
  const [customerName, setCustomerName] = useState('Maria Santos')
  const [complaintText, setComplaintText] = useState('')

  const product = PRODUCTS[selectedProduct]!

  const handleSubmit = useCallback(async () => {
    if (!complaintText.trim()) return

    createCase.mutate(
      {
        product_brand: product.brand,
        product_name: product.name,
        complaint_text: complaintText.trim(),
        customer_name: customerName.trim() || 'Demo Customer',
        case_type: caseType,
      },
      {
        onSuccess: (newCase) => {
          onSuccess?.(newCase.case_id)
          onClose()
        },
      }
    )
  }, [complaintText, product, customerName, caseType, createCase, onSuccess, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <GlassCard variant="elevated" className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[var(--brand-primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Create Case</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Product */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
            >
              {PRODUCTS.map((p, i) => (
                <option key={i} value={i} className="bg-[#1a1a2e]">
                  {p.brand} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Case Type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Type
            </label>
            <div className="flex gap-2">
              {CASE_TYPES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={caseType === value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCaseType(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
              placeholder="Customer name"
            />
          </div>

          {/* Complaint Text */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Complaint Text
            </label>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
              placeholder="Describe the complaint, inquiry, or adverse event..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!complaintText.trim() || createCase.isPending}
          >
            {createCase.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {createCase.isPending ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

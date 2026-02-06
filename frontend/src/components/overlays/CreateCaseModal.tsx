import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateCase } from '@/hooks'
import { createCase as t } from '@/i18n'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { CaseType, ComplaintCategory } from '@/types'

interface CreateCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCaseModal({ open, onOpenChange }: CreateCaseModalProps) {
  const { mutate: createCase, isPending } = useCreateCase()

  const [customerName, setCustomerName] = useState('')
  const [productBrand, setProductBrand] = useState('')
  const [productName, setProductName] = useState('')
  const [complaintText, setComplaintText] = useState('')
  const [caseType, setCaseType] = useState<CaseType>('COMPLAINT')
  const [category, setCategory] = useState<ComplaintCategory | ''>('')
  const [lotNumber, setLotNumber] = useState('')

  const resetForm = () => {
    setCustomerName('')
    setProductBrand('')
    setProductName('')
    setComplaintText('')
    setCaseType('COMPLAINT')
    setCategory('')
    setLotNumber('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim() || !productBrand || !productName.trim() || !complaintText.trim()) {
      toast.error(t.toasts.fillRequired)
      return
    }

    createCase(
      {
        customer_name: customerName.trim(),
        product_brand: productBrand,
        product_name: productName.trim(),
        complaint_text: complaintText.trim(),
        case_type: caseType,
        category: category || undefined,
        lot_number: lotNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t.toasts.success)
          resetForm()
          onOpenChange(false)
        },
        onError: (error) => {
          console.error('Failed to create case:', error)
          toast.error(t.toasts.error)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/12 backdrop-blur-3xl border-[0.5px] border-[var(--lg-border-soft)] rounded-2xl shadow-[var(--shadow-elevated)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--lg-text-primary)]">{t.title}</DialogTitle>
          <DialogDescription className="text-[var(--lg-text-secondary)]">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <Label htmlFor="customerName" className="text-[var(--lg-text-secondary)]">
              {t.fields.customerName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t.placeholders.customerName}
              className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)]"
              required
            />
          </div>

          {/* Product Brand */}
          <div>
            <Label htmlFor="productBrand" className="text-[var(--lg-text-secondary)]">
              {t.fields.productBrand} <span className="text-red-500">*</span>
            </Label>
            <Select value={productBrand} onValueChange={setProductBrand} required>
              <SelectTrigger className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)]">
                <SelectValue placeholder={t.placeholders.selectBrand} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cetaphil">Cetaphil</SelectItem>
                <SelectItem value="Differin">Differin</SelectItem>
                <SelectItem value="Restylane">Restylane</SelectItem>
                <SelectItem value="Sculptra">Sculptra</SelectItem>
                <SelectItem value="Azzalure">Azzalure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Name */}
          <div>
            <Label htmlFor="productName" className="text-[var(--lg-text-secondary)]">
              {t.fields.productName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t.placeholders.productName}
              className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)]"
              required
            />
          </div>

          {/* Complaint Text */}
          <div>
            <Label htmlFor="complaintText" className="text-[var(--lg-text-secondary)]">
              {t.fields.complaintText} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="complaintText"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder={t.placeholders.complaintText}
              className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)] min-h-[100px]"
              required
            />
          </div>

          {/* Case Type */}
          <div>
            <Label htmlFor="caseType" className="text-[var(--lg-text-secondary)]">
              {t.fields.caseType} <span className="text-red-500">*</span>
            </Label>
            <Select value={caseType} onValueChange={(val) => setCaseType(val as CaseType)} required>
              <SelectTrigger className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLAINT">{t.caseTypes.COMPLAINT}</SelectItem>
                <SelectItem value="INQUIRY">{t.caseTypes.INQUIRY}</SelectItem>
                <SelectItem value="ADVERSE_EVENT">{t.caseTypes.ADVERSE_EVENT}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-[var(--lg-text-secondary)]">
              {t.fields.category}
            </Label>
            <Select value={category} onValueChange={(val) => setCategory(val as ComplaintCategory)}>
              <SelectTrigger className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)]">
                <SelectValue placeholder={t.placeholders.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PACKAGING">{t.categories.PACKAGING}</SelectItem>
                <SelectItem value="QUALITY">{t.categories.QUALITY}</SelectItem>
                <SelectItem value="EFFICACY">{t.categories.EFFICACY}</SelectItem>
                <SelectItem value="SAFETY">{t.categories.SAFETY}</SelectItem>
                <SelectItem value="DOCUMENTATION">{t.categories.DOCUMENTATION}</SelectItem>
                <SelectItem value="SHIPPING">{t.categories.SHIPPING}</SelectItem>
                <SelectItem value="OTHER">{t.categories.OTHER}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lot Number */}
          <div>
            <Label htmlFor="lotNumber" className="text-[var(--lg-text-secondary)]">
              {t.fields.lotNumber}
            </Label>
            <Input
              id="lotNumber"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder={t.placeholders.lotNumber}
              className="bg-white/10 backdrop-blur-sm border-[0.5px] border-[var(--lg-border-soft)] text-[var(--lg-text-primary)] font-mono"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-[var(--lg-text-secondary)] hover:text-[var(--lg-text-primary)]"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white"
            >
              {isPending ? t.submitting : t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

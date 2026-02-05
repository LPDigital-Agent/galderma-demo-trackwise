import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateCase } from '@/hooks'
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
      toast.error('Please fill in all required fields')
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
          toast.success('Case created successfully')
          resetForm()
          onOpenChange(false)
        },
        onError: (error) => {
          console.error('Failed to create case:', error)
          toast.error('Failed to create case')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-bg-surface border-glass-border">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Create New Case</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Enter the details for the new complaint or inquiry case.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <Label htmlFor="customerName" className="text-text-secondary">
              Customer Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="bg-glass-bg border-glass-border text-text-primary"
              required
            />
          </div>

          {/* Product Brand */}
          <div>
            <Label htmlFor="productBrand" className="text-text-secondary">
              Product Brand <span className="text-red-400">*</span>
            </Label>
            <Select value={productBrand} onValueChange={setProductBrand} required>
              <SelectTrigger className="bg-glass-bg border-glass-border text-text-primary">
                <SelectValue placeholder="Select a brand" />
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
            <Label htmlFor="productName" className="text-text-secondary">
              Product Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Daily Facial Cleanser"
              className="bg-glass-bg border-glass-border text-text-primary"
              required
            />
          </div>

          {/* Complaint Text */}
          <div>
            <Label htmlFor="complaintText" className="text-text-secondary">
              Complaint / Inquiry <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="complaintText"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Describe the complaint or inquiry in detail..."
              className="bg-glass-bg border-glass-border text-text-primary min-h-[100px]"
              required
            />
          </div>

          {/* Case Type */}
          <div>
            <Label htmlFor="caseType" className="text-text-secondary">
              Case Type <span className="text-red-400">*</span>
            </Label>
            <Select value={caseType} onValueChange={(val) => setCaseType(val as CaseType)} required>
              <SelectTrigger className="bg-glass-bg border-glass-border text-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPLAINT">Complaint</SelectItem>
                <SelectItem value="INQUIRY">Inquiry</SelectItem>
                <SelectItem value="ADVERSE_EVENT">Adverse Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-text-secondary">
              Category
            </Label>
            <Select value={category} onValueChange={(val) => setCategory(val as ComplaintCategory)}>
              <SelectTrigger className="bg-glass-bg border-glass-border text-text-primary">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PACKAGING">Packaging</SelectItem>
                <SelectItem value="QUALITY">Quality</SelectItem>
                <SelectItem value="EFFICACY">Efficacy</SelectItem>
                <SelectItem value="SAFETY">Safety</SelectItem>
                <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                <SelectItem value="SHIPPING">Shipping</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lot Number */}
          <div>
            <Label htmlFor="lotNumber" className="text-text-secondary">
              Lot Number
            </Label>
            <Input
              id="lotNumber"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="LOT-12345"
              className="bg-glass-bg border-glass-border text-text-primary font-mono"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
            >
              {isPending ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

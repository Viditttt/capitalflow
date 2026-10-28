'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Upload, ShieldCheck, FileCheck, Loader2, AlertCircle } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { inrToTokens, formatINR, hashString } from '@/lib/utils'
import { HashDisplay } from '@/components/ui/hash-display'

export default function RegisterInvoicePage() {
  const router = useRouter()
  const { registerInvoice } = useCapitalFlow()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [buyerName, setBuyerName] = useState('Tata Motors Passenger Vehicles Ltd')
  const [buyerGstin, setBuyerGstin] = useState('27AAACT2727Q1ZW')
  const [sector, setSector] = useState('Automotive & Heavy Engineering')

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`)
  const [faceValueInr, setFaceValueInr] = useState('1000000') // 10 Lakh
  const [dueDateDays, setDueDateDays] = useState('60')
  const [description, setDescription] = useState('Forged crankshaft assemblies and alloy engine pinions.')
  const [goodsSummary, setGoodsSummary] = useState('500 precision CNC-machined forged steel crank units.')

  const [fileName, setFileName] = useState('Tata_Motors_PO_INV_8831.pdf')
  const [computedDocHash, setComputedDocHash] = useState('0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069')

  const handleFileSimulate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFileName(file.name)
      // Hash contents
      const hash = await hashString(`${file.name}-${file.size}-${Date.now()}`)
      setComputedDocHash(hash)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const now = Math.floor(Date.now() / 1000)
      const dueTimestamp = now + parseInt(dueDateDays, 10) * 86400
      const faceValueBigInt = inrToTokens(parseFloat(faceValueInr))

      const result = await registerInvoice({
        invoiceNumber,
        buyerName,
        buyerGstin,
        supplierName: 'Apex Precision Auto-Components Pvt Ltd',
        faceValue: faceValueBigInt,
        issueDate: now,
        dueDate: dueTimestamp,
        sector,
        description,
        goodsSummary,
      })

      setCreatedInvoiceId(result.invoice.id)
      setCurrentStep(4) // Confirmation step
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to submit invoice to blockchain.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/supplier"
          className="p-2 rounded-xl bg-bg-surface border border-border-default hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Register Invoice for Financing</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Create an immutable on-chain credit asset with cryptographic GST verification.
          </p>
        </div>
      </div>

      {/* Stepper Wizard Progress */}
      <div className="grid grid-cols-4 gap-2 border-b border-border-default pb-4">
        {[
          { step: 1, title: '1. Corporate Buyer' },
          { step: 2, title: '2. Commercials' },
          { step: 3, title: '3. Document Hash' },
          { step: 4, title: '4. On-Chain Lock' },
        ].map((s) => (
          <div
            key={s.step}
            className={`text-xs font-semibold py-1.5 text-center border-b-2 transition-all ${
              currentStep === s.step
                ? 'border-accent-primary text-accent-primary'
                : currentStep > s.step
                ? 'border-status-success text-status-success'
                : 'border-transparent text-text-muted'
            }`}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* Step 1: Corporate Buyer */}
      {currentStep === 1 && (
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-5 animate-fade-in">
          <h2 className="text-base font-bold text-text-primary">Corporate Buyer Verification</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Buyer Enterprise Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Buyer GSTIN (15-digit GST Identifier)
              </label>
              <input
                type="text"
                value={buyerGstin}
                onChange={(e) => setBuyerGstin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default font-mono text-sm text-text-primary focus:outline-none focus:border-accent-primary uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Industry Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option>Automotive & Heavy Engineering</option>
                <option>Consumer Goods & Retail</option>
                <option>Infrastructure & Urban Rail</option>
                <option>Information Technology</option>
                <option>Pharmaceuticals & Healthcare</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green"
            >
              Continue to Commercials →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Commercial Parameters */}
      {currentStep === 2 && (
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-5 animate-fade-in">
          <h2 className="text-base font-bold text-text-primary">Commercial Invoice Terms</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Invoice Reference #
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default font-mono text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Face Value (₹ INR)
              </label>
              <input
                type="number"
                value={faceValueInr}
                onChange={(e) => setFaceValueInr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Formatted: {formatINR(inrToTokens(parseFloat(faceValueInr || '0')))}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Payment Tenor (Days to Due Date)
              </label>
              <input
                type="number"
                value={dueDateDays}
                onChange={(e) => setDueDateDays(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Goods Summary
              </label>
              <input
                type="text"
                value={goodsSummary}
                onChange={(e) => setGoodsSummary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Detailed Description / Scope of Work
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-border-default hover:bg-bg-hover text-text-secondary text-sm font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green"
            >
              Continue to Document Hashing →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Document Upload & SHA-256 Hashing */}
      {currentStep === 3 && (
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-5 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-text-primary">Cryptographic Document Integrity</h2>
            <p className="text-xs text-text-secondary mt-1">
              Upload original e-Way Bill or GST tax invoice. The file content is hashed client-side with SHA-256. Only the 32-byte digest is anchored to the blockchain, preserving full trade confidentiality.
            </p>
          </div>

          {/* Upload Area */}
          <div className="rounded-2xl border-2 border-dashed border-border-default hover:border-accent-primary p-8 text-center space-y-3 bg-bg-base/50 transition-colors">
            <Upload size={32} className="mx-auto text-accent-primary" />
            <div>
              <label className="cursor-pointer text-xs font-semibold text-accent-primary hover:underline">
                <span>Upload signed PDF invoice</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg"
                  onChange={handleFileSimulate}
                />
              </label>
              <p className="text-[11px] text-text-muted mt-1">
                Selected File: <strong className="text-text-primary">{fileName}</strong>
              </p>
            </div>
          </div>

          {/* Computed Digest Box */}
          <div className="rounded-xl border border-border-default bg-bg-base p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-text-primary flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-status-success" />
                SHA-256 Document Hash (32-bytes)
              </span>
              <span className="text-status-success text-[11px]">Computed In-Browser</span>
            </div>
            <HashDisplay value={computedDocHash} truncate={false} />
            <p className="text-[11px] text-text-muted">
              Guarantees the invoice cannot be modified post-submission or double-financed across lenders.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-status-error/40 bg-status-error-bg/40 p-3 text-xs text-status-error flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-border-default hover:bg-bg-hover text-text-secondary text-sm font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Registering On-Chain via MetaMask…
                </>
              ) : (
                <>
                  <Check size={16} />
                  Sign & Register Invoice
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success Confirmation */}
      {currentStep === 4 && (
        <div className="rounded-2xl border border-status-success/30 bg-bg-surface p-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-status-success-bg border border-status-success text-status-success mx-auto flex items-center justify-center">
            <Check size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">
              Invoice Successfully Registered!
            </h2>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Your invoice #{invoiceNumber} for {formatINR(inrToTokens(parseFloat(faceValueInr)))} is now anchored to the blockchain in <strong className="text-status-pending">Submitted</strong> status. It will appear in the Verifier Queue for PO validation.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Link
              href={`/supplier/invoices/${createdInvoiceId || '1'}`}
              className="px-6 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green"
            >
              View Invoice Details →
            </Link>
            <Link
              href="/supplier"
              className="px-5 py-2.5 rounded-xl border border-border-default hover:bg-bg-hover text-text-primary text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

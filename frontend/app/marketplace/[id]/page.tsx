'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Calculator, ShieldCheck, Loader2, AlertCircle, Coins } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining, impliedAnnualisedBps } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { RiskScore } from '@/components/ui/risk-score'

export default function SubmitOfferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const invoiceId = resolvedParams.id
  const { invoices, submitOffer } = useCapitalFlow()

  const invoice = invoices.find((inv) => inv.id === invoiceId)

  // Sliders and Inputs
  const [advanceRatePercent, setAdvanceRatePercent] = useState(80)
  const [feeRatePercent, setFeeRatePercent] = useState(5.0)
  const [validityDays, setValidityDays] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Calculate terms
  const terms = useMemo(() => {
    if (!invoice) return null
    const faceValue = invoice.faceValue
    const advanceBps = BigInt(advanceRatePercent * 100)
    const principal = (faceValue * advanceBps) / 10000n
    const fee = (principal * BigInt(Math.round(feeRatePercent * 100))) / 10000n
    const serviceFee = (principal * 50n) / 10000n // 0.50%
    const supplierNetAdvance = principal - serviceFee
    const totalDue = principal + fee
    const supplierResidual = faceValue > totalDue ? faceValue - totalDue : 0n

    const tenorDays = Math.max(1, daysRemaining(invoice.dueDate))
    const aprBps = impliedAnnualisedBps(principal, fee, tenorDays)
    const aprPercent = (aprBps / 100).toFixed(2)

    return {
      principal,
      fee,
      serviceFee,
      supplierNetAdvance,
      totalDue,
      supplierResidual,
      aprPercent,
      tenorDays,
    }
  }, [invoice, advanceRatePercent, feeRatePercent])

  if (!invoice || !terms) {
    return (
      <div className="space-y-4">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary">
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>
        <div className="rounded-2xl border border-border-default p-12 text-center">
          <h2 className="text-lg font-bold text-text-primary">Invoice Not Found</h2>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await submitOffer({
        invoiceId: invoice.id,
        principal: terms.principal,
        fee: terms.fee,
        advanceRateBps: advanceRatePercent * 100,
        validitySeconds: validityDays * 86400,
        impliedApr: parseFloat(terms.aprPercent),
      })
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to submit offer to escrow.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketplace"
          className="p-2 rounded-xl bg-bg-surface border border-border-default hover:bg-bg-hover text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Submit Financing Offer (Escrow Deposit)
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Lock capital into smart contract escrow. Funds are transferred to the supplier only upon offer acceptance.
          </p>
        </div>
      </div>

      {/* Invoice Details Banner */}
      <div className="rounded-2xl border border-border-default bg-bg-surface p-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-text-muted">Enterprise Obligor</span>
          <div className="font-bold text-text-primary text-sm mt-0.5">{invoice.buyerName}</div>
          <div className="text-[11px] text-text-muted font-mono">{invoice.buyerGstin}</div>
        </div>
        <div>
          <span className="text-text-muted">Invoice Face Value</span>
          <div className="font-bold text-text-primary text-base mt-0.5">{formatINR(invoice.faceValue)}</div>
        </div>
        <div>
          <span className="text-text-muted">Maturity Date</span>
          <div className="font-semibold text-text-primary mt-0.5">{formatDate(invoice.dueDate)}</div>
          <div className="text-[11px] text-text-muted">Due in {terms.tenorDays} days</div>
        </div>
        <div>
          <span className="text-text-muted">Audited Risk Grade</span>
          <div className="mt-1">
            <RiskScore score={invoice.riskScore} />
          </div>
        </div>
      </div>

      {/* Interactive Offer Builder & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Configuration Sliders */}
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-accent-secondary" />
            <h2 className="text-base font-bold text-text-primary">Offer Configuration</h2>
          </div>

          <div className="space-y-5 text-xs">
            {/* Advance Rate */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-medium">
                <span className="text-text-secondary">Advance Rate</span>
                <span className="font-bold text-accent-secondary text-sm">{advanceRatePercent}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="1"
                value={advanceRatePercent}
                onChange={(e) => setAdvanceRatePercent(parseInt(e.target.value, 10))}
                className="w-full accent-accent-secondary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>50% Min</span>
                <span>Max 90% Protocol Ceiling</span>
              </div>
            </div>

            {/* Discount Fee */}
            <div>
              <div className="flex justify-between items-center mb-1.5 font-medium">
                <span className="text-text-secondary">Financier Fee Rate</span>
                <span className="font-bold text-accent-primary text-sm">{feeRatePercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.25"
                value={feeRatePercent}
                onChange={(e) => setFeeRatePercent(parseFloat(e.target.value))}
                className="w-full accent-accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>1.0% Low Risk</span>
                <span>10.0% High Yield</span>
              </div>
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-text-secondary mb-1.5 font-medium">
                Offer Expiry / Validity
              </label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent-secondary"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Standard)</option>
                <option value={14}>14 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Real-time Economic Waterfall */}
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-text-primary">Financial Settlement Waterfall</h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-muted">Capital Required (Principal):</span>
                <span className="font-bold text-text-primary">{formatINR(terms.principal)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-muted">Your Expected Return (Fee):</span>
                <span className="font-bold text-accent-primary">{formatINR(terms.fee)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-muted">Protocol Service Fee (0.50%):</span>
                <span className="text-text-muted font-mono">{formatINR(terms.serviceFee)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-muted">Total Repayment upon Maturity:</span>
                <span className="font-bold text-text-primary">{formatINR(terms.totalDue)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border-default/50">
                <span className="text-text-muted">Supplier Residual at Settlement:</span>
                <span className="text-text-secondary font-mono">{formatINR(terms.supplierResidual)}</span>
              </div>

              <div className="pt-2 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-text-primary">Annualised Net Yield (APR):</span>
                <span className="text-xl font-extrabold text-accent-secondary">{terms.aprPercent}% p.a.</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-status-error/40 bg-status-error-bg/40 p-3 text-xs text-status-error flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="space-y-3 pt-4">
              <div className="rounded-xl border border-status-success/40 bg-status-success-bg/40 p-3 text-xs text-status-success flex items-center gap-2">
                <Check size={16} />
                Offer Submitted! Principal locked in escrow.
              </div>
              <Link
                href="/financier"
                className="w-full py-2.5 rounded-xl bg-accent-secondary text-white text-xs font-semibold hover:bg-accent-secondary-hover flex items-center justify-center gap-2"
              >
                Go to Financier Portfolio →
              </Link>
            </div>
          ) : (
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-accent-secondary text-white text-sm font-semibold hover:bg-accent-secondary-hover shadow-glow-blue flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Approving mINR & Locking Escrow…
                  </>
                ) : (
                  <>
                    <Coins size={16} />
                    Lock {formatINR(terms.principal)} & Submit Offer
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

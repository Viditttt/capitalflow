'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ShieldCheck, AlertTriangle, XCircle, FileText, Loader2 } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { HashDisplay } from '@/components/ui/hash-display'
import { RiskScore } from '@/components/ui/risk-score'

export default function AdminInvoiceReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const invoiceId = resolvedParams.id
  const { invoices, verifyInvoice, flagInvoice } = useCapitalFlow()

  const [isVerifying, setIsVerifying] = useState(false)
  const [isFlagging, setIsFlagging] = useState(false)
  const [flagReason, setFlagReason] = useState('Discrepancy identified between GSTN E-Way bill declared quantity and physical delivery receipt.')
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)

  const invoice = invoices.find((i) => i.id === invoiceId)

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary">
          <ArrowLeft size={14} /> Back to Audit Queue
        </Link>
        <div className="rounded-2xl border border-border-default p-12 text-center">
          <h2 className="text-lg font-bold text-text-primary">Invoice Not Found</h2>
        </div>
      </div>
    )
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setFeedbackMsg(null)
    try {
      await verifyInvoice(invoice.id)
      setFeedbackMsg({
        type: 'success',
        text: 'Invoice verified successfully on-chain! Status updated to Verified and listed on Financing Marketplace.',
      })
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFlag = async () => {
    setIsFlagging(true)
    setFeedbackMsg(null)
    try {
      await flagInvoice(invoice.id, flagReason)
      setShowFlagModal(false)
      setFeedbackMsg({
        type: 'warning',
        text: 'Invoice marked as Flagged on-chain. Marketplace bidding suspended pending supplier resolution.',
      })
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsFlagging(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Audit Queue
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              Audit Invoice #{invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-text-muted">Total Face Value</div>
          <div className="text-2xl font-bold text-text-primary">
            {formatINR(invoice.faceValue)}
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`rounded-xl border p-4 flex items-center gap-3 text-xs animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'border-status-success/30 bg-status-success-bg text-status-success'
              : 'border-status-warning/30 bg-status-warning-bg text-status-warning'
          }`}
        >
          {feedbackMsg.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Review Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-5">
            <h2 className="text-base font-bold text-text-primary">Commercial & Tax Reconciliation</h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-text-muted">Enterprise Buyer</span>
                <div className="font-semibold text-text-primary text-sm mt-0.5">{invoice.buyerName}</div>
                <div className="text-[11px] text-text-muted font-mono">GSTIN: {invoice.buyerGstin}</div>
              </div>

              <div>
                <span className="text-text-muted">MSME Supplier</span>
                <div className="font-semibold text-text-primary text-sm mt-0.5">{invoice.supplierName}</div>
                <div className="text-[11px] text-text-muted font-mono">{invoice.supplierAddress}</div>
              </div>

              <div>
                <span className="text-text-muted">Issue Date</span>
                <div className="text-text-primary font-medium mt-0.5">{formatDate(invoice.issueDate)}</div>
              </div>

              <div>
                <span className="text-text-muted">Maturity Due Date</span>
                <div className="text-text-primary font-medium mt-0.5">{formatDate(invoice.dueDate)}</div>
              </div>

              <div className="col-span-2">
                <span className="text-text-muted">Goods & Delivery Details</span>
                <div className="text-text-secondary mt-1">{invoice.goodsSummary || invoice.description}</div>
              </div>
            </div>

            {/* Cryptographic Hashes */}
            <div className="pt-4 border-t border-border-default space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Cryptographic Audit Trail
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-text-muted block mb-1">On-Chain Document Hash:</span>
                  <HashDisplay value={invoice.documentHash} truncate={false} />
                </div>

                <div>
                  <span className="text-text-muted block mb-1">Invoice Key:</span>
                  <HashDisplay value={invoice.invoiceKey} truncate={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Risk */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Automated Credit Risk</h3>
            <RiskScore score={invoice.riskScore} showDetails={true} />
          </div>

          {/* Decision Buttons */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-3">
            <h3 className="text-sm font-bold text-text-primary">Auditor Determination</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Verify this receivable to open institutional bidding on the marketplace, or flag for compliance inquiry.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleVerify}
                disabled={isVerifying || invoice.status === 2}
                className="w-full py-2.5 rounded-xl bg-accent-primary text-white text-xs font-semibold hover:bg-accent-primary-hover shadow-glow-green flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing Verification…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    {invoice.status === 2 ? 'Already Verified' : 'Approve & Verify Invoice'}
                  </>
                )}
              </button>

              <button
                onClick={() => setShowFlagModal(true)}
                disabled={invoice.status === 4}
                className="w-full py-2.5 rounded-xl border border-status-warning/40 hover:bg-status-warning-bg/40 text-status-warning text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <AlertTriangle size={16} />
                Flag for Discrepancy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flag Reason Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-border-default bg-bg-surface max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 text-status-warning font-bold text-base">
              <AlertTriangle size={20} />
              Flag Invoice #{invoice.invoiceNumber}
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Provide a rationale for flagging this invoice. The hash of this statement will be permanently recorded on-chain.
            </p>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Discrepancy / Compliance Reason
              </label>
              <textarea
                rows={3}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-status-warning resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 rounded-xl border border-border-default text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={isFlagging}
                className="px-4 py-2 rounded-xl bg-status-warning text-black text-xs font-semibold hover:opacity-90 flex items-center gap-1.5"
              >
                {isFlagging && <Loader2 size={12} className="animate-spin" />}
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

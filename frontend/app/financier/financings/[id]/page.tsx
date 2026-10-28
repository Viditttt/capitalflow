'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Coins, ShieldCheck, Loader2, DollarSign, Calendar, Building2 } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { HashDisplay } from '@/components/ui/hash-display'

export default function FinancingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const financingId = resolvedParams.id
  const { financings, invoices, repayFinancing } = useCapitalFlow()

  const [isRepaying, setIsRepaying] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const financing = financings.find((f) => f.id === financingId)
  const invoice = financing ? invoices.find((i) => i.id === financing.invoiceId) : null

  if (!financing || !invoice) {
    return (
      <div className="space-y-4">
        <Link href="/financier" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary">
          <ArrowLeft size={14} /> Back to Financier Portfolio
        </Link>
        <div className="rounded-2xl border border-border-default p-12 text-center">
          <h2 className="text-lg font-bold text-text-primary">Financing Position Not Found</h2>
        </div>
      </div>
    )
  }

  const isSettled = financing.status === 2
  const daysLeft = daysRemaining(financing.maturity)

  const handleSimulateRepayment = async () => {
    setIsRepaying(true)
    setSuccessMsg(null)
    try {
      await repayFinancing(financing.offerId)
      setSuccessMsg('Corporate Buyer full repayment confirmed! Principal + fee returned to Financier, residual released to Supplier.')
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsRepaying(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/financier"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Financier Portfolio
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              Facility #{financing.id} — {invoice.buyerName}
            </h1>
            <StatusBadge status={financing.status} type="financing" />
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-text-muted">Total Repayment Due</div>
          <div className="text-2xl font-bold text-accent-primary">
            {formatINR(financing.totalDue)}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-status-success/30 bg-status-success-bg p-4 flex items-center gap-3 text-xs text-status-success animate-fade-in">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ledger */}
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6">
          <h2 className="text-base font-bold text-text-primary">Loan Facility Ledger</h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border-default/50">
              <span className="text-text-muted">Invoice Face Value:</span>
              <span className="font-bold text-text-primary">{formatINR(invoice.faceValue)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border-default/50">
              <span className="text-text-muted">Principal Funded:</span>
              <span className="font-mono text-text-primary font-bold">{formatINR(financing.principal)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border-default/50">
              <span className="text-text-muted">Financier Discount Margin:</span>
              <span className="font-mono text-accent-primary font-bold">+{formatINR(financing.fee)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border-default/50">
              <span className="text-text-muted">Protocol Service Fee (0.50%):</span>
              <span className="font-mono text-text-muted">{formatINR(financing.serviceFee)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border-default/50">
              <span className="text-text-muted">Funding Date:</span>
              <span className="text-text-primary font-medium">{formatDate(financing.fundedAt)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border-default/50">
              <span className="text-text-muted">Maturity Date:</span>
              <span className="text-text-primary font-medium">{formatDate(financing.maturity)}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-text-muted">Settlement Status:</span>
              <span className="font-semibold text-text-primary">
                {isSettled ? (
                  <span className="text-status-success">Settled on {formatDate(financing.settledAt || Date.now() / 1000)}</span>
                ) : (
                  <span className="text-accent-secondary">Active — {daysLeft} Days to Maturity</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Repayment Simulator */}
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-accent-primary" />
              <h2 className="text-base font-bold text-text-primary">Corporate Settlement Simulation</h2>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              In production, the corporate buyer (e.g. {invoice.buyerName}) or enterprise ERP settles the invoice directly via on-chain virtual account. For demonstration purposes, you can trigger buyer settlement below.
            </p>

            <div className="rounded-xl bg-bg-base p-4 border border-border-default space-y-2 text-xs">
              <div className="text-text-muted font-medium">Automatic Smart Contract Distribution:</div>
              <ul className="space-y-1.5 text-text-secondary list-disc pl-4 text-[11px]">
                <li>Financier receives: <strong className="text-text-primary">{formatINR(financing.totalDue)}</strong> (Principal + Fee)</li>
                <li>Platform Treasury receives: <strong className="text-text-primary">{formatINR(financing.serviceFee)}</strong></li>
                <li>Supplier receives residual: <strong className="text-text-primary">{formatINR(invoice.faceValue - financing.totalDue)}</strong></li>
              </ul>
            </div>
          </div>

          <div className="pt-4">
            {isSettled ? (
              <div className="rounded-xl border border-status-success/30 bg-status-success-bg/30 p-4 text-center space-y-2">
                <Check size={24} className="mx-auto text-status-success" />
                <div className="text-xs font-bold text-status-success">Repayment Completed</div>
                <div className="text-[11px] text-text-muted">All funds successfully routed per smart contract rules.</div>
              </div>
            ) : (
              <button
                onClick={handleSimulateRepayment}
                disabled={isRepaying}
                className="w-full py-3 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isRepaying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Executing Buyer Repayment…
                  </>
                ) : (
                  <>
                    <Coins size={16} />
                    Simulate Buyer Repayment ({formatINR(financing.totalDue)})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

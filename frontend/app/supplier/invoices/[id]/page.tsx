'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, AlertCircle, Clock, ShieldCheck, ExternalLink, Loader2, DollarSign } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining, bpsToPercent } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { HashDisplay } from '@/components/ui/hash-display'
import { RiskScore } from '@/components/ui/risk-score'
import { Timeline, TimelineStep } from '@/components/ui/timeline'

export default function SupplierInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const invoiceId = resolvedParams.id
  const { invoices, offers, acceptOffer } = useCapitalFlow()

  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const invoice = invoices.find((inv) => inv.id === invoiceId)
  const invoiceOffers = offers.filter((o) => o.invoiceId === invoiceId)

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link
          href="/supplier"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={14} /> Back to Invoices
        </Link>
        <div className="rounded-2xl border border-border-default p-12 text-center">
          <h2 className="text-lg font-bold text-text-primary">Invoice Not Found</h2>
          <p className="text-xs text-text-secondary mt-1">Invoice #{invoiceId} does not exist in local state.</p>
        </div>
      </div>
    )
  }

  // Construct dynamic lifecycle timeline steps
  const timelineSteps: TimelineStep[] = [
    {
      title: 'Invoice Submitted',
      description: `Registered on-chain with document hash ${invoice.documentHash.slice(0, 10)}…`,
      date: formatDate(invoice.issueDate),
      status: 'completed',
    },
    {
      title: 'Auditor Verification',
      description:
        invoice.status >= 2 && invoice.status !== 3 && invoice.status !== 4
          ? 'Enterprise buyer PO and E-Way bill confirmed by Verifier.'
          : invoice.status === 4
          ? 'Flagged for quantity discrepancy.'
          : 'Awaiting auditor validation against GSTN portal.',
      date: invoice.status >= 2 ? formatDate(invoice.issueDate + 86400) : undefined,
      status:
        invoice.status >= 2 && invoice.status !== 3 && invoice.status !== 4
          ? 'completed'
          : invoice.status === 4
          ? 'failed'
          : 'current',
    },
    {
      title: 'Competitive Financing Bids',
      description:
        invoiceOffers.length > 0
          ? `${invoiceOffers.length} offers submitted in escrow by institutional lenders.`
          : 'Awaiting financier bids.',
      status: invoice.status >= 5 ? 'completed' : invoice.status === 2 ? 'current' : 'upcoming',
    },
    {
      title: 'Advance Disbursed',
      description:
        invoice.status >= 5
          ? 'Offer accepted. Principal minus protocol fee disbursed to supplier wallet.'
          : 'Requires offer acceptance by supplier.',
      status: invoice.status >= 5 ? 'completed' : 'upcoming',
    },
    {
      title: 'Buyer Maturity Settlement',
      description:
        invoice.status === 6
          ? 'Enterprise buyer repaid full invoice face value. Residual transferred.'
          : `Due on ${formatDate(invoice.dueDate)}.`,
      status: invoice.status === 6 ? 'completed' : 'upcoming',
    },
  ]

  const handleAccept = async (offerId: string) => {
    setAcceptingOfferId(offerId)
    setSuccessMsg(null)
    try {
      await acceptOffer(offerId)
      setSuccessMsg('Offer accepted successfully! Capital advance disbursed to your wallet.')
    } catch (err: any) {
      console.error(err)
    } finally {
      setAcceptingOfferId(null)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/supplier"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Supplier Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
              {invoice.invoiceNumber}
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

      {successMsg && (
        <div className="rounded-xl border border-status-success/30 bg-status-success-bg p-4 flex items-center gap-3 text-xs text-status-success">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Details & Right Actions/Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Summary Card */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6">
            <h2 className="text-base font-bold text-text-primary">Commercial Specifications</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-text-muted">Enterprise Buyer</span>
                <div className="text-text-primary font-semibold text-sm mt-0.5">
                  {invoice.buyerName}
                </div>
                <div className="text-[11px] text-text-muted font-mono mt-0.5">
                  GSTIN: {invoice.buyerGstin}
                </div>
              </div>

              <div>
                <span className="text-text-muted">Industry Sector</span>
                <div className="text-text-primary font-semibold text-sm mt-0.5">
                  {invoice.sector}
                </div>
              </div>

              <div>
                <span className="text-text-muted">Issue Date</span>
                <div className="text-text-primary font-medium mt-0.5">
                  {formatDate(invoice.issueDate)}
                </div>
              </div>

              <div>
                <span className="text-text-muted">Payment Maturity</span>
                <div className="text-text-primary font-medium mt-0.5">
                  {formatDate(invoice.dueDate)} ({daysRemaining(invoice.dueDate)} days remaining)
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-text-muted">Scope of Work / Goods</span>
                <div className="text-text-secondary mt-1 leading-relaxed">
                  {invoice.description}
                </div>
              </div>
            </div>

            {/* Cryptographic Hashes */}
            <div className="pt-4 border-t border-border-default space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Cryptographic Identity
              </h3>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="text-text-muted">SHA-256 Document Hash:</span>
                  <HashDisplay value={invoice.documentHash} truncate={true} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="text-text-muted">Unique Invoice Key (Salted):</span>
                  <HashDisplay value={invoice.invoiceKey} truncate={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Received Offers Section */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary">Financing Offers</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Competitive bids from institutional financiers for instant liquidity.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-bg-elevated border border-border-default text-text-secondary font-medium">
                {invoiceOffers.length} Bids
              </span>
            </div>

            {invoiceOffers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-default p-8 text-center space-y-2">
                <Clock size={24} className="mx-auto text-text-muted" />
                <p className="text-xs font-semibold text-text-primary">No Financing Offers Yet</p>
                <p className="text-[11px] text-text-secondary">
                  {invoice.status === 1
                    ? 'Once an auditor verifies this invoice, lenders can submit bids.'
                    : 'Verified on marketplace. Lenders are evaluating credit terms.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoiceOffers.map((offer) => {
                  const serviceFee = (offer.principal * 50n) / 10000n // 0.50%
                  const netAdvance = offer.principal - serviceFee
                  const isAccepted = offer.status === 2
                  const isOpen = offer.status === 1

                  return (
                    <div
                      key={offer.id}
                      className={`rounded-xl border p-5 transition-all duration-200 ${
                        isAccepted
                          ? 'border-status-success bg-status-success-bg/20'
                          : 'border-border-default bg-bg-base hover:border-accent-primary'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-text-primary">
                              {offer.financierName}
                            </span>
                            <StatusBadge status={offer.status} type="offer" />
                          </div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            Valid until {formatDate(offer.expiryTimestamp)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-text-muted">Net Upfront Advance</div>
                            <div className="text-base font-bold text-accent-primary">
                              {formatINR(netAdvance)}
                            </div>
                            <div className="text-[10px] text-text-muted">
                              ({offer.advanceRateBps / 100}% Advance Rate)
                            </div>
                          </div>

                          {isOpen && invoice.status === 2 && (
                            <button
                              onClick={() => handleAccept(offer.id)}
                              disabled={acceptingOfferId !== null}
                              className="px-4 py-2 rounded-xl bg-accent-primary text-white text-xs font-semibold hover:bg-accent-primary-hover shadow-glow-green disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {acceptingOfferId === offer.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Confirming…
                                </>
                              ) : (
                                <>
                                  <Check size={14} />
                                  Accept Offer
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Financial breakdown */}
                      <div className="mt-4 pt-3 border-t border-border-default/50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-text-muted">Gross Principal:</span>
                          <div className="font-medium text-text-primary">{formatINR(offer.principal)}</div>
                        </div>
                        <div>
                          <span className="text-text-muted">Financier Fee:</span>
                          <div className="font-medium text-text-primary">{formatINR(offer.fee)}</div>
                        </div>
                        <div>
                          <span className="text-text-muted">Protocol Fee (0.5%):</span>
                          <div className="font-medium text-text-primary">{formatINR(serviceFee)}</div>
                        </div>
                        <div>
                          <span className="text-text-muted">Implied APR:</span>
                          <div className="font-semibold text-accent-secondary">{offer.impliedApr}% p.a.</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Credit Risk */}
        <div className="space-y-6">
          {/* Credit Risk Box */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Underwriting Assessment</h3>
            <RiskScore score={invoice.riskScore} showDetails={true} />
          </div>

          {/* Lifecycle Timeline */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Lifecycle State Machine</h3>
            <Timeline steps={timelineSteps} />
          </div>
        </div>
      </div>
    </div>
  )
}

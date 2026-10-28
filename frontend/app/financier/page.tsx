'use client'

import Link from 'next/link'
import { Building2, Coins, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'

export default function FinancierDashboard() {
  const { offers, financings, invoices } = useCapitalFlow()

  // Aggregate metrics
  const activeFinancings = financings.filter((f) => f.status === 1)
  const settledFinancings = financings.filter((f) => f.status === 2)

  const totalCapitalDeployed = financings.reduce((acc, curr) => acc + curr.principal, 0n)
  const totalInterestProjected = financings.reduce((acc, curr) => acc + curr.fee, 0n)
  const activeOffers = offers.filter((o) => o.status === 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Financier Portfolio
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Falcon Trade Capital NBFC — Institutional Debt Desk
          </p>
        </div>

        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-secondary text-white text-xs font-semibold hover:bg-accent-secondary-hover shadow-glow-blue transition-all"
        >
          <Coins size={16} />
          Deploy Capital on Marketplace
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Capital Deployed"
          value={formatINR(totalCapitalDeployed)}
          subtitle={`${financings.length} Total Funded Invoices`}
          icon={<Building2 size={16} />}
        />
        <StatCard
          title="Projected Yield"
          value={formatINR(totalInterestProjected)}
          subtitle="Contractually locked returns"
          variant="accent"
        />
        <StatCard
          title="Active Funded Loans"
          value={activeFinancings.length}
          subtitle="Earning daily interest"
          variant="emerald"
        />
        <StatCard
          title="Open Escrow Bids"
          value={activeOffers.length}
          subtitle="Awaiting supplier acceptance"
        />
      </div>

      {/* Funded Loan Positions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Active & Settled Financings</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Live loan facilities backed by corporate accounts receivable.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-bg-surface border border-border-default text-text-muted font-medium">
            {financings.length} Positions
          </span>
        </div>

        {financings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-default p-12 text-center">
            <Coins size={32} className="mx-auto text-text-muted" />
            <h3 className="text-base font-bold text-text-primary mt-2">No Funded Loans Yet</h3>
            <p className="text-xs text-text-secondary mt-1">
              Browse the Marketplace to submit financing bids on verified supplier invoices.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {financings.map((fin) => {
              const inv = invoices.find((i) => i.id === fin.invoiceId)
              const daysLeft = daysRemaining(fin.maturity)
              const isSettled = fin.status === 2

              return (
                <div
                  key={fin.id}
                  className="rounded-2xl border border-border-default bg-bg-surface p-6 hover:border-border-bright transition-all card-hover space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-text-primary">
                          {inv ? inv.buyerName : `Invoice #${fin.invoiceId}`}
                        </span>
                        <StatusBadge status={fin.status} type="financing" />
                      </div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">
                        Supplier: {inv?.supplierName || 'Apex Precision'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-text-muted">Total Due at Maturity</div>
                        <div className="text-base font-bold text-text-primary">
                          {formatINR(fin.totalDue)}
                        </div>
                      </div>

                      <Link
                        href={`/financier/financings/${fin.id}`}
                        className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-default hover:border-accent-secondary text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        Repayment Details
                        <ArrowUpRight size={14} className="text-text-muted" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border-default/50 text-xs">
                    <div>
                      <span className="text-text-muted">Principal Disbursed:</span>
                      <div className="font-semibold text-text-primary mt-0.5">{formatINR(fin.principal)}</div>
                    </div>

                    <div>
                      <span className="text-text-muted">Financier Interest:</span>
                      <div className="font-semibold text-accent-primary mt-0.5">+{formatINR(fin.fee)}</div>
                    </div>

                    <div>
                      <span className="text-text-muted">Disbursed Date:</span>
                      <div className="font-medium text-text-primary mt-0.5">{formatDate(fin.fundedAt)}</div>
                    </div>

                    <div>
                      <span className="text-text-muted">Maturity Status:</span>
                      <div className="font-medium text-text-primary mt-0.5">
                        {isSettled ? (
                          <span className="text-status-success font-semibold">Fully Settled</span>
                        ) : (
                          `Matures in ${daysLeft} Days`
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Offers in Escrow */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Pending Escrow Offers</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Capital reserved in smart contract awaiting supplier acceptance.
          </p>
        </div>

        <div className="rounded-2xl border border-border-default bg-bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-elevated border-b border-border-default text-text-muted">
                <tr>
                  <th className="p-4 font-semibold">Invoice Target</th>
                  <th className="p-4 font-semibold">Principal Escrowed</th>
                  <th className="p-4 font-semibold">Projected Fee</th>
                  <th className="p-4 font-semibold">Implied APR</th>
                  <th className="p-4 font-semibold">Expires</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50">
                {offers.map((offer) => {
                  const inv = invoices.find((i) => i.id === offer.invoiceId)
                  return (
                    <tr key={offer.id} className="hover:bg-bg-hover transition-colors">
                      <td className="p-4 font-semibold text-text-primary">
                        {inv?.buyerName || `Invoice #${offer.invoiceId}`}
                      </td>
                      <td className="p-4 font-mono font-bold text-text-primary">
                        {formatINR(offer.principal)}
                      </td>
                      <td className="p-4 font-mono text-accent-primary font-semibold">
                        {formatINR(offer.fee)}
                      </td>
                      <td className="p-4 font-bold text-accent-secondary">
                        {offer.impliedApr}%
                      </td>
                      <td className="p-4 text-text-muted">
                        {formatDate(offer.expiryTimestamp)}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={offer.status} type="offer" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

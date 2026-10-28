'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, ArrowUpRight, Filter, ShieldCheck } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatCard } from '@/components/ui/stat-card'
import { RiskScore } from '@/components/ui/risk-score'

export default function SupplierDashboard() {
  const { invoices } = useCapitalFlow()
  const [filterStatus, setFilterStatus] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.goodsSummary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Aggregate stats
  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.faceValue, 0n)
  const financedCount = invoices.filter((i) => i.status === 5 || i.status === 6).length
  const pendingCount = invoices.filter((i) => i.status === 1).length
  const verifiedCount = invoices.filter((i) => i.status === 2).length

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Supplier Portal
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Apex Precision Auto-Components Pvt Ltd — GSTIN: 27AABCA3829M1ZO
          </p>
        </div>

        <Link
          href="/supplier/invoices/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green transition-all"
        >
          <Plus size={16} />
          Register New Invoice
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Face Value"
          value={formatINR(totalInvoiced)}
          subtitle={`${invoices.length} Registered Invoices`}
          icon={<FileText size={16} />}
        />
        <StatCard
          title="Ready for Financing"
          value={verifiedCount}
          subtitle="Verified by auditor"
          badge="Marketplace Live"
          variant="emerald"
        />
        <StatCard
          title="Financed & Settled"
          value={financedCount}
          subtitle="Capital unlocked"
          variant="accent"
        />
        <StatCard
          title="Pending Review"
          value={pendingCount}
          subtitle="In verification queue"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border-default bg-bg-surface p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by buyer, invoice #, goods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { label: 'All', value: 'all' },
            { label: 'Submitted (1)', value: 1 },
            { label: 'Verified (2)', value: 2 },
            { label: 'Financed (5)', value: 5 },
            { label: 'Settled (6)', value: 6 },
            { label: 'Flagged (4)', value: 4 },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setFilterStatus(tab.value as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === tab.value
                  ? 'bg-accent-primary text-white font-semibold'
                  : 'bg-bg-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-default p-12 text-center space-y-3">
            <FileText size={32} className="mx-auto text-text-muted" />
            <h3 className="text-base font-bold text-text-primary">No Invoices Found</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No invoices match your selected filter criteria. Try clearing search or register a new invoice.
            </p>
          </div>
        ) : (
          filtered.map((inv) => {
            const daysLeft = daysRemaining(inv.dueDate)

            return (
              <div
                key={inv.id}
                className="rounded-2xl border border-border-default bg-bg-surface p-5 hover:border-border-bright transition-all duration-200 card-hover space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {inv.invoiceNumber}
                    </span>
                    <StatusBadge status={inv.status} />
                    <span className="text-xs text-text-muted font-medium">
                      {inv.sector}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-text-muted">Face Value</div>
                      <div className="text-base font-bold text-text-primary">
                        {formatINR(inv.faceValue)}
                      </div>
                    </div>

                    <Link
                      href={`/supplier/invoices/${inv.id}`}
                      className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-default hover:border-accent-primary text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      View Details
                      <ArrowUpRight size={14} className="text-text-muted" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border-default/50 text-xs text-text-secondary">
                  <div>
                    <span className="text-text-muted">Buyer: </span>
                    <span className="text-text-primary font-medium">{inv.buyerName}</span>
                    <div className="text-[11px] text-text-muted mt-0.5">GSTIN: {inv.buyerGstin}</div>
                  </div>

                  <div>
                    <span className="text-text-muted">Tenor: </span>
                    <span className="text-text-primary font-medium">Due in {daysLeft} days</span>
                    <div className="text-[11px] text-text-muted mt-0.5">Maturity: {formatDate(inv.dueDate)}</div>
                  </div>

                  <div>
                    <RiskScore score={inv.riskScore} />
                  </div>
                </div>

                {inv.offersCount > 0 && inv.status === 2 && (
                  <div className="rounded-xl bg-accent-primary-muted/30 border border-accent-primary/30 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-accent-primary font-medium">
                      <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping" />
                      {inv.offersCount} Competitive Offers Received (Up to {inv.bestOfferRate}% Advance)
                    </div>
                    <Link
                      href={`/supplier/invoices/${inv.id}`}
                      className="text-xs font-bold text-accent-primary hover:underline"
                    >
                      Compare & Accept Offer →
                    </Link>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

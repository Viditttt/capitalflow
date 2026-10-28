'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Store, ArrowUpRight, ShieldCheck, Clock, Coins, Filter } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatCard } from '@/components/ui/stat-card'
import { RiskScore } from '@/components/ui/risk-score'

export default function MarketplacePage() {
  const { invoices } = useCapitalFlow()
  const [searchQuery, setSearchQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')

  // Only show verified invoices (status 2) or all for demo flexibility
  const verifiedInvoices = invoices.filter((i) => i.status === 2 || i.status === 1)

  const filtered = verifiedInvoices.filter((inv) => {
    const matchesSearch =
      inv.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.sector.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSector = sectorFilter === 'all' || inv.sector === sectorFilter
    return matchesSearch && matchesSector
  })

  const totalPoolFaceValue = verifiedInvoices.reduce((acc, curr) => acc + curr.faceValue, 0n)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Financing Marketplace
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Browse verified corporate receivables and deploy capital directly into escrow.
          </p>
        </div>

        <Link
          href="/financier"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-default hover:bg-bg-hover text-text-primary text-xs font-semibold transition-colors"
        >
          <Coins size={16} className="text-accent-secondary" />
          My Financier Portfolio →
        </Link>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Receivables Pipeline"
          value={formatINR(totalPoolFaceValue)}
          subtitle="Verified by auditors"
          icon={<Store size={16} />}
        />
        <StatCard
          title="Average Target Yield"
          value="29.2% APR"
          subtitle="Short-duration trade debt"
          variant="accent"
        />
        <StatCard
          title="Underwritten Default Rate"
          value="0.00%"
          subtitle="Top-tier corporate obligors"
          variant="emerald"
        />
        <StatCard
          title="Average Payment Tenor"
          value="52 Days"
          subtitle="High capital velocity"
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-border-default bg-bg-surface p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by buyer, GSTIN, sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-text-muted font-medium">Filter Sector:</span>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="all">All Sectors</option>
            <option value="Automotive & Heavy Engineering">Automotive</option>
            <option value="Consumer Goods & Retail">Retail & FMCG</option>
            <option value="Infrastructure & Urban Rail">Infrastructure</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-border-default p-12 text-center">
            <Store size={32} className="mx-auto text-text-muted" />
            <h3 className="text-base font-bold text-text-primary mt-2">No Verified Receivables Available</h3>
            <p className="text-xs text-text-secondary mt-1">Check back once auditors verify pending supplier invoices.</p>
          </div>
        ) : (
          filtered.map((inv) => {
            const daysLeft = daysRemaining(inv.dueDate)
            const isVerified = inv.status === 2

            return (
              <div
                key={inv.id}
                className="rounded-2xl border border-border-default bg-bg-surface p-6 hover:border-accent-secondary transition-all duration-300 card-hover space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-text-primary">
                          {inv.buyerName}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">
                        GSTIN: {inv.buyerGstin}
                      </div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {inv.goodsSummary || inv.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-default/50 text-xs">
                    <div>
                      <span className="text-text-muted">Face Value</span>
                      <div className="text-lg font-bold text-text-primary mt-0.5">
                        {formatINR(inv.faceValue)}
                      </div>
                    </div>

                    <div>
                      <span className="text-text-muted">Maturity Tenor</span>
                      <div className="text-sm font-semibold text-text-primary mt-0.5">
                        Due in {daysLeft} Days
                      </div>
                      <div className="text-[10px] text-text-muted">{formatDate(inv.dueDate)}</div>
                    </div>
                  </div>

                  <div>
                    <RiskScore score={inv.riskScore} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border-default/50 flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {inv.offersCount > 0
                      ? `${inv.offersCount} Active Bids`
                      : 'No Offers Yet — Be the First'}
                  </span>

                  <Link
                    href={`/marketplace/${inv.id}`}
                    className="px-4 py-2 rounded-xl bg-accent-secondary text-white text-xs font-semibold hover:bg-accent-secondary-hover shadow-glow-blue flex items-center gap-1.5 transition-all"
                  >
                    Submit Offer
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

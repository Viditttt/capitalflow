'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, AlertTriangle, CheckCircle2, Search, ArrowUpRight, ShieldAlert, FileText } from 'lucide-react'
import { useCapitalFlow } from '@/hooks/use-capitalflow'
import { formatINR, formatDate, daysRemaining } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { RiskScore } from '@/components/ui/risk-score'

export default function AdminDashboard() {
  const { invoices } = useCapitalFlow()
  const [tab, setTab] = useState<'pending' | 'flagged' | 'all'>('pending')
  const [search, setSearch] = useState('')

  const pendingInvoices = invoices.filter((i) => i.status === 1)
  const flaggedInvoices = invoices.filter((i) => i.status === 4 || i.status === 7)

  const displayedInvoices = invoices.filter((inv) => {
    const matchesTab =
      tab === 'all'
        ? true
        : tab === 'pending'
        ? inv.status === 1
        : inv.status === 4 || inv.status === 7
    const matchesSearch =
      inv.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplierName.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Verification & Audit Desk
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Certified Trade Verifier — GSTN E-Way Bill Cross-Validation Desk
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success-bg text-status-success text-xs font-semibold">
            <ShieldCheck size={14} />
            Verifier Role Active
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Verification"
          value={pendingInvoices.length}
          subtitle="In audit queue"
          variant="accent"
          icon={<ShieldCheck size={16} />}
        />
        <StatCard
          title="Flagged / Disputed"
          value={flaggedInvoices.length}
          subtitle="Requires compliance check"
          badge={flaggedInvoices.length > 0 ? 'Action Needed' : undefined}
          icon={<AlertTriangle size={16} className="text-status-warning" />}
        />
        <StatCard
          title="Verified Invoices"
          value={invoices.filter((i) => i.status >= 2 && i.status !== 4 && i.status !== 7).length}
          subtitle="Cleared for marketplace"
          variant="emerald"
        />
        <StatCard
          title="Audit Pass Rate"
          value="96.2%"
          subtitle="GSTN document validity"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'pending'
                ? 'bg-accent-primary text-white'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Pending Review ({pendingInvoices.length})
          </button>
          <button
            onClick={() => setTab('flagged')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'flagged'
                ? 'bg-status-warning text-black'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Flagged & Disputed ({flaggedInvoices.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'all'
                ? 'bg-bg-elevated text-text-primary'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
        </div>

        <div className="relative w-64 hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search queue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="rounded-2xl border border-border-default bg-bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated border-b border-border-default text-text-muted">
              <tr>
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Buyer Obligor</th>
                <th className="p-4 font-semibold">Face Value</th>
                <th className="p-4 font-semibold">Risk Grade</th>
                <th className="p-4 font-semibold">Due In</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50">
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    No invoices matching the selected audit filter.
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-bg-hover transition-colors">
                    <td className="p-4 font-mono font-semibold text-text-primary">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">{inv.buyerName}</div>
                      <div className="text-[10px] text-text-muted font-mono">{inv.buyerGstin}</div>
                    </td>
                    <td className="p-4 font-bold text-text-primary">
                      {formatINR(inv.faceValue)}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-accent-primary">{inv.riskScore}/100</span>
                    </td>
                    <td className="p-4 text-text-muted">
                      {daysRemaining(inv.dueDate)} Days
                    </td>
                    <td className="p-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-default hover:border-accent-primary text-text-primary text-xs font-semibold transition-colors"
                      >
                        Audit & Decide
                        <ArrowUpRight size={12} className="text-text-muted" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

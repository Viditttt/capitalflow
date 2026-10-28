'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, PieChart as PieIcon, Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

const CUMULATIVE_VOLUME_DATA = [
  { month: 'Oct 25', volume: 18, financed: 14 },
  { month: 'Nov 25', volume: 32, financed: 25 },
  { month: 'Dec 25', volume: 48, financed: 38 },
  { month: 'Jan 26', volume: 65, financed: 52 },
  { month: 'Feb 26', volume: 88, financed: 69 },
  { month: 'Mar 26', volume: 108, financed: 76 },
]

const SECTOR_DISTRIBUTION = [
  { name: 'Automotive', value: 42, color: '#10B981' },
  { name: 'Infrastructure', value: 31, color: '#3B82F6' },
  { name: 'Retail / FMCG', value: 18, color: '#8B5CF6' },
  { name: 'IT Hardware', value: 9, color: '#F59E0B' },
]

const RISK_RATING_DATA = [
  { grade: 'AAA (Prime)', count: 18, rate: '24.5%' },
  { grade: 'AA (Low Risk)', count: 26, rate: '27.8%' },
  { grade: 'A (Moderate)', count: 12, rate: '31.2%' },
  { grade: 'BBB (Elevated)', count: 4, rate: '34.5%' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
          Protocol Analytics & Metrics
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Real-time on-chain credit market statistics, liquidity velocity, and risk parameters.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Face Value Processed"
          value="₹1.08 Cr"
          subtitle="+22.8% from last month"
          icon={<BarChart3 size={16} />}
        />
        <StatCard
          title="Total Capital Deployed"
          value="₹76.0 L"
          subtitle="Instant SME liquidity"
          variant="emerald"
        />
        <StatCard
          title="Average Realised APR"
          value="28.4% p.a."
          subtitle="Annualised lender yield"
          variant="accent"
        />
        <StatCard
          title="Historic Default Rate"
          value="0.00%"
          subtitle="100% verified settlement rate"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cumulative Volume Chart */}
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">Cumulative Financing Growth</h2>
              <p className="text-xs text-text-muted mt-0.5">Total Invoiced vs Capital Disbursed (₹ Lakhs)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-primary-muted text-accent-primary">
              6-Month Trend
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CUMULATIVE_VOLUME_DATA}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#262626',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#10B981" fillOpacity={1} fill="url(#volGrad)" name="Total Invoiced (₹L)" />
                <Area type="monotone" dataKey="financed" stroke="#3B82F6" fillOpacity={1} fill="url(#finGrad)" name="Financed Capital (₹L)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Distribution Pie Chart */}
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">Receivables by Sector</h2>
              <p className="text-xs text-text-muted mt-0.5">Asset diversification across Indian industries</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-secondary-muted text-accent-secondary">
              Top 4 Sectors
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SECTOR_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {SECTOR_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#262626',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border-default/50 text-[11px]">
            {SECTOR_DISTRIBUTION.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-text-muted">{s.name}:</span>
                <span className="font-bold text-text-primary">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Tier & Pricing Matrix */}
      <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4">
        <h2 className="text-base font-bold text-text-primary">Underwriting Matrix by Credit Tier</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated border-b border-border-default text-text-muted">
              <tr>
                <th className="p-3.5 font-semibold">Credit Rating Grade</th>
                <th className="p-3.5 font-semibold">Underwritten Invoices</th>
                <th className="p-3.5 font-semibold">Average Market APR</th>
                <th className="p-3.5 font-semibold">Recommended Advance Rate</th>
                <th className="p-3.5 font-semibold">Default Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50">
              {RISK_RATING_DATA.map((row) => (
                <tr key={row.grade} className="hover:bg-bg-hover transition-colors">
                  <td className="p-3.5 font-bold text-text-primary">{row.grade}</td>
                  <td className="p-3.5 font-mono text-text-secondary">{row.count} Invoices</td>
                  <td className="p-3.5 font-semibold text-accent-secondary">{row.rate}</td>
                  <td className="p-3.5 font-medium text-text-primary">Up to 85% - 90%</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-success">
                      <ShieldCheck size={12} /> Negligible
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

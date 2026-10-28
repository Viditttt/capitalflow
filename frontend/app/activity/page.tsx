'use client'

import { useState } from 'react'
import { Activity, ArrowUpRight, CheckCircle2, ShieldCheck, Coins, AlertTriangle, FileText } from 'lucide-react'
import { formatDateTime, truncateHash, truncateAddress } from '@/lib/utils'
import { HashDisplay } from '@/components/ui/hash-display'

interface AuditEvent {
  id: string
  type: 'registered' | 'verified' | 'offer' | 'financed' | 'settled' | 'flagged'
  title: string
  description: string
  txHash: string
  blockNumber: number
  timestamp: number
  actor: string
  actorRole: string
}

const NOW = Math.floor(Date.now() / 1000)

const DEMO_EVENTS: AuditEvent[] = [
  {
    id: 'ev-1',
    type: 'settled',
    title: 'Financing Settled & Residual Distributed',
    description: 'Tata Motors settled Facility #1 for ₹10,00,000. Financier received ₹8,40,000, supplier received ₹1,60,000 residual.',
    txHash: '0x39a1b9487c610928374659182736450192837465019283746591827364501928',
    blockNumber: 42,
    timestamp: NOW - 1200,
    actor: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    actorRole: 'Corporate Payer',
  },
  {
    id: 'ev-2',
    type: 'financed',
    title: 'Financing Offer Accepted',
    description: 'Supplier accepted Falcon Capital offer for Invoice #INV-2026-0042. ₹40,00,000 advance released.',
    txHash: '0x8192039485710293847561029384756102938475610293847561029384756102',
    blockNumber: 38,
    timestamp: NOW - 8400,
    actor: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    actorRole: 'MSME Supplier',
  },
  {
    id: 'ev-3',
    type: 'offer',
    title: 'Escrow Offer Submitted',
    description: 'Kuber Liquid FinTech locked ₹8,50,000 in escrow at 85% advance rate for Invoice #INV-2026-0081.',
    txHash: '0x9928374650192837465918273645019283746501928374659182736450192837',
    blockNumber: 35,
    timestamp: NOW - 18000,
    actor: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    actorRole: 'Institutional Financier',
  },
  {
    id: 'ev-4',
    type: 'verified',
    title: 'Invoice Verified & Listed',
    description: 'Auditor verified e-Way bill #9921-2918 against GSTN portal for Invoice #INV-2026-0081.',
    txHash: '0x7728192837465019283746591827364501928374650192837465918273645019',
    blockNumber: 31,
    timestamp: NOW - 45000,
    actor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    actorRole: 'Authorised Verifier',
  },
  {
    id: 'ev-5',
    type: 'flagged',
    title: 'Discrepancy Flag Recorded',
    description: 'Auditor flagged Invoice #INV-2026-0112 due to vehicle consignment weight mismatch.',
    txHash: '0x55667788990011223344556677889900aabbccddeeff00112233445566778899',
    blockNumber: 29,
    timestamp: NOW - 62000,
    actor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    actorRole: 'Authorised Verifier',
  },
  {
    id: 'ev-6',
    type: 'registered',
    title: 'Invoice Registered On-Chain',
    description: 'Apex Precision registered invoice for ₹10,00,000 with SHA-256 document hash.',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 24,
    timestamp: NOW - 86400,
    actor: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    actorRole: 'MSME Supplier',
  },
]

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>('all')

  const filteredEvents = DEMO_EVENTS.filter((e) => {
    if (filter === 'all') return true
    return e.type === filter
  })

  const getEventIcon = (type: AuditEvent['type']) => {
    switch (type) {
      case 'settled':
        return <CheckCircle2 size={16} className="text-status-success" />
      case 'financed':
        return <Coins size={16} className="text-accent-secondary" />
      case 'offer':
        return <Coins size={16} className="text-accent-primary" />
      case 'verified':
        return <ShieldCheck size={16} className="text-status-info" />
      case 'flagged':
        return <AlertTriangle size={16} className="text-status-warning" />
      case 'registered':
        return <FileText size={16} className="text-text-primary" />
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
          Protocol Activity & Audit Trail
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Chronological cryptographic event feed recorded on the CapitalFlow smart contracts.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: 'All Events', value: 'all' },
          { label: 'Registrations', value: 'registered' },
          { label: 'Verifications', value: 'verified' },
          { label: 'Financier Bids', value: 'offer' },
          { label: 'Disbursements', value: 'financed' },
          { label: 'Settlements', value: 'settled' },
          { label: 'Flags', value: 'flagged' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === tab.value
                ? 'bg-accent-primary text-white'
                : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Feed */}
      <div className="space-y-4">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="rounded-2xl border border-border-default bg-bg-surface p-5 hover:border-border-bright transition-all card-hover space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-bg-elevated border border-border-default">
                  {getEventIcon(ev.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{ev.title}</h3>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {formatDateTime(ev.timestamp)} • Block #{ev.blockNumber}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-elevated border border-border-default text-text-secondary font-medium">
                  {ev.actorRole}
                </span>
                <div className="text-[10px] text-text-muted font-mono mt-1">
                  {truncateAddress(ev.actor)}
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed pl-11">
              {ev.description}
            </p>

            <div className="pt-2 pl-11 flex items-center justify-between text-[11px] border-t border-border-default/40">
              <span className="text-text-muted">Transaction Hash:</span>
              <HashDisplay value={ev.txHash} truncate={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck2,
  Lock,
  Building,
  Users,
  Coins,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { formatINR } from '@/lib/utils'
import { DEMO_DISCLAIMER } from '@/lib/constants'
import { StatCard } from '@/components/ui/stat-card'

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border-default bg-gradient-to-b from-bg-surface via-bg-surface/80 to-bg-base p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-accent-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-accent-secondary/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary-muted px-3 py-1 text-xs font-semibold text-accent-primary">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            Blockchain-Powered Trade Credit Infrastructure
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-tight">
            Instant Working Capital for <span className="gradient-text">India's MSME</span> Supply Chains
          </h1>

          <p className="text-lg md:text-xl text-text-secondary leading-relaxed font-normal">
            Eliminate 90-day buyer payment delays. CapitalFlow transforms approved enterprise invoices into verified on-chain assets, enabling transparent, competitive invoice discounting with zero double-financing risk.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-accent-primary text-white font-semibold text-sm hover:bg-accent-primary-hover shadow-glow-green transition-all"
            >
              Launch Live App Demo
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-primary font-medium text-sm transition-all"
            >
              View System Architecture
              <ExternalLink size={14} className="text-text-muted" />
            </Link>
          </div>
        </div>

        {/* Live Protocol Metrics */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-border-default/60">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-text-primary">
              ₹1.08 Cr
            </div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">
              Total Invoiced Face Value
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-accent-primary">
              ₹76.0 L
            </div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">
              Capital Deployed (mINR)
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-accent-secondary">
              28.4%
            </div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">
              Average Annualised Yield
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-status-success">
              0.00%
            </div>
            <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">
              Historic Default Rate
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Quick Entry */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Explore by Ecosystem Role</h2>
          <p className="text-sm text-text-secondary mt-1">
            Experience CapitalFlow from any participant perspective using pre-configured test accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Supplier */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4 hover:border-accent-primary transition-all card-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">MSME Supplier</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Register GST-backed invoices, compute cryptographic SHA-256 document hashes, and receive upfront cash advances within 24 hours.
            </p>
            <div className="pt-2">
              <Link
                href="/supplier"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-primary hover:underline"
              >
                Go to Supplier Portal <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Financier */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4 hover:border-accent-secondary transition-all card-hover">
            <div className="h-10 w-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary">
              <Coins size={22} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">NBFC / Financier</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Browse pre-verified corporate invoices, review AI credit risk scores, and deploy capital directly via escrow smart contracts.
            </p>
            <div className="pt-2">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-secondary hover:underline"
              >
                Browse Marketplace <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Admin / Verifier */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4 hover:border-status-info transition-all card-hover">
            <div className="h-10 w-10 rounded-xl bg-status-info-bg flex items-center justify-center text-status-info">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Admin / Verifier</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Audit enterprise e-way bills, verify purchase orders against GSTN databases, and manage dispute resolution workflows.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-info hover:underline"
              >
                Open Verifier Queue <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step End-to-End Lifecycle */}
      <section className="rounded-2xl border border-border-default bg-bg-surface p-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-accent-primary">
            How It Works
          </span>
          <h2 className="text-2xl font-bold text-text-primary mt-1">
            Tamper-Proof Supply Chain Financing Lifecycle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center font-bold text-sm text-accent-primary">
              1
            </div>
            <h4 className="font-semibold text-text-primary">Invoice Registration</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Supplier registers invoice parameters on-chain. A SHA-256 hash of the original tax invoice locks document integrity.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center font-bold text-sm text-status-info">
              2
            </div>
            <h4 className="font-semibold text-text-primary">Auditor Verification</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Authorised verifier checks e-way bills and cross-references enterprise buyers before transition to Verified state.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center font-bold text-sm text-accent-secondary">
              3
            </div>
            <h4 className="font-semibold text-text-primary">Competitive Escrow</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Financiers submit non-revocable capital offers. Accepting an offer immediately releases advance funds to the supplier.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center font-bold text-sm text-status-success">
              4
            </div>
            <h4 className="font-semibold text-text-primary">Automated Settlement</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Buyer settlement repays principal + interest to the financier, remits protocol fees to treasury, and releases residual to supplier.
            </p>
          </div>
        </div>
      </section>

      {/* Prototype Disclaimer Banner */}
      <section className="rounded-xl border border-status-warning/40 bg-status-warning-bg/40 p-5 flex items-start gap-4">
        <div className="h-6 w-6 rounded-full bg-status-warning/20 flex items-center justify-center text-status-warning shrink-0 mt-0.5">
          !
        </div>
        <div className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-status-warning font-semibold">Educational Prototype Notice: </strong>
          {DEMO_DISCLAIMER}
        </div>
      </section>
    </div>
  )
}

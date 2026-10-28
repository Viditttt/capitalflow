'use client'

import Link from 'next/link'
import { BookOpen, ShieldCheck, Zap, Coins, Building2, Check, ArrowRight, ExternalLink } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary">
          CapitalFlow Methodology & Architecture
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Technical, financial, and regulatory architecture of the blockchain SME trade financing protocol.
        </p>
      </div>

      {/* 1. Problem Statement */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-primary" />
          1. The MSME Working Capital Dilemma in India
        </h2>
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-3 text-xs text-text-secondary leading-relaxed">
          <p>
            Micro, Small, and Medium Enterprises (MSMEs) contribute over 30% of India's GDP and nearly 45% of manufacturing output. However, their growth is severely bottlenecked by prolonged receivable cycles (often 90 to 120 days) imposed by large enterprise obligors.
          </p>
          <p>
            Traditional trade factoring faces three systemic vulnerabilities:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-text-primary font-medium">
            <li><strong>Double-Financing Fraud:</strong> A dishonest supplier submits the identical invoice across multiple non-communicating NBFCs or banks.</li>
            <li><strong>Opaque Paper Verification:</strong> Invoices and e-way bills are prone to post-facto alterations and phantom shipments.</li>
            <li><strong>Illiquid Capital Allocation:</strong> Lenders have no real-time transparency into repayment status, leading to exorbitant risk premiums (30%+ APR).</li>
          </ul>
        </div>
      </section>

      {/* 2. On-Chain vs Off-Chain Architecture */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-secondary" />
          2. System Architecture & Separation of Concerns
        </h2>
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border-default bg-bg-base p-4 space-y-2">
              <h3 className="font-bold text-accent-primary text-sm">On-Chain Source of Truth</h3>
              <p className="text-text-secondary">Smart contracts enforce zero-trust financial mechanics:</p>
              <ul className="list-disc pl-4 space-y-1 text-text-muted">
                <li>Immutable state machine transitions (Submitted → Verified → Financed → Settled)</li>
                <li>SHA-256 document hash uniqueness preventing duplicate financing</li>
                <li>Non-custodial escrow for financier liquidity deposit and auto-disbursement</li>
                <li>Access control (DEFAULT_ADMIN, VERIFIER, FINANCIER, DEMO_PAYER)</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border-default bg-bg-base p-4 space-y-2">
              <h3 className="font-bold text-accent-secondary text-sm">Off-Chain Application Layer</h3>
              <p className="text-text-secondary">Next.js front-end preserves confidentiality and user agility:</p>
              <ul className="list-disc pl-4 space-y-1 text-text-muted">
                <li>Client-side SHA-256 hashing preserving proprietary invoice and pricing data</li>
                <li>Algorithmic credit risk scoring based on enterprise sector and tenors</li>
                <li>MetaMask direct signing — no custodial server keys required</li>
                <li>Real-time event projection and indexing for sub-second UI updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mathematical & Economic Formulations */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-info" />
          3. Financial Calculations & Settlement Waterfall
        </h2>
        <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-4 text-xs font-mono">
          <div className="space-y-2">
            <div className="text-accent-primary font-bold">A. Principal Advance:</div>
            <div className="bg-bg-base p-3 rounded-xl border border-border-default text-text-primary">
              Principal = (FaceValue × AdvanceRateBps) / 10,000
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-accent-primary font-bold">B. Protocol Service Fee (0.50%):</div>
            <div className="bg-bg-base p-3 rounded-xl border border-border-default text-text-primary">
              ServiceFee = (Principal × 50) / 10,000
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-accent-primary font-bold">C. Implied Annualised Rate (APR):</div>
            <div className="bg-bg-base p-3 rounded-xl border border-border-default text-text-primary">
              ImpliedAPR_Bps = (FinancierFee × 365 × 10,000) / (Principal × TenorDays)
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-accent-primary font-bold">D. Settlement Distribution at Maturity:</div>
            <div className="bg-bg-base p-3 rounded-xl border border-border-default text-text-primary space-y-1">
              <div>TotalDue = Principal + FinancierFee</div>
              <div>Financier Payout = TotalDue</div>
              <div>Treasury Payout = ServiceFee</div>
              <div>Supplier Residual = FaceValue - TotalDue</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Smart Contract Specifications */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success" />
          4. Smart Contract Specifications
        </h2>
        <div className="rounded-2xl border border-border-default bg-bg-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated border-b border-border-default text-text-muted">
              <tr>
                <th className="p-3.5 font-semibold">Contract</th>
                <th className="p-3.5 font-semibold">Standard</th>
                <th className="p-3.5 font-semibold">Core Responsibilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50 text-text-secondary">
              <tr className="hover:bg-bg-hover">
                <td className="p-3.5 font-mono font-bold text-text-primary">InvoiceRegistry.sol</td>
                <td className="p-3.5 font-mono">AccessControl, Pausable</td>
                <td className="p-3.5">Invoice registration, duplicate prevention, verifier gating, lifecycle flags and disputes.</td>
              </tr>
              <tr className="hover:bg-bg-hover">
                <td className="p-3.5 font-mono font-bold text-text-primary">FinancingMarketplace.sol</td>
                <td className="p-3.5 font-mono">ReentrancyGuard, Escrow</td>
                <td className="p-3.5">Competitive offer submission, locked capital escrow, one-click acceptance, and waterfall settlement.</td>
              </tr>
              <tr className="hover:bg-bg-hover">
                <td className="p-3.5 font-mono font-bold text-text-primary">MockINRToken.sol</td>
                <td className="p-3.5 font-mono">ERC-20 (6 Decimals)</td>
                <td className="p-3.5">Simulated INR stable asset with public test faucet and role-based minting.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Call to action */}
      <div className="rounded-2xl border border-accent-primary/30 bg-accent-primary-muted/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">Ready to Test the Protocol?</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Connect your MetaMask wallet or use any of the pre-configured persona accounts.
          </p>
        </div>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-xs font-semibold hover:bg-accent-primary-hover shadow-glow-green transition-all shrink-0"
        >
          Open Persona Switcher
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

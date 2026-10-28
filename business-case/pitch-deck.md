# CapitalFlow — Investor Pitch Deck Outline (10 Slides)

## Slide 1: Cover Slide
- **Title:** CapitalFlow
- **Subtitle:** Decentralised Trade Liquidity Infrastructure for India's ₹25 Lakh Crore MSME Supply Chain
- **Presenter:** Senior Product & Engineering Team
- **Tagline:** Turning 90-day trade receivables into 24-hour liquidity with zero double-financing risk.

---

## Slide 2: The Macro Problem
- 63 Million Indian MSMEs generate 30% of national GDP.
- 85%+ are starved of formal credit; average payment terms from Tier-1 corporate buyers are 60 to 120 days.
- India's MSME working capital credit void is currently pegged at **₹25+ Lakh Crore** (RBI UK Sinha Committee).
- **The Human Impact:** Profitable, order-rich factories default on payroll or turn down orders simply because their cash is trapped in pending invoices.

---

## Slide 3: Why Existing Solutions Fail
1. **Traditional Bank Factoring:**
   - 2-3 week paper-heavy underwriting cycles.
   - Requires personal promoter guarantees and collateral.
2. **Double-Financing Scams:**
   - Banks operate in silos. Dishonest vendors pledge the exact same PDF invoice to 3 different NBFCs before default.
3. **TReDS Exchange Bottlenecks:**
   - Rigid enterprise onboarding requirements; slow buyer sign-off rates.

---

## Slide 4: The CapitalFlow Solution
- **Cryptographic Document Anchoring:** SHA-256 client-side hashing locks the unique invoice parameters directly onto Ethereum/EVM smart contracts. Double pledging reverts deterministically at contract level.
- **Permissionless Bidding Marketplace:** Institutional NBFCs and digital debt funds compete in transparent on-chain auctions, driving down cost of capital for SMEs.
- **Non-Custodial Escrow Disbursal:** Capital is locked in escrow; upon supplier acceptance, advances transfer in sub-seconds.
- **Automated Settlement Waterfall:** When corporate buyers settle, smart contracts disburse principal + interest to financiers, protocol fees to treasury, and residual equity to suppliers.

---

## Slide 5: Product Architecture & Security
- **Smart Contracts:** OpenZeppelin-standard `InvoiceRegistry.sol` (state machine & deduplication), `FinancingMarketplace.sol` (reentrancy-guarded escrow & waterfall), and `MockINRToken.sol` (ERC-20 standard).
- **Access Control:** Separation of duties (`DEFAULT_ADMIN`, `VERIFIER_ROLE`, `FINANCIER_ROLE`, `DEMO_PAYER_ROLE`).
- **Privacy Preservation:** Only 32-byte cryptographic digests are anchored on-chain. Proprietary customer names, SKU items, and margins remain private off-chain.

---

## Slide 6: Unit Economics & Monetisation
- **For the Supplier:** Disburses 80% advance in <24 hours. Accelerates cash conversion cycle from 60 days to 1 day.
- **For the Financier:** Earns 24% – 33% annualised risk-adjusted yield on short-duration (30–60 day) corporate trade credit.
- **For CapitalFlow:** 50 bps (0.50%) origination fee on every transaction + enterprise API data feeds.
- **Unit Example (₹10 Lakh Invoice):**
  - Face Value: ₹10,00,000 | Principal Advance: ₹8,00,000 | Discount Fee: ₹40,000 (30.4% APR)
  - CapitalFlow Protocol Fee: ₹4,000 | Disbursed to SME: ₹7,96,000 | Residual Payout: ₹1,60,000.

---

## Slide 7: Market Opportunity (TAM / SAM / SOM)
- **TAM:** ₹120 Lakh Crore total annual B2B trade in India.
- **SAM:** ₹30 Lakh Crore formal GST-compliant supplier invoices in manufacturing & infrastructure.
- **SOM:** ₹500 Crore target volume in initial automotive OEM supplier hubs (Pune, Chennai, NCR) across Years 1–3.

---

## Slide 8: Go-To-Market Beachhead
- **Anchor Strategy (OEM-Led Onboarding):** Partner with Tier-1 automotive and engineering original equipment manufacturers (OEMs).
- **Channel Distribution:** Integrate with ERPs (SAP, Tally, Zoho Books) to pull verified GST e-Way bills in 1-click.
- **Institutional Capital Partnerships:** Partner with digital-first NBFCs and alternative credit funds seeking short-duration high-yield asset-backed receivables.

---

## Slide 9: Competitive Moat
1. **Network Effects:** As more suppliers and financiers onboard, liquidity depth increases and pricing tightens.
2. **Immutable Fraud Protection:** Proprietary cryptographic deduplication eliminates double-financing losses.
3. **Data Asset:** Proprietary credit performance scorecards on thousands of Indian MSMEs.

---

## Slide 10: Milestones & Vision
- **Phase 1–3 Complete:** Smart contracts developed, audited, and verified with 44 passing unit/lifecycle tests.
- **Phase 4–5 Complete:** Production Next.js 16 App Router interface built with 14 pages, role-based switching, interactive calculator, and Recharts analytics.
- **Next Phase:** Mainnet testnet deployment, regulatory sandbox pilot under RBI / IFSCA FinTech regulatory framework.

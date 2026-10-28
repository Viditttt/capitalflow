# CapitalFlow — Regulatory Landscape & Risk Mitigation Framework

## 1. Indian Regulatory & Legal Landscape

### 1.1 The Factoring Regulation (Amendment) Act, 2021
Prior to the 2021 amendments, non-banking financial companies (NBFCs) were subjected to the "Principal Business Condition" (PBC), which required at least 50% of total assets and 50% of gross income to originate from factoring activities to obtain an NBFC-Factor license. This kept 95%+ of Indian NBFCs out of the factoring market.

The 2021 Amendment Act fundamentally altered this:
- **Broadened Market Participation:** Any non-deposit taking investment and credit company (NBFC-ICC) can now engage in trade factoring with RBI registration, expanding the pool of participating lenders from 7 to thousands.
- **TReDS Integration & Mandatory Onboarding:** Public sector enterprises and central ministries are legally mandated to register on trade receivable platforms.
- **Assignment of Receivables:** Clear statutory recognition that the assignment of receivables passes clear title to the factor/lender without requiring a formal bilateral court-registered deed of transfer.

### 1.2 Information Technology Act, 2000 & Evidence Admissibility
- **Section 4 & Section 5:** Electronic records and cryptographic hash digests satisfy statutory requirements for written documents.
- **Section 65B (Indian Evidence Act, 1872 / Bharatiya Sakshya Adhiniyam, 2023):** Computer-generated cryptographic logs (such as Ethereum blockchain event logs and immutable state roots) are legally admissible as secondary evidence when accompanied by electronic certificate verification.

### 1.3 Anti-Money Laundering (AML) & KYC
CapitalFlow operates under strict institutional compliance:
- All institutional financiers (NBFCs, funds) and enterprise suppliers must complete statutory PAN/GSTIN and Aadhaar-based video KYC (C-KYC) during platform onboarding.
- Wallet addresses are strictly bound to verified legal entities in platform registries; anonymous or unverified addresses cannot hold active smart contract roles (`VERIFIER_ROLE`, `FINANCIER_ROLE`).

---

## 2. Institutional Risk Matrix & Mitigation Strategies

| Risk Category | Inherent Vulnerability | CapitalFlow Smart Contract & Protocol Mitigation | Residual Risk Level |
| :--- | :--- | :--- | :---: |
| **Double Financing** | Supplier pledges the same invoice to multiple lenders simultaneously. | **Cryptographic Deduplication:** Smart contract enforces unique SHA-256 document hash (`idByDocumentHash`) and unique salted invoice key (`idByInvoiceKey`). Secondary attempts revert with `InvoiceAlreadyRegistered`. | **Negligible** |
| **Phantom / Fictitious Invoices** | Collusion between parties to create fabricated invoices for goods never delivered. | **Mandatory Two-Step Verification:** Invoices remain in `Submitted` status until an authorized third-party auditor (`VERIFIER_ROLE`) audits the corresponding e-Way bill and delivery receipt against the Government GSTN portal. | **Low** |
| **Reentrancy & Liquidity Drain** | Malicious contracts attempt recursive calls during escrow withdrawal or repayment. | **OpenZeppelin ReentrancyGuard:** All value transfer routines (`submitOffer`, `acceptOffer`, `repay`, `reclaim`) utilize strict CEI (Checks-Effects-Interactions) and non-reentrant mutex locks. Tested against adversarial attacker contracts. | **Negligible** |
| **Buyer Non-Payment / Default** | Corporate buyer faces insolvency or refuses invoice payment at maturity. | **Over-Collateralisation & Advance Haircut:** Financiers lend a conservative 70%–85% of face value, retaining a 15%–30% loss absorption buffer. Financier retains senior creditor lien over assigned receivables under the Factoring Act. | **Medium** |
| **Commercial Dispute over Quality** | Obligor claims shipment goods were damaged or defective upon arrival. | **Flagging & Dispute Mechanism:** Verifier or admin can transition invoice to `Flagged` or `Disputed` via `flagInvoice()` and `openDispute()`, freezing escrow payouts and triggering standard arbitration. | **Low** |
| **System Malfunction / Emergency** | External protocol vulnerability or critical node failure. | **Circuit Breaker (Pausable):** `InvoiceRegistry` and `FinancingMarketplace` implement OpenZeppelin `Pausable`, allowing `DEFAULT_ADMIN` to immediately halt actions while preserving locked funds safely in escrow. | **Low** |

---

## 3. Dispute Resolution Lifecycle

1. **Identification:** If an enterprise buyer reports goods discrepancies, the Verifier executes `flagInvoice(invoiceId, reasonHash)`.
2. **Investigation Window:** Marketplace bidding is instantly frozen. The supplier has 5 business days to provide rectified credit notes or physical inspection sign-offs.
3. **Resolution:**
   - **Rectified:** Verifier executes `resolveFlag(invoiceId, reReview, reasonHash)`, returning the asset to active standing.
   - **Irreconcilable:** Admin executes `openDispute(invoiceId, reasonHash)` or `rejectInvoice(invoiceId, reasonHash)`. If offers were submitted in escrow, financiers can immediately invoke `reclaim(offerId)` to withdraw their locked principal.

# CapitalFlow — Financial Model & Yield Sensitivity Analysis

## 1. Unit Economics Across Invoice Profiles

The table below illustrates the financial settlement distribution across representative SME invoice profiles under standard protocol parameters:

| Metric | Profile A (SME Parts) | Profile B (Standard) | Profile C (Packaging) | Profile D (Infra Fab) |
| :--- | :--- | :--- | :--- | :--- |
| **Industry Sector** | Auto Components | Precision Engineering | Retail & FMCG | Metro Infrastructure |
| **Invoice Face Value ($F$)** | ₹5,00,000 | ₹10,00,000 | ₹25,00,000 | ₹50,00,000 |
| **Payment Tenor** | 45 Days | 60 Days | 60 Days | 90 Days |
| **Advance Rate** | 80% | 80% | 85% | 80% |
| **Gross Principal ($P$)** | ₹4,00,000 | ₹8,00,000 | ₹21,25,000 | ₹40,00,000 |
| **Financier Fee Rate** | 4.0% | 5.0% | 5.5% | 7.5% |
| **Financier Fee ($Fee$)** | ₹16,000 | ₹40,000 | ₹1,16,875 | ₹3,00,000 |
| **Implied APR** | **32.44% p.a.** | **30.41% p.a.** | **33.46% p.a.** | **30.41% p.a.** |
| **Protocol Fee (0.50%)** | ₹2,000 | ₹4,00,000 × 0.5% = ₹4,000 | ₹10,625 | ₹20,000 |
| **Upfront Cash Disbursed** | ₹3,98,000 | ₹7,96,000 | ₹21,14,375 | ₹39,80,000 |
| **Total Repayment Due** | ₹4,16,000 | ₹8,40,000 | ₹22,41,875 | ₹43,00,000 |
| **Supplier Residual Release**| ₹84,000 | ₹1,60,000 | ₹2,58,125 | ₹7,00,000 |

---

## 2. Yield Sensitivity Matrix (Implied Annualised APR %)

The implied annualised percentage rate is governed by the relation:
$$\text{APR} = \frac{\text{Fee} \times 365 \times 10,000}{\text{Principal} \times \text{Tenor (Days)}}$$

The sensitivity table below demonstrates how the annualised yield changes across varying tenors and nominal discount rates:

| Tenor \ Nominal Fee % | 3.00% | 4.00% | 5.00% | 6.00% | 7.50% |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **30 Days** | 36.50% | 48.67% | 60.83% | 73.00% | 91.25% |
| **45 Days** | 24.33% | 32.44% | 40.56% | 48.67% | 60.83% |
| **60 Days** | 18.25% | 24.33% | **30.41%** | 36.50% | 45.63% |
| **75 Days** | 14.60% | 19.47% | 24.33% | 29.20% | 36.50% |
| **90 Days** | 12.17% | 16.22% | 20.28% | 24.33% | **30.41%** |
| **120 Days** | 9.13% | 12.17% | 15.21% | 18.25% | 22.81% |

### Key Observation:
For typical 60-day enterprise supply chain invoices, a nominal discount fee between **4.0% and 5.5%** yields a highly attractive **24.3% to 33.5% APR** for institutional liquidity providers, while offering SME suppliers immediate liquidity that costs significantly less than informal moneylenders or equity dilution.

---

## 3. Platform 3-Year Pro-Forma Financial Projections

| Line Item (in ₹ Lakhs) | Year 1 | Year 2 | Year 3 |
| :--- | :---: | :---: | :---: |
| **Total Invoiced Volume (GMV)** | ₹5,000 L (₹50 Cr) | ₹25,000 L (₹250 Cr) | ₹1,00,000 L (₹1,000 Cr) |
| **Capital Deployed (80% Advance)** | ₹4,000 L | ₹20,000 L | ₹80,000 L |
| **Protocol Revenue (0.50% Origination)** | ₹20.0 L | ₹100.0 L | ₹400.0 L |
| **SaaS & Verification API Revenue** | ₹5.0 L | ₹25.0 L | ₹75.0 L |
| **Total Protocol Revenue** | **₹25.0 L** | **₹125.0 L** | **₹475.0 L** |
| | | | |
| **Operating Expenses (OpEx):** | | | |
| Engineering & Smart Contract Audits | ₹15.0 L | ₹30.0 L | ₹60.0 L |
| Sales, OEM Partnerships & Onboarding | ₹8.0 L | ₹25.0 L | ₹55.0 L |
| Compliance, Legal & Infrastructure | ₹6.0 L | ₹15.0 L | ₹30.0 L |
| **Total Operating Expenses** | **₹29.0 L** | **₹70.0 L** | **₹145.0 L** |
| | | | |
| **EBITDA** | **-₹4.0 L** | **+₹55.0 L** | **+₹330.0 L** |
| **EBITDA Margin** | *-16%* | *+44%* | *+69%* |

---

## 4. Supplier Working Capital ROI & Velocity Gain

For an SME supplier with ₹10,00,000 in monthly turnover:
- **Baseline Scenario (Without CapitalFlow):**
  - Cash tied up in unpaid invoices: ₹20,00,000 (60-day receivable lockup).
  - Supplier cannot purchase raw materials for new customer orders; annual turnover constrained to ₹60 Lakhs.
- **CapitalFlow Enabled Scenario:**
  - Cash conversion cycle compressed from 60 days to **< 24 hours**.
  - Supplier unlocks ₹8,00,000 instantly per invoice.
  - Working capital turnover increases from 6x to **18x per year**, enabling the SME to expand output by **200%** with zero additional external debt or equity dilution.

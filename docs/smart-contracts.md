# Smart contracts

> **Educational prototype. Test tokens only. Not audited. Not a lending platform.**
> Passing tests do not make these contracts secure. See "Known risks" below.

## Contracts

| Contract | Size | Purpose |
|---|---|---|
| `MockINRToken` | 2.4 KB | Worthless 6-decimal test token. 1 token = Rs 1 in the business-model assumptions. Faucet (once/day) + owner mint. |
| `InvoiceRegistry` | 5.2 KB | Invoice commitments (supplier, face value, dates, document hash) and verification status. No function can edit those fields after registration. |
| `FinancingMarketplace` | 8.8 KB | Offers, escrow, acceptance/funding, simulated repayment and settlement. |

Escrow and settlement live in the marketplace on purpose: a separate escrow contract would add an approval surface for no gain at this size. No upgradeability: it adds attack surface and the brief did not require it.

## Roles

| Role | Held by | Powers |
|---|---|---|
| (none) | any wallet | Register invoices (becomes supplier of record), accept offers on its own invoices |
| `VERIFIER_ROLE` | registry | Verify, reject, flag submitted invoices |
| `FINANCIER_ROLE` | marketplace | Submit offers (escrowing tokens), cancel own offers |
| `DEMO_PAYER_ROLE` | marketplace | Trigger the *simulated* buyer repayment |
| `MARKETPLACE_ROLE` | registry (held by the marketplace contract) | Mark invoices Financed / Settled |
| `DEFAULT_ADMIN_ROLE` | both | Grant/revoke roles, resolve flags, open/resolve disputes, pause, set bounded parameters |

The admin has **no function that moves escrowed or user funds** (tested). Admin parameter limits are hard-coded: max advance <= 95%, service fee <= 5%.

## Invoice states

`Submitted -> Verified -> Financed -> Settled`, with `Rejected`, `Flagged` (blocked, admin resolves back to `Submitted` for re-review or to `Rejected`, never straight to `Verified`) and `Disputed` (admin record on a financed invoice; repayment still works). **Overdue is derived** (`isOverdue`): financing is active and now > due date. It is not stored.

## Offer states

`Open -> Accepted | Cancelled | Expired | Voided`

- Financier escrows the **principal** at offer time, so a supplier can never accept an offer the financier cannot fund.
- `cancelOffer` (financier) and `reclaim` (anyone; funds always go to the financier) return escrow. `reclaim` works once the offer expired **or** its invoice is no longer Verified (financed by a rival offer, rejected, flagged). Refunds are pull-based per offer so one failing transfer cannot block anyone else.
- Accepting moves the invoice to Financed, which makes every competing offer non-acceptable.

## Money flow (all integer maths, token base units)

```
offer:       financier --principal--> escrow
accept:      escrow --(principal - serviceFee)--> supplier ;  escrow --serviceFee--> treasury
repay:       payer pays the invoice FACE VALUE (simulated buyer payment)
             payer --(principal + fee)--> financier ;  payer --(face - principal - fee)--> supplier
```

Headline demo (all tests assert these exact balances): face Rs 10,00,000; principal 8,00,000; fee 40,000; total due 8,40,000; service fee 0.50% of principal = 4,000 (platform revenue, **separate from** the financier's fee); supplier nets 9,56,000 (= face - fee - service fee).

Implied annualised cost = `fee / principal * 365 days / duration`, simple (non-compounded), actual/365, integer division truncates. Rs 40,000 on Rs 8,00,000 over 60 days = 3041 bps (30.41%).

Limits enforced on-chain: `principal <= face * maxAdvanceBps / 10000` (default 90%), `principal + fee <= face`, offer validity 1 hour to 30 days, offer must expire before the invoice due date.

## Pausing

Pausing blocks only **new** offers, **new** acceptances (marketplace) and **new** registrations (registry). `cancelOffer`, `reclaim` and `repay` always work, so a pause can never trap funds.

## Test coverage (44 tests, `npm run contracts:test`)

Registry (10), marketplace (26), headline lifecycle (1), token (3), reentrancy (4). Covers every failure case listed in the brief. Reentrancy tests use a callback token and an attacker contract that tries to re-enter `cancelOffer`, `reclaim`, `acceptOffer` and `repay` while a bystander's escrow sits in the contract.

**Mutation check (manual, run during development):** 8 deliberate breakages of security-critical lines (repay amount check, repay role, supplier check, expiry check, financing limit, verify status check, and the reentrancy guard + checks-effects-interactions ordering in `cancelOffer` and `reclaim`) were each caught by at least one test. The first reentrancy test version *missed* one of these; it was strengthened. Removing only `nonReentrant` while keeping checks-effects-interactions is correctly not caught, because the contract stays safe: the two layers are redundant by design.

**Not done:** static analysis (e.g. Slither), fuzz/invariant testing, formal verification, an independent audit, gas optimisation.

## Known risks and limitations

1. **Not audited.** Do not use with real value.
2. **Trusted roles.** Verifiers, the admin, and the demo payer are trusted. A verifier can flag a verified invoice after offers exist (financiers recover escrow; the supplier loses the deal). The admin can grant roles to itself and others.
3. **Repayment is simulated.** `repay` proves a DEMO_PAYER sent tokens, not that any real buyer paid. The blockchain cannot prove an invoice is genuine, that goods were delivered, or that a buyer will pay.
4. **Standard ERC-20 only.** Fee-on-transfer, rebasing and hook tokens are unsupported. Only `MockINRToken` is intended.
5. **One financier per invoice,** no partial funding.
6. **No overdue penalty or interest accrual;** overdue is a status only. Credit losses are not modelled on-chain.
7. **Anyone can register invoices** (spam). Gating is off-chain.
8. **Privacy:** `invoiceKey` is a hash of an identifier. A low-entropy identifier (e.g. "INV-001") can be brute-forced, so the backend should include a salt/buyer identifier. Do not rely on hashes for confidentiality.
9. **Time:** uses `block.timestamp` (small manipulation window on real chains; irrelevant at day-scale).
10. **Financier can cancel any Open offer at any time** (before acceptance).
11. **Faucet and mint exist** for testing; a real deployment would have neither.

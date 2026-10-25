import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import {
  deployAll, expectRevert, hashOf, inr, DAY,
  PRINCIPAL, FEE, FACE, TOTAL_DUE, SERVICE_FEE, SUPPLIER_ADVANCE, SUPPLIER_RESIDUAL,
  InvoiceStatus, OfferStatus, FinancingStatus,
} from "../support/helpers.js";

const BAL = "ERC20InsufficientBalance(address,uint256,uint256)";
const ALLOW = "ERC20InsufficientAllowance(address,uint256,uint256)";

describe("FinancingMarketplace: offers", async () => {
  const conn = await network.create();
  async function fixture() {
    return deployAll(conn);
  }
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("rejects offers on unverified, rejected and unknown invoices", async () => {
    const c = await load();
    const submitted = await c.register(c.supplier, "S");
    await c.token.write.approve([c.market.address, PRINCIPAL], { account: c.financier.account });
    await expectRevert(c.market.write.submitOffer([submitted, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account }), "InvoiceNotVerified");
    await c.registry.write.rejectInvoice([submitted, hashOf("r")], { account: c.verifier.account });
    await expectRevert(c.market.write.submitOffer([submitted, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account }), "InvoiceNotVerified");
    await expectRevert(c.market.write.submitOffer([999n, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account }), "InvoiceNotFound");
  });

  it("only authorised financiers can offer", async () => {
    const c = await load();
    const id = await c.registerVerified();
    await c.token.write.approve([c.market.address, PRINCIPAL], { account: c.stranger.account });
    for (const who of [c.stranger, c.supplier, c.verifier, c.admin]) {
      await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 7n * DAY], { account: who.account }), "AccessControlUnauthorizedAccount");
    }
  });

  it("escrows the principal and records the offer", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const before = await c.bal(c.financier);
    const offerId = await c.offer(id);
    assert.equal(await c.bal(c.financier), before - PRINCIPAL);
    assert.equal(await c.bal(c.market.address), PRINCIPAL);
    const o = await c.market.read.getOffer([offerId]);
    assert.equal(o.status, OfferStatus.Open);
    assert.equal(o.principal, PRINCIPAL);
    assert.equal(o.fee, FEE);
  });

  it("enforces the financing limit and total-due ceiling", async () => {
    const c = await load();
    const id = await c.registerVerified();
    await c.token.write.approve([c.market.address, FACE], { account: c.financier.account });
    // limit is 90% of face value
    assert.equal(await c.market.read.maxPrincipalFor([FACE]), inr(900_000));
    await c.market.write.submitOffer([id, inr(900_000), inr(1_000), 7n * DAY], { account: c.financier.account }); // exactly at limit
    await expectRevert(c.market.write.submitOffer([id, inr(900_001), FEE, 7n * DAY], { account: c.financier.account }), "PrincipalExceedsLimit");
    await expectRevert(c.market.write.submitOffer([id, inr(850_000), inr(150_001), 7n * DAY], { account: c.financier.account }), "TotalDueExceedsFaceValue");
    await expectRevert(c.market.write.submitOffer([id, 0n, FEE, 7n * DAY], { account: c.financier.account }), "ZeroPrincipal");
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, 0n, 7n * DAY], { account: c.financier.account }), "ZeroFee");
  });

  it("rejects invalid validity windows", async () => {
    const c = await load();
    const id = await c.registerVerified(); // due in 60 days
    await c.token.write.approve([c.market.address, PRINCIPAL], { account: c.financier.account });
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 60n * 60n - 1n], { account: c.financier.account }), "InvalidValidity");
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 31n * DAY], { account: c.financier.account }), "InvalidValidity");
  });

  it("an offer cannot outlive the invoice due date", async () => {
    const c = await load();
    const t = await c.nowTs();
    await c.registry.write.registerInvoice([hashOf("short"), FACE, t - DAY, t + 3n * DAY, hashOf("short-doc")], { account: c.supplier.account });
    const id = await c.registry.read.invoiceCount();
    await c.registry.write.verifyInvoice([id], { account: c.verifier.account });
    await c.token.write.approve([c.market.address, PRINCIPAL], { account: c.financier.account });
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 5n * DAY], { account: c.financier.account }), "OfferOutlivesInvoice");
  });

  it("fails cleanly on insufficient token balance or allowance", async () => {
    const c = await load();
    const id = await c.registerVerified();
    // no allowance
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account }), ALLOW);
    // allowance but not enough tokens
    const poor = c.financier2;
    await c.token.write.transfer([c.stranger.account.address, await c.bal(poor)], { account: poor.account });
    await c.token.write.approve([c.market.address, PRINCIPAL], { account: poor.account });
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 7n * DAY], { account: poor.account }), BAL);
    // approval smaller than principal
    await c.token.write.approve([c.market.address, PRINCIPAL - 1n], { account: c.financier.account });
    await expectRevert(c.market.write.submitOffer([id, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account }), ALLOW);
    assert.equal(await c.market.read.offerCount(), 0n);
  });

  it("financier can cancel an open offer and gets a full refund; nobody else can", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const start = await c.bal(c.financier);
    const offerId = await c.offer(id);
    await expectRevert(c.market.write.cancelOffer([offerId], { account: c.stranger.account }), "NotOfferFinancier");
    await expectRevert(c.market.write.cancelOffer([offerId], { account: c.supplier.account }), "NotOfferFinancier");
    await c.market.write.cancelOffer([offerId], { account: c.financier.account });
    assert.equal(await c.bal(c.financier), start);
    assert.equal(await c.bal(c.market.address), 0n);
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Cancelled);
    await expectRevert(c.market.write.cancelOffer([offerId], { account: c.financier.account }), "OfferNotOpen"); // no double refund
  });
});

describe("FinancingMarketplace: acceptance and funding", async () => {
  const conn = await network.create();
  async function fixture() {
    return deployAll(conn);
  }
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("supplier accepts: advance and service fee are paid, offer and invoice update", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const offerId = await c.offer(id);
    const sBefore = await c.bal(c.supplier);
    const tBefore = await c.bal(c.treasury);
    const hash = await c.market.write.acceptOffer([offerId], { account: c.supplier.account });

    assert.equal(await c.bal(c.supplier), sBefore + SUPPLIER_ADVANCE);
    assert.equal(await c.bal(c.treasury), tBefore + SERVICE_FEE);
    assert.equal(await c.bal(c.market.address), 0n);
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Accepted);
    assert.equal((await c.registry.read.getInvoice([id])).status, InvoiceStatus.Financed);
    const f = await c.market.read.getFinancing([offerId]);
    assert.equal(f.status, FinancingStatus.Active);
    assert.equal(f.totalDue, TOTAL_DUE);
    assert.equal(f.serviceFee, SERVICE_FEE);
    assert.equal(await c.market.read.financingOfInvoice([id]), offerId);
    const ev = await c.eventsOf(hash, c.market, "OfferAccepted");
    assert.equal(ev[0].args.advancePaidToSupplier, SUPPLIER_ADVANCE);
  });

  it("only the invoice supplier can accept", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const offerId = await c.offer(id);
    for (const who of [c.stranger, c.supplier2, c.financier, c.admin]) {
      await expectRevert(c.market.write.acceptOffer([offerId], { account: who.account }), "NotInvoiceSupplier");
    }
  });

  it("cannot accept a cancelled, expired, or already-accepted offer (no duplicate funding)", async () => {
    const c = await load();
    const id1 = await c.registerVerified(c.supplier, "A");
    const cancelled = await c.offer(id1);
    await c.market.write.cancelOffer([cancelled], { account: c.financier.account });
    await expectRevert(c.market.write.acceptOffer([cancelled], { account: c.supplier.account }), "OfferNotOpen");

    const id2 = await c.registerVerified(c.supplier, "B");
    const expiring = await c.offer(id2, c.financier, PRINCIPAL, FEE, 2n * DAY);
    await c.networkHelpers.time.increase(Number(3n * DAY));
    await expectRevert(c.market.write.acceptOffer([expiring], { account: c.supplier.account }), "OfferExpired");

    const id3 = await c.registerVerified(c.supplier, "C");
    const good = await c.offer(id3);
    await c.market.write.acceptOffer([good], { account: c.supplier.account });
    await expectRevert(c.market.write.acceptOffer([good], { account: c.supplier.account }), "OfferNotOpen");
  });

  it("only one of several competing offers can be accepted; the rest are refundable", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const startA = await c.bal(c.financier);
    const startB = await c.bal(c.financier2);
    const offerA = await c.offer(id, c.financier, PRINCIPAL, FEE);
    const offerB = await c.offer(id, c.financier2, inr(700_000), inr(30_000));
    await expectRevert(c.market.write.reclaim([offerB], { account: c.stranger.account }), "OfferStillActive");

    await c.market.write.acceptOffer([offerB], { account: c.supplier.account });
    await expectRevert(c.market.write.acceptOffer([offerA], { account: c.supplier.account }), "InvoiceNotVerified");

    // anyone can trigger the refund of the losing offer; funds go to the financier
    await c.market.write.reclaim([offerA], { account: c.stranger.account });
    assert.equal(await c.bal(c.financier), startA);
    assert.equal((await c.market.read.getOffer([offerA])).status, OfferStatus.Voided);
    assert.equal(await c.bal(c.financier2), startB - inr(700_000)); // winner's principal is out
    await expectRevert(c.market.write.reclaim([offerA], { account: c.stranger.account }), "OfferNotOpen");
  });

  it("expired offers are refunded in full via reclaim", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const start = await c.bal(c.financier);
    const offerId = await c.offer(id, c.financier, PRINCIPAL, FEE, 2n * DAY);
    await c.networkHelpers.time.increase(Number(2n * DAY) + 1);
    await c.market.write.reclaim([offerId], { account: c.stranger.account });
    assert.equal(await c.bal(c.financier), start);
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Expired);
  });

  it("flagging an invoice blocks acceptance and lets the financier recover escrow", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const start = await c.bal(c.financier);
    const offerId = await c.offer(id);
    await c.registry.write.flagInvoice([id, hashOf("suspected duplicate")], { account: c.verifier.account });
    await expectRevert(c.market.write.acceptOffer([offerId], { account: c.supplier.account }), "InvoiceNotVerified");
    await c.market.write.reclaim([offerId], { account: c.financier.account });
    assert.equal(await c.bal(c.financier), start);
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Voided);
  });
});

describe("FinancingMarketplace: settlement", async () => {
  const conn = await network.create();
  async function fixture() {
    return deployAll(conn);
  }
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("repay settles: financier gets total due, supplier the remainder, invoice is Settled", async () => {
    const c = await load();
    const { invoiceId, offerId } = await c.financed();
    const fBefore = await c.bal(c.financier);
    const sBefore = await c.bal(c.supplier);
    const pBefore = await c.bal(c.payer);
    const hash = await c.repayFull(offerId, invoiceId);

    assert.equal(await c.bal(c.financier), fBefore + TOTAL_DUE);
    assert.equal(await c.bal(c.supplier), sBefore + SUPPLIER_RESIDUAL);
    assert.equal(await c.bal(c.payer), pBefore - FACE);
    assert.equal(await c.bal(c.market.address), 0n);
    assert.equal((await c.registry.read.getInvoice([invoiceId])).status, InvoiceStatus.Settled);
    const f = await c.market.read.getFinancing([offerId]);
    assert.equal(f.status, FinancingStatus.Settled);
    assert.ok(f.settledAt > 0n);
    const ev = await c.eventsOf(hash, c.market, "FinancingSettled");
    assert.equal(ev[0].args.paidToFinancier, TOTAL_DUE);
    assert.equal(ev[0].args.paidToSupplier, SUPPLIER_RESIDUAL);
  });

  it("rejects an invalid settlement amount", async () => {
    const c = await load();
    const { offerId } = await c.financed();
    await c.token.write.approve([c.market.address, FACE * 2n], { account: c.payer.account });
    await expectRevert(c.market.write.repay([offerId, FACE - 1n], { account: c.payer.account }), "InvalidSettlementAmount");
    await expectRevert(c.market.write.repay([offerId, TOTAL_DUE], { account: c.payer.account }), "InvalidSettlementAmount");
    await expectRevert(c.market.write.repay([offerId, FACE + 1n], { account: c.payer.account }), "InvalidSettlementAmount");
  });

  it("rejects repayment by an unauthorised party, including the supplier and financier", async () => {
    const c = await load();
    const { offerId } = await c.financed();
    for (const who of [c.stranger, c.supplier, c.financier, c.admin, c.verifier]) {
      await expectRevert(c.market.write.repay([offerId, FACE], { account: who.account }), "AccessControlUnauthorizedAccount");
    }
  });

  it("rejects duplicate repayment and repayment of an offer that was never accepted", async () => {
    const c = await load();
    const { invoiceId, offerId } = await c.financed("A");
    await c.repayFull(offerId, invoiceId);
    const bal = await c.bal(c.financier);
    await c.token.write.approve([c.market.address, FACE], { account: c.payer.account });
    await expectRevert(c.market.write.repay([offerId, FACE], { account: c.payer.account }), "FinancingNotActive");
    assert.equal(await c.bal(c.financier), bal);

    const id2 = await c.registerVerified(c.supplier, "B");
    const openOffer = await c.offer(id2);
    await expectRevert(c.market.write.repay([openOffer, FACE], { account: c.payer.account }), "FinancingNotActive");
  });

  it("fails if the payer lacks allowance or balance, leaving the financing Active", async () => {
    const c = await load();
    const { offerId } = await c.financed();
    await expectRevert(c.market.write.repay([offerId, FACE], { account: c.payer.account }), ALLOW);
    assert.equal((await c.market.read.getFinancing([offerId])).status, FinancingStatus.Active);
  });

  it("overdue financings can still be repaid; isOverdue reflects the due date", async () => {
    const c = await load();
    const { invoiceId, offerId } = await c.financed();
    assert.equal(await c.market.read.isOverdue([offerId]), false);
    await c.networkHelpers.time.increase(Number(61n * DAY));
    assert.equal(await c.market.read.isOverdue([offerId]), true);
    await c.repayFull(offerId, invoiceId);
    assert.equal(await c.market.read.isOverdue([offerId]), false);
    assert.equal((await c.market.read.getFinancing([offerId])).status, FinancingStatus.Settled);
  });

  it("a disputed financing can still settle", async () => {
    const c = await load();
    const { invoiceId, offerId } = await c.financed();
    await c.registry.write.openDispute([invoiceId, hashOf("buyer dispute")], { account: c.admin.account });
    await c.repayFull(offerId, invoiceId);
    assert.equal((await c.registry.read.getInvoice([invoiceId])).status, InvoiceStatus.Settled);
  });
});

describe("FinancingMarketplace: admin, pause and maths", async () => {
  const conn = await network.create();
  async function fixture() {
    return deployAll(conn);
  }
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("only the admin can change parameters, within hard ceilings", async () => {
    const c = await load();
    await expectRevert(c.market.write.setServiceFeeBps([100n], { account: c.stranger.account }), "AccessControlUnauthorizedAccount");
    await expectRevert(c.market.write.setMaxAdvanceBps([8000n], { account: c.verifier.account }), "AccessControlUnauthorizedAccount");
    await expectRevert(c.market.write.setTreasury([c.stranger.account.address], { account: c.financier.account }), "AccessControlUnauthorizedAccount");
    await expectRevert(c.market.write.setServiceFeeBps([501n], { account: c.admin.account }), "BpsTooHigh");
    await expectRevert(c.market.write.setMaxAdvanceBps([9501n], { account: c.admin.account }), "BpsTooHigh");
    await expectRevert(c.market.write.setTreasury(["0x0000000000000000000000000000000000000000"], { account: c.admin.account }), "ZeroAddress");
    await c.market.write.setServiceFeeBps([100n], { account: c.admin.account });
    await c.market.write.setMaxAdvanceBps([8000n], { account: c.admin.account });
    assert.equal(await c.market.read.maxPrincipalFor([FACE]), inr(800_000));
  });

  it("service fee changes apply to later acceptances only (snapshotted at acceptance)", async () => {
    const c = await load();
    const id = await c.registerVerified();
    const offerId = await c.offer(id);
    await c.market.write.setServiceFeeBps([100n], { account: c.admin.account }); // 1%
    await c.market.write.acceptOffer([offerId], { account: c.supplier.account });
    assert.equal((await c.market.read.getFinancing([offerId])).serviceFee, inr(8_000));
  });

  it("pause blocks new offers and acceptances but never exits, refunds or repayment", async () => {
    const c = await load();
    const idA = await c.registerVerified(c.supplier, "A");
    const idB = await c.registerVerified(c.supplier, "B");
    const idC = await c.registerVerified(c.supplier, "C");
    const toCancel = await c.offer(idA);
    const toAccept = await c.offer(idB, c.financier2);
    const toExpire = await c.offer(idC, c.financier, PRINCIPAL, FEE, 2n * DAY);
    const active = await c.financed("D");

    await expectRevert(c.market.write.pause({ account: c.stranger.account }), "AccessControlUnauthorizedAccount");
    await c.market.write.pause({ account: c.admin.account });

    await c.token.write.approve([c.market.address, PRINCIPAL], { account: c.financier.account });
    const idE = await c.registerVerified(c.supplier2, "E");
    await expectRevert(c.market.write.submitOffer([idE, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account }), "EnforcedPause");
    await expectRevert(c.market.write.acceptOffer([toAccept], { account: c.supplier.account }), "EnforcedPause");

    // exits still work
    await c.market.write.cancelOffer([toCancel], { account: c.financier.account });
    await c.networkHelpers.time.increase(Number(2n * DAY) + 1);
    await c.market.write.reclaim([toExpire], { account: c.stranger.account });
    await c.repayFull(active.offerId, active.invoiceId);
    assert.equal((await c.market.read.getFinancing([active.offerId])).status, FinancingStatus.Settled);

    await c.market.write.unpause({ account: c.admin.account });
    await c.market.write.acceptOffer([toAccept], { account: c.supplier.account });
  });

  it("the admin has no way to move escrowed funds", async () => {
    const c = await load();
    const names = c.market.abi.filter((x: any) => x.type === "function").map((x: any) => x.name as string);
    assert.ok(!names.some((n) => /withdraw|rescue|sweep|drain|emergency/i.test(n)));
  });

  it("annualised cost uses simple actual/365: Rs 40,000 on Rs 8,00,000 over 60 days", async () => {
    const c = await load();
    // 5% over 60 days * 365/60 = 30.41% -> 3041 bps (integer division truncates)
    assert.equal(await c.market.read.impliedAnnualisedBps([PRINCIPAL, FEE, 60n * DAY]), 3041n);
    assert.equal(await c.market.read.impliedAnnualisedBps([PRINCIPAL, FEE, 365n * DAY]), 500n);
    await expectRevert(c.market.read.impliedAnnualisedBps([0n, FEE, DAY]), "ZeroPrincipal");
    await expectRevert(c.market.read.impliedAnnualisedBps([PRINCIPAL, FEE, 0n]), "ZeroDuration");
  });
});

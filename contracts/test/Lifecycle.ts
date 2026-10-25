import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import {
  deployAll, inr, DAY, FACE, PRINCIPAL, FEE, TOTAL_DUE, SERVICE_FEE, SUPPLIER_ADVANCE, SUPPLIER_RESIDUAL,
  InvoiceStatus, OfferStatus, FinancingStatus,
} from "../support/helpers.js";

/**
 * Headline demo from the project brief, executed end to end on-chain.
 * Rs 10,00,000 invoice | 80% advance = Rs 8,00,000 | financing fee Rs 40,000 | total due Rs 8,40,000
 * Platform service fee (separate from the financing fee) = 0.50% of principal = Rs 4,000
 */
describe("Headline lifecycle: Rs 10,00,000 invoice", async () => {
  const conn = await network.create();
  async function fixture() {
    return deployAll(conn);
  }
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("register -> verify -> offer -> accept -> repay -> settled, with exact balances at every step", async () => {
    const c = await load();
    const actors = [c.supplier, c.financier, c.payer, c.treasury];
    const supply = async () => (await Promise.all([...actors.map((a) => c.bal(a)), c.bal(c.market.address)])).reduce((a, b) => a + b, 0n);
    const total0 = await supply();
    const fin0 = await c.bal(c.financier);
    const sup0 = await c.bal(c.supplier);
    const tre0 = await c.bal(c.treasury);
    const pay0 = await c.bal(c.payer);

    // 1-2. supplier registers, verifier approves
    const id = await c.registerVerified();
    assert.equal((await c.registry.read.getInvoice([id])).status, InvoiceStatus.Verified);

    // 3. financier escrows the 8,00,000 principal
    const offerId = await c.offer(id);
    assert.equal(await c.bal(c.market.address), PRINCIPAL);
    assert.equal(await c.bal(c.financier), fin0 - PRINCIPAL);

    // 4. supplier accepts: gets 7,96,000; treasury gets 4,000
    await c.market.write.acceptOffer([offerId], { account: c.supplier.account });
    assert.equal(await c.bal(c.supplier), sup0 + SUPPLIER_ADVANCE);
    assert.equal(await c.bal(c.treasury), tre0 + SERVICE_FEE);
    assert.equal(await c.bal(c.market.address), 0n);
    assert.equal((await c.market.read.getFinancing([offerId])).status, FinancingStatus.Active);

    // 5. simulated buyer payment of the full 10,00,000
    await c.repayFull(offerId, id);

    // 6. final position
    assert.equal(await c.bal(c.financier), fin0 + FEE, "financier's gross return = the 40,000 fee, nothing more");
    assert.equal(await c.bal(c.treasury), tre0 + SERVICE_FEE, "platform revenue = 4,000 service fee, distinct from the financing fee");
    assert.equal(await c.bal(c.supplier), sup0 + SUPPLIER_ADVANCE + SUPPLIER_RESIDUAL);
    assert.equal(sup0 + SUPPLIER_ADVANCE + SUPPLIER_RESIDUAL - sup0, FACE - FEE - SERVICE_FEE, "supplier nets face - fee - service fee");
    assert.equal(await c.bal(c.payer), pay0 - FACE);
    assert.equal(await supply(), total0, "no tokens created or destroyed");
    assert.equal(await c.bal(c.market.address), 0n, "nothing stranded in the contract");

    assert.equal((await c.registry.read.getInvoice([id])).status, InvoiceStatus.Settled);
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Accepted);
    assert.equal((await c.market.read.getFinancing([offerId])).status, FinancingStatus.Settled);

    // Documented metrics (simple actual/365)
    assert.equal((FEE * 10_000n) / PRINCIPAL, 500n, "gross return 5.00% on principal");
    assert.equal(TOTAL_DUE, inr(840_000));
  });
});

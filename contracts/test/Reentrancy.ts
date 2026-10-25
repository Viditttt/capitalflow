import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encodeFunctionData } from "viem";
import { network } from "hardhat";
import {
  hashOf, inr, DAY, FACE, PRINCIPAL, FEE, SUPPLIER_ADVANCE, TOTAL_DUE, OfferStatus, FinancingStatus,
} from "../support/helpers.js";

/**
 * The marketplace is deployed with a token that calls back into receiving contracts (like ERC-777).
 * A contract account acting as supplier/financier tries to re-enter the marketplace the moment it
 * is paid. Every re-entry must fail and every payout must happen exactly once.
 */
describe("Reentrancy resistance", async () => {
  const conn = await network.create();
  const { viem, networkHelpers } = conn;

  async function fixture() {
    const [admin, verifier, supplier, financier, payer, treasury, stranger] = await viem.getWalletClients();
    const token = await viem.deployContract("HookToken");
    const registry = await viem.deployContract("InvoiceRegistry", [admin.account.address]);
    const market = await viem.deployContract("FinancingMarketplace", [
      token.address, registry.address, treasury.account.address, admin.account.address,
    ]);
    const attacker = await viem.deployContract("ReentrancyAttacker");

    await registry.write.grantRole([await registry.read.VERIFIER_ROLE(), verifier.account.address]);
    await registry.write.grantRole([await registry.read.MARKETPLACE_ROLE(), market.address]);
    const FINANCIER_ROLE = await market.read.FINANCIER_ROLE();
    await market.write.grantRole([FINANCIER_ROLE, financier.account.address]);
    await market.write.grantRole([FINANCIER_ROLE, attacker.address]);
    await market.write.grantRole([await market.read.DEMO_PAYER_ROLE(), payer.account.address]);

    for (const a of [financier.account.address, attacker.address, payer.account.address]) {
      await token.write.mint([a, inr(5_000_000)]);
    }

    const call = (abi: any, functionName: string, args: any[]) => encodeFunctionData({ abi, functionName, args } as any);
    const t = async () => BigInt(await networkHelpers.time.latest());

    /** Register + verify an invoice whose supplier is `by` (an EOA wallet or the attacker contract). */
    async function verifiedInvoice(key: string, byAttacker: boolean) {
      const now = await t();
      const args = [hashOf(key), FACE, now - 10n * DAY, now + 60n * DAY, hashOf("doc:" + key)];
      if (byAttacker) {
        await attacker.write.exec([registry.address, call(registry.abi, "registerInvoice", args)]);
      } else {
        await registry.write.registerInvoice(args as any, { account: supplier.account });
      }
      const id = await registry.read.invoiceCount();
      await registry.write.verifyInvoice([id], { account: verifier.account });
      return id;
    }

    /** An innocent financier's escrowed offer. A successful re-entry would drain this. */
    async function bystander() {
      const id = await verifiedInvoice("BYSTANDER", false);
      await token.write.approve([market.address, PRINCIPAL], { account: financier.account });
      await market.write.submitOffer([id, PRINCIPAL, FEE, 25n * DAY], { account: financier.account });
    }

    return { admin, verifier, supplier, financier, payer, treasury, stranger, token, registry, market, attacker, call, verifiedInvoice, bystander };
  }
  const load = () => networkHelpers.loadFixture(fixture);

  it("cancelOffer: a financier contract cannot re-enter to double-refund", async () => {
    const c = await load();
    const id = await c.verifiedInvoice("R1", false);
    const start = await c.token.read.balanceOf([c.attacker.address]);
    await c.attacker.write.exec([c.token.address, c.call(c.token.abi, "approve", [c.market.address, PRINCIPAL])]);
    await c.attacker.write.exec([c.market.address, c.call(c.market.abi, "submitOffer", [id, PRINCIPAL, FEE, 7n * DAY])]);
    const offerId = await c.market.read.offerCount();
    await c.bystander();

    const cancel = c.call(c.market.abi, "cancelOffer", [offerId]);
    await c.attacker.write.arm([c.market.address, cancel]);
    await c.attacker.write.exec([c.market.address, cancel]);

    assert.equal(await c.attacker.read.reentryAttempted(), true, "the hook must have fired");
    assert.equal(await c.attacker.read.reentrySucceeded(), false, "re-entry must be rejected");
    assert.equal(await c.token.read.balanceOf([c.attacker.address]), start, "refunded exactly once");
    assert.equal(await c.token.read.balanceOf([c.market.address]), PRINCIPAL, "bystander escrow untouched");
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Cancelled);
  });

  it("reclaim: re-entering during an expiry refund fails", async () => {
    const c = await load();
    const id = await c.verifiedInvoice("R2", false);
    const start = await c.token.read.balanceOf([c.attacker.address]);
    await c.attacker.write.exec([c.token.address, c.call(c.token.abi, "approve", [c.market.address, PRINCIPAL])]);
    await c.attacker.write.exec([c.market.address, c.call(c.market.abi, "submitOffer", [id, PRINCIPAL, FEE, 2n * DAY])]);
    const offerId = await c.market.read.offerCount();
    await c.bystander();
    await networkHelpers.time.increase(Number(2n * DAY) + 1);

    await c.attacker.write.arm([c.market.address, c.call(c.market.abi, "reclaim", [offerId])]);
    await c.market.write.reclaim([offerId], { account: c.stranger.account });

    assert.equal(await c.attacker.read.reentryAttempted(), true);
    assert.equal(await c.attacker.read.reentrySucceeded(), false);
    assert.equal(await c.token.read.balanceOf([c.attacker.address]), start);
    assert.equal(await c.token.read.balanceOf([c.market.address]), PRINCIPAL, "bystander escrow untouched");
    assert.equal((await c.market.read.getOffer([offerId])).status, OfferStatus.Expired);
  });

  it("acceptOffer: a supplier contract cannot re-enter to be paid twice", async () => {
    const c = await load();
    const id = await c.verifiedInvoice("R3", true); // supplier of record is the attacker contract
    await c.token.write.approve([c.market.address, PRINCIPAL], { account: c.financier.account });
    await c.market.write.submitOffer([id, PRINCIPAL, FEE, 7n * DAY], { account: c.financier.account });
    const offerId = await c.market.read.offerCount();
    await c.bystander();
    const before = await c.token.read.balanceOf([c.attacker.address]);

    const accept = c.call(c.market.abi, "acceptOffer", [offerId]);
    await c.attacker.write.arm([c.market.address, accept]);
    await c.attacker.write.exec([c.market.address, accept]);

    assert.equal(await c.attacker.read.reentryAttempted(), true);
    assert.equal(await c.attacker.read.reentrySucceeded(), false);
    assert.equal((await c.token.read.balanceOf([c.attacker.address])) - before, SUPPLIER_ADVANCE, "paid exactly once");
    assert.equal(await c.token.read.balanceOf([c.market.address]), PRINCIPAL, "bystander escrow untouched");
  });

  it("repay: a financier contract cannot re-enter during settlement to be paid twice", async () => {
    const c = await load();
    const id = await c.verifiedInvoice("R4", false);
    await c.attacker.write.exec([c.token.address, c.call(c.token.abi, "approve", [c.market.address, PRINCIPAL])]);
    await c.attacker.write.exec([c.market.address, c.call(c.market.abi, "submitOffer", [id, PRINCIPAL, FEE, 7n * DAY])]);
    const offerId = await c.market.read.offerCount();
    await c.market.write.acceptOffer([offerId], { account: c.supplier.account });
    const before = await c.token.read.balanceOf([c.attacker.address]);

    await c.attacker.write.arm([c.market.address, c.call(c.market.abi, "repay", [offerId, FACE])]);
    await c.token.write.approve([c.market.address, FACE * 2n], { account: c.payer.account });
    await c.market.write.repay([offerId, FACE], { account: c.payer.account });

    assert.equal(await c.attacker.read.reentryAttempted(), true);
    assert.equal(await c.attacker.read.reentrySucceeded(), false);
    assert.equal((await c.token.read.balanceOf([c.attacker.address])) - before, TOTAL_DUE, "paid total due exactly once");
    assert.equal((await c.market.read.getFinancing([offerId])).status, FinancingStatus.Settled);
  });
});

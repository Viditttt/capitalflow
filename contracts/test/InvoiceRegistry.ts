import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { deployAll, expectRevert, hashOf, inr, DAY, FACE, InvoiceStatus } from "../support/helpers.js";

describe("InvoiceRegistry", async () => {
  const conn = await network.create();
  const fixture = () => deployAll(conn);
  const load = () => conn.networkHelpers.loadFixture(fixture);

  it("registers an invoice, stores the commitment and emits an event", async () => {
    const c = await load();
    const t = await c.nowTs();
    const hash = await c.registry.write.registerInvoice(
      [hashOf("INV-1"), FACE, t - 5n * DAY, t + 30n * DAY, hashOf("doc-1")],
      { account: c.supplier.account },
    );
    const inv = await c.registry.read.getInvoice([1n]);
    assert.equal(inv.supplier.toLowerCase(), c.supplier.account.address.toLowerCase());
    assert.equal(inv.faceValue, FACE);
    assert.equal(inv.documentHash, hashOf("doc-1"));
    assert.equal(inv.status, InvoiceStatus.Submitted);
    assert.equal(await c.registry.read.idByInvoiceKey([hashOf("INV-1")]), 1n);
    const ev = await c.eventsOf(hash, c.registry, "InvoiceRegistered");
    assert.equal(ev.length, 1);
    assert.equal(ev[0].args.faceValue, FACE);
  });

  it("rejects duplicate invoice identifiers and duplicate documents, even across suppliers", async () => {
    const c = await load();
    await c.register(c.supplier, "DUP");
    const t = await c.nowTs();
    await expectRevert(
      c.registry.write.registerInvoice([hashOf("DUP"), FACE, t - DAY, t + 30n * DAY, hashOf("other-doc")], { account: c.supplier2.account }),
      "DuplicateInvoiceKey",
    );
    await expectRevert(
      c.registry.write.registerInvoice([hashOf("NEW"), FACE, t - DAY, t + 30n * DAY, hashOf("doc:DUP")], { account: c.supplier2.account }),
      "DuplicateDocumentHash",
    );
  });

  it("rejects invalid amounts, dates and empty hashes", async () => {
    const c = await load();
    const t = await c.nowTs();
    const reg = (key: string, face: bigint, issue: bigint, due: bigint, doc = "d-" + key) =>
      c.registry.write.registerInvoice([hashOf(key), face, issue, due, hashOf(doc)], { account: c.supplier.account });

    await expectRevert(reg("a", 0n, t - DAY, t + DAY), "InvalidFaceValue");
    await expectRevert(reg("b", inr(1_000_000_001), t - DAY, t + DAY), "InvalidFaceValue");
    await expectRevert(reg("c", FACE, t + 5n * DAY, t + 30n * DAY), "IssueDateInFuture");
    await expectRevert(reg("d", FACE, t - 10n * DAY, t - 10n * DAY), "InvalidDueDate"); // due == issue
    await expectRevert(reg("e", FACE, t - 10n * DAY, t - 5n * DAY), "InvalidDueDate"); // due already passed
    await expectRevert(reg("f", FACE, t - 10n * DAY, t + 400n * DAY), "TermTooLong");
    await expectRevert(
      c.registry.write.registerInvoice(["0x" + "00".repeat(32) as `0x${string}`, FACE, t - DAY, t + DAY, hashOf("z")], { account: c.supplier.account }),
      "ZeroHash",
    );
  });

  it("only a verifier can approve, reject or flag", async () => {
    const c = await load();
    const id = await c.register();
    for (const who of [c.stranger, c.supplier, c.admin, c.financier]) {
      await expectRevert(c.registry.write.verifyInvoice([id], { account: who.account }), "AccessControlUnauthorizedAccount");
      await expectRevert(c.registry.write.rejectInvoice([id, hashOf("r")], { account: who.account }), "AccessControlUnauthorizedAccount");
      await expectRevert(c.registry.write.flagInvoice([id, hashOf("r")], { account: who.account }), "AccessControlUnauthorizedAccount");
    }
    assert.equal((await c.registry.read.getInvoice([id])).status, InvoiceStatus.Submitted);
  });

  it("verifier approves and rejects; invalid transitions revert", async () => {
    const c = await load();
    const a = await c.register(c.supplier, "A");
    const b = await c.register(c.supplier, "B");
    await c.registry.write.verifyInvoice([a], { account: c.verifier.account });
    await c.registry.write.rejectInvoice([b, hashOf("blurry scan")], { account: c.verifier.account });
    assert.equal((await c.registry.read.getInvoice([a])).status, InvoiceStatus.Verified);
    assert.equal((await c.registry.read.getInvoice([b])).status, InvoiceStatus.Rejected);
    assert.equal(await c.registry.read.isEligible([a]), true);
    assert.equal(await c.registry.read.isEligible([b]), false);
    await expectRevert(c.registry.write.verifyInvoice([a], { account: c.verifier.account }), "InvalidStatus");
    await expectRevert(c.registry.write.verifyInvoice([b], { account: c.verifier.account }), "InvalidStatus");
    await expectRevert(c.registry.write.verifyInvoice([99n], { account: c.verifier.account }), "InvoiceNotFound");
  });

  it("flag workflow: only admin resolves, and never straight to Verified", async () => {
    const c = await load();
    const id = await c.registerVerified();
    await c.registry.write.flagInvoice([id, hashOf("possible duplicate")], { account: c.verifier.account });
    assert.equal(await c.registry.read.isEligible([id]), false);
    await expectRevert(c.registry.write.resolveFlag([id, true, hashOf("x")], { account: c.verifier.account }), "AccessControlUnauthorizedAccount");
    await c.registry.write.resolveFlag([id, true, hashOf("checked")], { account: c.admin.account });
    assert.equal((await c.registry.read.getInvoice([id])).status, InvoiceStatus.Submitted); // back to the verifier queue
    await c.registry.write.flagInvoice([id, hashOf("again")], { account: c.verifier.account });
    await c.registry.write.resolveFlag([id, false, hashOf("fraud")], { account: c.admin.account });
    assert.equal((await c.registry.read.getInvoice([id])).status, InvoiceStatus.Rejected);
  });

  it("only the marketplace can mark financed or settled", async () => {
    const c = await load();
    const id = await c.registerVerified();
    await expectRevert(c.registry.write.markFinanced([id], { account: c.admin.account }), "AccessControlUnauthorizedAccount");
    await expectRevert(c.registry.write.markFinanced([id], { account: c.supplier.account }), "AccessControlUnauthorizedAccount");
    await expectRevert(c.registry.write.markSettled([id], { account: c.admin.account }), "AccessControlUnauthorizedAccount");
  });

  it("critical fields cannot change and financed invoices cannot be re-verified or rejected", async () => {
    const c = await load();
    const { invoiceId } = await c.financed();
    const before = await c.registry.read.getInvoice([invoiceId]);
    await expectRevert(c.registry.write.rejectInvoice([invoiceId, hashOf("late")], { account: c.verifier.account }), "InvalidStatus");
    await expectRevert(c.registry.write.flagInvoice([invoiceId, hashOf("late")], { account: c.verifier.account }), "InvalidStatus");
    await expectRevert(c.registry.write.verifyInvoice([invoiceId], { account: c.verifier.account }), "InvalidStatus");
    const after = await c.registry.read.getInvoice([invoiceId]);
    assert.equal(after.faceValue, before.faceValue);
    assert.equal(after.dueDate, before.dueDate);
    assert.equal(after.documentHash, before.documentHash);
    // ABI exposes no setter for those fields
    const names = c.registry.abi.filter((x: any) => x.type === "function").map((x: any) => x.name);
    assert.ok(!names.some((n: string) => /^set|^update|^edit/i.test(n)));
  });

  it("admin dispute workflow works only on financed invoices", async () => {
    const c = await load();
    const { invoiceId } = await c.financed();
    await expectRevert(c.registry.write.openDispute([invoiceId, hashOf("d")], { account: c.verifier.account }), "AccessControlUnauthorizedAccount");
    await c.registry.write.openDispute([invoiceId, hashOf("buyer disputes quality")], { account: c.admin.account });
    assert.equal((await c.registry.read.getInvoice([invoiceId])).status, InvoiceStatus.Disputed);
    await c.registry.write.resolveDispute([invoiceId, hashOf("resolved")], { account: c.admin.account });
    assert.equal((await c.registry.read.getInvoice([invoiceId])).status, InvoiceStatus.Financed);
    const other = await c.register(c.supplier, "OTHER");
    await expectRevert(c.registry.write.openDispute([other, hashOf("d")], { account: c.admin.account }), "InvalidStatus");
  });

  it("pausing blocks registration only and only the admin can pause", async () => {
    const c = await load();
    await expectRevert(c.registry.write.pause({ account: c.verifier.account }), "AccessControlUnauthorizedAccount");
    await c.registry.write.pause({ account: c.admin.account });
    const t = await c.nowTs();
    await expectRevert(
      c.registry.write.registerInvoice([hashOf("p"), FACE, t - DAY, t + DAY, hashOf("pd")], { account: c.supplier.account }),
      "EnforcedPause",
    );
    await c.registry.write.unpause({ account: c.admin.account });
    await c.register(c.supplier, "after-unpause");
  });
});

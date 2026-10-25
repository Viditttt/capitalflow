import assert from "node:assert/strict";
import { keccak256, toHex, toFunctionSelector, parseEventLogs } from "viem";
import type { network } from "hardhat";

export type Conn = Awaited<ReturnType<typeof network.create>>;

export const UNIT = 10n ** 6n; // token decimals = 6
export const inr = (n: number | bigint) => BigInt(n) * UNIT;
export const DAY = 86_400n;
export const hashOf = (s: string) => keccak256(toHex(s));

// Enum mirrors (must match the Solidity enums)
export const InvoiceStatus = { None: 0, Submitted: 1, Verified: 2, Rejected: 3, Flagged: 4, Financed: 5, Settled: 6, Disputed: 7 } as const;
export const OfferStatus = { None: 0, Open: 1, Accepted: 2, Cancelled: 3, Expired: 4, Voided: 5 } as const;
export const FinancingStatus = { None: 0, Active: 1, Settled: 2 } as const;

// Headline demo economics (token units mirror INR in the business-model assumptions)
export const FACE = inr(1_000_000); // Rs 10,00,000
export const PRINCIPAL = inr(800_000); // 80% advance
export const FEE = inr(40_000); // financing fee
export const TOTAL_DUE = PRINCIPAL + FEE; // 8,40,000
export const SERVICE_FEE = (PRINCIPAL * 50n) / 10_000n; // 0.50% of principal = 4,000
export const SUPPLIER_ADVANCE = PRINCIPAL - SERVICE_FEE; // 7,96,000
export const SUPPLIER_RESIDUAL = FACE - TOTAL_DUE; // 1,60,000

function collectText(e: unknown, seen = new Set<unknown>()): string {
  if (!e || typeof e !== "object" || seen.has(e)) return String(e ?? "");
  seen.add(e);
  const o = e as Record<string, unknown>;
  const parts: string[] = [];
  for (const k of ["name", "message", "shortMessage", "details", "data", "reason", "errorName"]) {
    if (typeof o[k] === "string") parts.push(o[k] as string);
  }
  if (Array.isArray(o.metaMessages)) parts.push(o.metaMessages.join(" "));
  if (o.cause) parts.push(collectText(o.cause, seen));
  if (o.error) parts.push(collectText(o.error, seen));
  return parts.join(" | ");
}

/**
 * Assert that a promise rejects with the given custom error. Pass a bare name ("NotOfferFinancier")
 * for errors in the called contract's ABI, or a full signature ("ERC20InsufficientBalance(address,uint256,uint256)")
 * for errors raised by another contract (matched by 4-byte selector).
 */
export async function expectRevert(p: Promise<unknown>, expected: string) {
  let text: string;
  try {
    await p;
  } catch (e) {
    text = collectText(e);
    const selector = expected.includes("(") ? toFunctionSelector(expected).slice(2) : "";
    const ok = text.includes(expected.split("(")[0]) || (selector && text.includes(selector));
    assert.ok(ok, `Expected revert "${expected}" but got: ${text.slice(0, 600)}`);
    return;
  }
  assert.fail(`Expected revert "${expected}" but the call succeeded`);
}

export async function deployAll(conn: Conn) {
  const { viem, networkHelpers } = conn;
  const [admin, verifier, supplier, supplier2, financier, financier2, payer, treasury, stranger] =
    await viem.getWalletClients();

  const token = await viem.deployContract("MockINRToken", [admin.account.address]);
  const registry = await viem.deployContract("InvoiceRegistry", [admin.account.address]);
  const market = await viem.deployContract("FinancingMarketplace", [
    token.address,
    registry.address,
    treasury.account.address,
    admin.account.address,
  ]);

  const VERIFIER_ROLE = await registry.read.VERIFIER_ROLE();
  const MARKETPLACE_ROLE = await registry.read.MARKETPLACE_ROLE();
  const FINANCIER_ROLE = await market.read.FINANCIER_ROLE();
  const DEMO_PAYER_ROLE = await market.read.DEMO_PAYER_ROLE();

  await registry.write.grantRole([VERIFIER_ROLE, verifier.account.address]);
  await registry.write.grantRole([MARKETPLACE_ROLE, market.address]);
  await market.write.grantRole([FINANCIER_ROLE, financier.account.address]);
  await market.write.grantRole([FINANCIER_ROLE, financier2.account.address]);
  await market.write.grantRole([DEMO_PAYER_ROLE, payer.account.address]);

  await token.write.mint([financier.account.address, inr(5_000_000)]);
  await token.write.mint([financier2.account.address, inr(5_000_000)]);
  await token.write.mint([payer.account.address, inr(5_000_000)]);

  const nowTs = async () => BigInt(await networkHelpers.time.latest());

  /** Register an invoice as `from`; returns its id. */
  async function register(from = supplier, key = "INV-001", face = FACE) {
    const t = await nowTs();
    await registry.write.registerInvoice(
      [hashOf(key), face, t - 10n * DAY, t + 60n * DAY, hashOf("doc:" + key)],
      { account: from.account },
    );
    return registry.read.invoiceCount();
  }

  async function registerVerified(from = supplier, key = "INV-001", face = FACE) {
    const id = await register(from, key, face);
    await registry.write.verifyInvoice([id], { account: verifier.account });
    return id;
  }

  /** Approve + submit an offer as `from`; returns its id. */
  async function offer(invoiceId: bigint, from = financier, principal = PRINCIPAL, fee = FEE, validity = 7n * DAY) {
    await token.write.approve([market.address, principal], { account: from.account });
    await market.write.submitOffer([invoiceId, principal, fee, validity], { account: from.account });
    return market.read.offerCount();
  }

  /** Full path to an active financing; returns ids. */
  async function financed(key = "INV-001") {
    const invoiceId = await registerVerified(supplier, key);
    const offerId = await offer(invoiceId);
    await market.write.acceptOffer([offerId], { account: supplier.account });
    return { invoiceId, offerId };
  }

  async function repayFull(offerId: bigint, invoiceId: bigint) {
    const inv = await registry.read.getInvoice([invoiceId]);
    await token.write.approve([market.address, inv.faceValue], { account: payer.account });
    return market.write.repay([offerId, inv.faceValue], { account: payer.account });
  }

  const bal = (a: { account: { address: `0x${string}` } } | `0x${string}`) =>
    token.read.balanceOf([typeof a === "string" ? a : a.account.address]);

  async function eventsOf(hash: `0x${string}`, contract: { abi: any }, eventName: string) {
    const pc = await viem.getPublicClient();
    const receipt = await pc.waitForTransactionReceipt({ hash });
    return parseEventLogs({ abi: contract.abi, logs: receipt.logs, eventName } as any) as any[];
  }

  return {
    viem, networkHelpers, nowTs,
    admin, verifier, supplier, supplier2, financier, financier2, payer, treasury, stranger,
    token, registry, market,
    VERIFIER_ROLE, MARKETPLACE_ROLE, FINANCIER_ROLE, DEMO_PAYER_ROLE,
    register, registerVerified, offer, financed, repayFull, bal, eventsOf,
  };
}

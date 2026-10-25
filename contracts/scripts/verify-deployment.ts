/**
 * Reads the on-chain state of a deployment and checks it against deployments/<chainId>.json.
 *   npx hardhat run scripts/verify-deployment.ts --network localhost
 * Exits non-zero if any check fails. Reuse unchanged on a testnet.
 */
import { network } from "hardhat";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { viem } = await network.create();
const pc = await viem.getPublicClient();
const chainId = await pc.getChainId();
const rec = JSON.parse(readFileSync(resolve(here, "..", "deployments", `${chainId}.json`), "utf8"));
const c = rec.contracts;

const token = await viem.getContractAt("MockINRToken", c.MockINRToken);
const registry = await viem.getContractAt("InvoiceRegistry", c.InvoiceRegistry);
const market = await viem.getContractAt("FinancingMarketplace", c.FinancingMarketplace);

const checks: [string, boolean][] = [];
const add = (label: string, ok: boolean) => checks.push([label, ok]);

const ADMIN = await registry.read.DEFAULT_ADMIN_ROLE();
add("registry code deployed", (await pc.getCode({ address: c.InvoiceRegistry })) !== undefined);
add("marketplace.token == MockINRToken", (await market.read.token()).toLowerCase() === c.MockINRToken.toLowerCase());
add("marketplace.registry == InvoiceRegistry", (await market.read.registry()).toLowerCase() === c.InvoiceRegistry.toLowerCase());
add("marketplace has MARKETPLACE_ROLE on registry", await registry.read.hasRole([await registry.read.MARKETPLACE_ROLE(), c.FinancingMarketplace]));
add("admin holds admin on registry", await registry.read.hasRole([ADMIN, rec.roles.admin]));
add("admin holds admin on marketplace", await market.read.hasRole([ADMIN, rec.roles.admin]));
add("token owner == admin", (await token.read.owner()).toLowerCase() === rec.roles.admin.toLowerCase());
add("verifier holds VERIFIER_ROLE", await registry.read.hasRole([await registry.read.VERIFIER_ROLE(), rec.roles.verifier]));
add("demo payer holds DEMO_PAYER_ROLE", await market.read.hasRole([await market.read.DEMO_PAYER_ROLE(), rec.roles.demoPayer]));
for (const f of rec.roles.financiers) add(`financier ${f.slice(0, 8)}… holds FINANCIER_ROLE`, await market.read.hasRole([await market.read.FINANCIER_ROLE(), f]));
add("treasury matches", (await market.read.treasury()).toLowerCase() === rec.roles.treasury.toLowerCase());
add("verifier does NOT hold admin", !(await registry.read.hasRole([ADMIN, rec.roles.verifier])));
add("marketplace is not paused", !(await market.read.paused()));
add("max advance 9000 bps, service fee 50 bps", (await market.read.maxAdvanceBps()) === 9000n && (await market.read.serviceFeeBps()) === 50n);

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed on chain ${chainId}`);
if (failed) process.exitCode = 1;

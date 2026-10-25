/**
 * Deploys MockINRToken, InvoiceRegistry and FinancingMarketplace, wires up roles, optionally seeds
 * demo test tokens, and exports addresses + ABIs for the frontend/indexer.
 *
 *   Local:    npx hardhat node                                  (terminal 1)
 *             npx hardhat run scripts/deploy.ts --network localhost   (terminal 2)
 *
 * On non-local chains, role addresses MUST come from environment variables (no defaults), and the
 * deployer account must come from Hardhat's keystore / configured accounts, never from a committed file.
 *
 * Env (all optional locally; required elsewhere):
 *   ADMIN_ADDRESS           contract admin (defaults to deployer on local only)
 *   VERIFIER_ADDRESS        invoice verifier
 *   FINANCIER_ADDRESSES     comma-separated financier wallets
 *   DEMO_PAYER_ADDRESS      simulated buyer-payment wallet
 *   TREASURY_ADDRESS        receives platform service fees
 *   EXPORT_DEPLOYMENT=1     write addresses/ABIs even on the in-process network
 */
import hre, { network } from "hardhat";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAddress, isAddress, type Address } from "viem";

const here = dirname(fileURLToPath(import.meta.url));
const LOCAL_CHAIN_ID = 31337;
const SEED_AMOUNT = 5_000_000n * 10n ** 6n; // 50,00,000 test tokens

function addr(name: string): Address | undefined {
  const v = process.env[name]?.trim();
  if (!v) return undefined;
  if (!isAddress(v)) throw new Error(`${name} is not a valid address: ${v}`);
  return getAddress(v);
}

function need(name: string, local: Address | undefined, isLocal: boolean): Address {
  const fromEnv = addr(name);
  if (fromEnv) return fromEnv;
  if (isLocal && local) return local;
  throw new Error(`Missing ${name}. Set it in your environment (no defaults outside the local chain).`);
}

const conn = await network.create();
const { viem } = conn;
const publicClient = await viem.getPublicClient();
const chainId = await publicClient.getChainId();
const isLocal = chainId === LOCAL_CHAIN_ID;
const wallets = await viem.getWalletClients();
const deployer = wallets[0];
if (!deployer) throw new Error("No deployer account available for this network.");

const wait = async (p: Promise<`0x${string}`>) => publicClient.waitForTransactionReceipt({ hash: await p });

// Local convenience accounts: [0] deployer/admin, [1] verifier, [2..3] suppliers, [4..5] financiers, [6] demo payer, [7] treasury
const local = (i: number) => wallets[i]?.account.address;
const admin = need("ADMIN_ADDRESS", deployer.account.address, isLocal);
const verifier = need("VERIFIER_ADDRESS", local(1), isLocal);
const demoPayer = need("DEMO_PAYER_ADDRESS", local(6), isLocal);
const treasury = need("TREASURY_ADDRESS", local(7), isLocal);
const financiers: Address[] = process.env.FINANCIER_ADDRESSES
  ? process.env.FINANCIER_ADDRESSES.split(",").map((s) => {
      const t = s.trim();
      if (!isAddress(t)) throw new Error(`FINANCIER_ADDRESSES contains an invalid address: ${t}`);
      return getAddress(t);
    })
  : isLocal
    ? ([local(4), local(5)].filter(Boolean) as Address[])
    : (() => {
        throw new Error("Missing FINANCIER_ADDRESSES (comma-separated).");
      })();

console.log(`Network: ${conn.networkName} (chainId ${chainId}) | deployer ${deployer.account.address}`);
const startBlock = await publicClient.getBlockNumber();

// The deployer is the initial admin of every contract so it can wire roles, then hands over if ADMIN differs.
const token = await viem.deployContract("MockINRToken", [deployer.account.address]);
const registry = await viem.deployContract("InvoiceRegistry", [deployer.account.address]);
const market = await viem.deployContract("FinancingMarketplace", [token.address, registry.address, treasury, deployer.account.address]);
console.log(`MockINRToken         ${token.address}`);
console.log(`InvoiceRegistry      ${registry.address}`);
console.log(`FinancingMarketplace ${market.address}`);

await wait(registry.write.grantRole([await registry.read.MARKETPLACE_ROLE(), market.address]));
await wait(registry.write.grantRole([await registry.read.VERIFIER_ROLE(), verifier]));
for (const f of financiers) await wait(market.write.grantRole([await market.read.FINANCIER_ROLE(), f]));
await wait(market.write.grantRole([await market.read.DEMO_PAYER_ROLE(), demoPayer]));

// Demo tokens: worthless test tokens for financiers and the simulated payer (anyone can also use the faucet)
for (const a of [...financiers, demoPayer]) await wait(token.write.mint([a, SEED_AMOUNT]));

// Hand administration to ADMIN_ADDRESS if it is not the deployer, then drop the deployer's admin rights.
if (admin.toLowerCase() !== deployer.account.address.toLowerCase()) {
  const ADMIN = await registry.read.DEFAULT_ADMIN_ROLE();
  await wait(registry.write.grantRole([ADMIN, admin]));
  await wait(market.write.grantRole([ADMIN, admin]));
  await wait(token.write.transferOwnership([admin]));
  await wait(registry.write.renounceRole([ADMIN, deployer.account.address]));
  await wait(market.write.renounceRole([ADMIN, deployer.account.address]));
  console.log(`Administration transferred to ${admin}`);
}

// ---------------------------------------------------------------- export
const shouldExport = conn.networkConfig.type !== "edr-simulated" || process.env.EXPORT_DEPLOYMENT === "1";
const record = {
  chainId,
  network: conn.networkName,
  startBlock: Number(startBlock),
  deployedAt: new Date().toISOString(),
  contracts: {
    MockINRToken: getAddress(token.address),
    InvoiceRegistry: getAddress(registry.address),
    FinancingMarketplace: getAddress(market.address),
  },
  roles: { admin, verifier, demoPayer, treasury, financiers },
};

if (!shouldExport) {
  console.log("\nIn-process network: nothing exported (addresses vanish when this script ends).");
  console.log("Use `npx hardhat node` + `--network localhost`, or set EXPORT_DEPLOYMENT=1 to force.");
} else {
  const root = resolve(here, "..");
  mkdirSync(resolve(root, "deployments"), { recursive: true });
  writeFileSync(resolve(root, "deployments", `${chainId}.json`), JSON.stringify(record, null, 2) + "\n");

  const outDir = resolve(root, "..", "frontend", "lib", "contracts");
  mkdirSync(resolve(outDir, "abis"), { recursive: true });
  for (const name of ["MockINRToken", "InvoiceRegistry", "FinancingMarketplace"]) {
    const art = await hre.artifacts.readArtifact(name);
    writeFileSync(resolve(outDir, "abis", `${name}.json`), JSON.stringify(art.abi, null, 2) + "\n");
  }
  const addrFile = resolve(outDir, "addresses.json");
  const all = existsSync(addrFile) ? JSON.parse(readFileSync(addrFile, "utf8")) : {};
  all[String(chainId)] = { ...record.contracts, startBlock: record.startBlock };
  writeFileSync(addrFile, JSON.stringify(all, null, 2) + "\n");
  console.log(`\nExported deployments/${chainId}.json and frontend/lib/contracts/{addresses.json,abis/*}`);
}

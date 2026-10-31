import type { Address } from 'viem'

import _addresses from './contracts/addresses.json'
import MockINRTokenABI from './contracts/abis/MockINRToken.json'
import InvoiceRegistryABI from './contracts/abis/InvoiceRegistry.json'
import FinancingMarketplaceABI from './contracts/abis/FinancingMarketplace.json'

// ─── Chain Configuration ───
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111')

// ─── Contract Addresses ───
const addresses = (_addresses as unknown as Record<string, Record<string, any>>)[String(CHAIN_ID)]

if (!addresses) {
  console.warn(
    `No contract addresses found for chain ${CHAIN_ID}. ` +
    `Run \`npm run contracts:deploy:local\` to deploy contracts and export addresses.`
  )
}

export const CONTRACT_ADDRESSES = {
  MockINRToken: (addresses?.MockINRToken ?? '0x0') as Address,
  InvoiceRegistry: (addresses?.InvoiceRegistry ?? '0x0') as Address,
  FinancingMarketplace: (addresses?.FinancingMarketplace ?? '0x0') as Address,
}

// ─── Contract ABIs (as const for wagmi type inference) ───
export const ABIS = {
  MockINRToken: MockINRTokenABI as typeof MockINRTokenABI,
  InvoiceRegistry: InvoiceRegistryABI as typeof InvoiceRegistryABI,
  FinancingMarketplace: FinancingMarketplaceABI as typeof FinancingMarketplaceABI,
}

// ─── Contract Configs (shorthand for wagmi hooks) ───
export const tokenContract = {
  address: CONTRACT_ADDRESSES.MockINRToken,
  abi: ABIS.MockINRToken,
} as const

export const registryContract = {
  address: CONTRACT_ADDRESSES.InvoiceRegistry,
  abi: ABIS.InvoiceRegistry,
} as const

export const marketplaceContract = {
  address: CONTRACT_ADDRESSES.FinancingMarketplace,
  abi: ABIS.FinancingMarketplace,
} as const

// ─── Financial Constants (matching contract/test values) ───
export const TOKEN_DECIMALS = 6
export const TOKEN_UNIT = 10n ** BigInt(TOKEN_DECIMALS)   // 1_000_000n
export const BPS = 10_000n

/** Demo economics from the project brief */
export const DEMO_ECONOMICS = {
  faceValue: 1_000_000n * TOKEN_UNIT,        // Rs 10,00,000
  advanceRate: 8000n,                          // 80% in bps
  principal: 800_000n * TOKEN_UNIT,            // Rs 8,00,000
  fee: 40_000n * TOKEN_UNIT,                  // Rs 40,000
  totalDue: 840_000n * TOKEN_UNIT,             // Rs 8,40,000
  serviceFeeBps: 50n,                          // 0.50%
  serviceFee: 4_000n * TOKEN_UNIT,             // Rs 4,000
  supplierAdvance: 796_000n * TOKEN_UNIT,      // Rs 7,96,000
  supplierResidual: 160_000n * TOKEN_UNIT,     // Rs 1,60,000
  financingDurationDays: 60,
}

// ─── Role Constants (must match Solidity) ───
export const ROLES = {
  DEFAULT_ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  VERIFIER: null as `0x${string}` | null,  // computed at runtime from contract
  FINANCIER: null as `0x${string}` | null,
  DEMO_PAYER: null as `0x${string}` | null,
  MARKETPLACE: null as `0x${string}` | null,
}

// ─── Hardhat default accounts (for demo convenience only) ───
export const HARDHAT_ACCOUNTS = {
  admin:      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as Address,
  verifier:   '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as Address,
  supplier1:  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' as Address,
  supplier2:  '0x90f79bf6eb2c4f870365e785982e1f101e93b906' as Address,
  financier1: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65' as Address,
  financier2: '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc' as Address,
  demoPayer:  '0x976ea74026e726554db657fa54763abd0c3a0aa9' as Address,
  treasury:   '0x14dc79964da2c08b23698b3d3cc7ca32193d9955' as Address,
}

// ─── App Constants ───
export const APP_NAME = 'CapitalFlow'
export const APP_DESCRIPTION = 'Blockchain-Enabled SME Invoice Financing Platform'
export const DEMO_DISCLAIMER = 'Educational prototype using simulated financing and worthless test tokens. Not a licensed lending marketplace or regulated financial institution.'

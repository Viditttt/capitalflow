import { http, createConfig } from 'wagmi'
import { sepolia, hardhat } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

/**
 * Wagmi configuration for CapitalFlow.
 * Supports Ethereum Sepolia testnet (11155111) and local Hardhat (31337).
 */
const alchemyRpc = 'https://eth-sepolia.g.alchemy.com/v2/alch_rYyIEkPm8UUFkZsXEm1bF'
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || alchemyRpc

export const config = createConfig({
  chains: [sepolia, hardhat],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

import { http, createConfig } from 'wagmi'
import { hardhat } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

/**
 * Wagmi configuration for CapitalFlow.
 *
 * Connects to a local Hardhat node by default (chainId 31337).
 * MetaMask is the only supported connector.
 *
 * To use a testnet, add the chain config here and set NEXT_PUBLIC_RPC_URL.
 */
export const config = createConfig({
  chains: [hardhat],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [hardhat.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'
    ),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

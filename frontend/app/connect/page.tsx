'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain, useReadContract } from 'wagmi'
import { Wallet, Check, Copy, ExternalLink, RefreshCw, AlertTriangle, Shield, Building2, Store } from 'lucide-react'
import { HARDHAT_ACCOUNTS, CHAIN_ID, tokenContract } from '@/lib/constants'
import { truncateAddress, formatINR } from '@/lib/utils'
import { FaucetButton } from '@/components/web3/wallet-button'

// Hardhat default private keys for demo purposes
const DEMO_CREDENTIALS = [
  {
    role: 'Admin & Deployer',
    description: 'Deploys contracts, assigns roles, and configures protocol parameters.',
    address: HARDHAT_ACCOUNTS.admin,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    icon: <Shield size={16} className="text-status-info" />,
  },
  {
    role: 'Authorised Verifier',
    description: 'Validates purchase orders, e-way bills, and approves/flags invoices.',
    address: HARDHAT_ACCOUNTS.verifier,
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    icon: <Shield size={16} className="text-status-success" />,
  },
  {
    role: 'Supplier #1 (Apex Precision)',
    description: 'Auto-components manufacturer. Registers invoices and accepts advance financing.',
    address: HARDHAT_ACCOUNTS.supplier1,
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    icon: <Store size={16} className="text-accent-primary" />,
  },
  {
    role: 'Supplier #2 (Bharat Fab)',
    description: 'Infrastructure foundry supplier. Secondary demo SME supplier.',
    address: HARDHAT_ACCOUNTS.supplier2,
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    icon: <Store size={16} className="text-accent-primary" />,
  },
  {
    role: 'Financier #1 (Falcon Capital)',
    description: 'Trade credit NBFC. Submits competitive financing offers with locked escrow.',
    address: HARDHAT_ACCOUNTS.financier1,
    privateKey: '0x47e179ec34be3a04a6f699ee105da67ba322d86a87c31ac92147301037b29ec6',
    icon: <Building2 size={16} className="text-accent-secondary" />,
  },
  {
    role: 'Financier #2 (Kuber FinTech)',
    description: 'Liquid debt fund providing competitive bidding rates.',
    address: HARDHAT_ACCOUNTS.financier2,
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    icon: <Building2 size={16} className="text-accent-secondary" />,
  },
  {
    role: 'Demo Corporate Payer',
    description: 'Simulates Tata Motors / Reliance paying settled amounts on invoice maturity.',
    address: HARDHAT_ACCOUNTS.demoPayer,
    privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
    icon: <Building2 size={16} className="text-text-muted" />,
  },
]

export default function ConnectPage() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const isCorrectChain = chain?.id === CHAIN_ID

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 1800)
  }

  // Token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    ...tokenContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary">Connect Wallet & Select Persona</h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure MetaMask for the Hardhat local node (Chain ID: 31337) and import any demo role.
        </p>
      </div>

      {/* Network & Connection Status Card */}
      <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Connection Status
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-status-success' : 'bg-status-error'
                }`}
              />
              <span className="text-lg font-bold text-text-primary">
                {isConnected ? 'MetaMask Connected' : 'Wallet Not Connected'}
              </span>
            </div>
            {address && (
              <span className="text-xs font-mono text-text-secondary">
                {address}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 rounded-lg border border-border-default hover:bg-bg-hover text-status-error text-xs font-medium transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => {
                  const metaMask = connectors.find(
                    (c) => c.id === 'injected' || c.name.includes('MetaMask')
                  )
                  if (metaMask) connect({ connector: metaMask })
                }}
                className="px-5 py-2.5 rounded-lg bg-accent-primary text-white text-sm font-semibold hover:bg-accent-primary-hover shadow-glow-green transition-all"
              >
                Connect MetaMask
              </button>
            )}
          </div>
        </div>

        {/* Network Warning or Status */}
        {isConnected && !isCorrectChain && (
          <div className="rounded-xl border border-status-warning/40 bg-status-warning-bg/40 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-status-warning shrink-0" />
              <div className="text-xs text-text-secondary">
                Connected to <strong className="text-text-primary">{chain?.name || 'Ethereum Mainnet'}</strong>. Please switch to Hardhat Local (31337).
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  if (switchChain) {
                    await switchChain({ chainId: 31337 })
                  }
                } catch (e: any) {
                  // Fallback: prompt MetaMask to add Hardhat local network
                  if (typeof window !== 'undefined' && (window as any).ethereum) {
                    try {
                      await (window as any).ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                          {
                            chainId: '0x7a69', // 31337 in hex
                            chainName: 'Hardhat Local',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['http://127.0.0.1:8545'],
                          },
                        ],
                      })
                    } catch (addError) {
                      console.error('Failed to add network:', addError)
                    }
                  }
                }
              }}
              className="px-4 py-2 rounded-lg bg-status-warning text-black text-xs font-bold hover:opacity-90 shadow-md transition-all shrink-0"
            >
              Switch to Hardhat Local
            </button>
          </div>
        )}

        {/* Faucet Box */}
        {isConnected && (
          <div className="pt-4 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-text-muted">Test mINR Balance</div>
              <div className="text-xl font-bold text-accent-primary mt-0.5">
                {tokenBalance !== undefined ? formatINR(tokenBalance as bigint) : '0 mINR'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaucetButton onSuccess={() => refetchBalance()} />
            </div>
          </div>
        )}
      </div>

      {/* Demo Credentials Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Pre-Funded Demo Personas</h2>
          <p className="text-xs text-text-secondary mt-1">
            Import any private key below into MetaMask (Account Menu → Add account or hardware wallet → Import account) to simulate that role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_CREDENTIALS.map((account, index) => {
            const isCurrent = address?.toLowerCase() === account.address.toLowerCase()

            return (
              <div
                key={index}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  isCurrent
                    ? 'border-accent-primary bg-accent-primary-muted/20 shadow-glow-green'
                    : 'border-border-default bg-bg-surface hover:border-border-bright'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {account.icon}
                    <span className="font-semibold text-sm text-text-primary">
                      {account.role}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary text-white">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  {account.description}
                </p>

                <div className="mt-4 pt-3 border-t border-border-default/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Public Address:</span>
                    <button
                      onClick={() => copyToClipboard(account.address, `addr-${index}`)}
                      className="font-mono text-text-secondary hover:text-text-primary flex items-center gap-1"
                    >
                      {truncateAddress(account.address, 6, 4)}
                      {copiedKey === `addr-${index}` ? (
                        <Check size={10} className="text-status-success" />
                      ) : (
                        <Copy size={10} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Private Key:</span>
                    <button
                      onClick={() => copyToClipboard(account.privateKey, `pk-${index}`)}
                      className="font-mono text-accent-secondary hover:text-accent-secondary-hover flex items-center gap-1 font-medium"
                    >
                      Copy Private Key
                      {copiedKey === `pk-${index}` ? (
                        <Check size={10} className="text-status-success" />
                      ) : (
                        <Copy size={10} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Network Config Manual Specs */}
      <div className="rounded-xl border border-border-default bg-bg-surface p-5 space-y-3">
        <h3 className="text-sm font-bold text-text-primary">MetaMask Network Parameters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-text-muted">Network Name</div>
            <div className="text-text-primary font-semibold mt-0.5">Hardhat Local</div>
          </div>
          <div>
            <div className="text-text-muted">RPC URL</div>
            <div className="text-text-primary font-semibold mt-0.5">http://127.0.0.1:8545</div>
          </div>
          <div>
            <div className="text-text-muted">Chain ID</div>
            <div className="text-text-primary font-semibold mt-0.5">31337</div>
          </div>
          <div>
            <div className="text-text-muted">Currency Symbol</div>
            <div className="text-text-primary font-semibold mt-0.5">ETH</div>
          </div>
        </div>
      </div>
    </div>
  )
}

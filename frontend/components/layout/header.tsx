'use client'

import { useAccount, useBalance, useReadContract, useDisconnect } from 'wagmi'
import { tokenContract, CHAIN_ID } from '@/lib/constants'
import { truncateAddress, formatINR } from '@/lib/utils'
import { Wallet, LogOut, ChevronDown, Droplets, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export function Header() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Read mINR token balance
  const { data: tokenBalance } = useReadContract({
    ...tokenContract,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read ETH balance (for gas)
  const { data: ethBalance } = useBalance({
    address,
  })

  const isWrongNetwork = isConnected && chain?.id !== CHAIN_ID

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-16 border-b border-border-default bg-bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page context */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted">
          {isWrongNetwork ? (
            <span className="flex items-center gap-1.5 text-status-warning">
              <AlertTriangle size={14} />
              Wrong Network — Switch to Hardhat Local
            </span>
          ) : (
            chain ? `${chain.name} (${chain.id})` : 'Not connected'
          )}
        </span>
      </div>

      {/* Right: Wallet info */}
      <div className="flex items-center gap-3">
        {isConnected && tokenBalance !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-default">
            <Droplets size={14} className="text-accent-primary" />
            <span className="text-sm font-medium text-text-primary">
              {formatINR(tokenBalance as bigint)}
            </span>
            <span className="text-xs text-text-muted">mINR</span>
          </div>
        )}

        {isConnected && address ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-default hover:border-border-bright transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary" />
              <span className="text-sm font-medium text-text-primary">
                {truncateAddress(address)}
              </span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 py-2 rounded-xl bg-bg-elevated border border-border-default shadow-elevated animate-fade-in">
                <div className="px-4 py-2 border-b border-border-default">
                  <div className="text-xs text-text-muted">Connected Wallet</div>
                  <div className="text-sm font-mono text-text-secondary mt-0.5">
                    {truncateAddress(address, 10, 8)}
                  </div>
                  {ethBalance && (
                    <div className="text-xs text-text-muted mt-1">
                      {(Number(ethBalance.value) / 1e18).toFixed(4)} ETH
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    disconnect()
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-status-error hover:bg-bg-hover transition-colors"
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/connect"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary-hover transition-colors"
          >
            <Wallet size={16} />
            Connect Wallet
          </Link>
        )}
      </div>
    </header>
  )
}

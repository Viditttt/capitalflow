'use client'

import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { tokenContract, CHAIN_ID } from '@/lib/constants'
import { formatINR, truncateAddress } from '@/lib/utils'
import { Wallet, LogOut, Droplets, Loader2, Check, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

/** Compact wallet connect/disconnect button for use in headers */
export function WalletButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary" />
        <span className="text-sm font-medium">{truncateAddress(address)}</span>
        <button
          onClick={() => disconnect()}
          className="p-1 rounded hover:bg-bg-hover transition-colors text-text-muted hover:text-status-error"
          aria-label="Disconnect wallet"
        >
          <LogOut size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        const metaMask = connectors.find(c => c.id === 'injected' || c.name.includes('MetaMask'))
        if (metaMask) connect({ connector: metaMask })
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary-hover transition-colors"
    >
      <Wallet size={16} />
      Connect
    </button>
  )
}

/** Token faucet button — claims test mINR tokens */
export function FaucetButton({ onSuccess }: { onSuccess?: () => void }) {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleClaim = () => {
    writeContract({
      ...tokenContract,
      functionName: 'faucet',
    })
  }

  if (isSuccess) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-status-success-bg text-status-success text-sm font-medium"
      >
        <Check size={16} />
        Tokens Claimed!
      </button>
    )
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isPending || isConfirming || !address}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-secondary text-white text-sm font-medium hover:bg-accent-secondary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending || isConfirming ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {isPending ? 'Confirm in MetaMask…' : 'Confirming…'}
        </>
      ) : (
        <>
          <Droplets size={16} />
          Claim Test Tokens
        </>
      )}
    </button>
  )
}

/** Generic transaction button with pending/confirming/success/error states */
export function TransactionButton({
  label,
  loadingLabel,
  onClick,
  hash,
  isPending,
  disabled,
  variant = 'primary',
  className,
}: {
  label: string
  loadingLabel?: string
  onClick: () => void
  hash?: `0x${string}`
  isPending: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}) {
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash })

  const baseClasses = 'flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-accent-primary text-white hover:bg-accent-primary-hover shadow-glow-green',
    secondary: 'bg-accent-secondary text-white hover:bg-accent-secondary-hover shadow-glow-blue',
    danger: 'bg-status-error text-white hover:opacity-90',
  }

  if (isSuccess) {
    return (
      <button disabled className={`${baseClasses} bg-status-success-bg text-status-success ${className}`}>
        <Check size={16} />
        Transaction Confirmed
      </button>
    )
  }

  if (isError) {
    return (
      <button onClick={onClick} className={`${baseClasses} bg-status-error-bg text-status-error ${className}`}>
        <AlertTriangle size={16} />
        Transaction Failed — Retry
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending || isConfirming}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isPending || isConfirming ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {isPending ? 'Confirm in MetaMask…' : (loadingLabel || 'Confirming…')}
        </>
      ) : (
        label
      )}
    </button>
  )
}

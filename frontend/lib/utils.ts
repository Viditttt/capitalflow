import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with deduplication */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format token amount (6 decimals) to human-readable INR string */
export function formatINR(amount: bigint, showSymbol = true): string {
  const whole = Number(amount / 1_000_000n)
  const prefix = showSymbol ? '₹' : ''

  // Indian number formatting: 10,00,000
  if (whole >= 100000) {
    const lakhs = (whole / 100000).toFixed(whole % 100000 === 0 ? 0 : 2)
    return `${prefix}${lakhs}L`
  }
  if (whole >= 1000) {
    return `${prefix}${whole.toLocaleString('en-IN')}`
  }
  return `${prefix}${whole}`
}

/** Format token amount with full precision */
export function formatTokenAmount(amount: bigint): string {
  const whole = amount / 1_000_000n
  const frac = amount % 1_000_000n
  if (frac === 0n) return whole.toLocaleString('en-IN')
  return `${whole.toLocaleString('en-IN')}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`
}

/** Convert INR number to token base units (6 decimals) */
export function inrToTokens(inr: number): bigint {
  return BigInt(Math.round(inr * 1_000_000))
}

/** Truncate address for display */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end + 2) return address
  return `${address.slice(0, start)}…${address.slice(-end)}`
}

/** Truncate hash for display */
export function truncateHash(hash: string, length = 10): string {
  if (hash.length <= length + 2) return hash
  return `${hash.slice(0, length)}…`
}

/** Format date from unix timestamp (seconds) */
export function formatDate(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
  return new Date(ts * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format date with time */
export function formatDateTime(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
  return new Date(ts * 1000).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Calculate days remaining until a timestamp */
export function daysRemaining(dueDateTimestamp: bigint | number): number {
  const ts = typeof dueDateTimestamp === 'bigint' ? Number(dueDateTimestamp) : dueDateTimestamp
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, Math.ceil((ts - now) / 86400))
}

/** Calculate days elapsed since a timestamp */
export function daysElapsed(timestamp: bigint | number): number {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, Math.floor((now - ts) / 86400))
}

/** Generate keccak256 hash of a string (browser-compatible using crypto API) */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Calculate implied annualised cost in basis points */
export function impliedAnnualisedBps(principal: bigint, fee: bigint, durationDays: number): number {
  if (principal === 0n || durationDays === 0) return 0
  return Number((fee * 365n * 10000n) / (principal * BigInt(durationDays)))
}

/** Format basis points as percentage string */
export function bpsToPercent(bps: number | bigint): string {
  const n = typeof bps === 'bigint' ? Number(bps) : bps
  return `${(n / 100).toFixed(2)}%`
}

/** Invoice status labels and colors */
export const invoiceStatusConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Unknown', color: 'text-text-muted', bg: 'bg-bg-hover' },
  1: { label: 'Submitted', color: 'text-status-pending', bg: 'bg-status-pending-bg' },
  2: { label: 'Verified', color: 'text-status-success', bg: 'bg-status-success-bg' },
  3: { label: 'Rejected', color: 'text-status-error', bg: 'bg-status-error-bg' },
  4: { label: 'Flagged', color: 'text-status-warning', bg: 'bg-status-warning-bg' },
  5: { label: 'Financed', color: 'text-accent-secondary', bg: 'bg-accent-secondary-muted' },
  6: { label: 'Settled', color: 'text-accent-primary', bg: 'bg-accent-primary-muted' },
  7: { label: 'Disputed', color: 'text-status-error', bg: 'bg-status-error-bg' },
}

/** Offer status labels and colors */
export const offerStatusConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Unknown', color: 'text-text-muted', bg: 'bg-bg-hover' },
  1: { label: 'Open', color: 'text-status-info', bg: 'bg-status-info-bg' },
  2: { label: 'Accepted', color: 'text-status-success', bg: 'bg-status-success-bg' },
  3: { label: 'Cancelled', color: 'text-text-muted', bg: 'bg-bg-hover' },
  4: { label: 'Expired', color: 'text-status-warning', bg: 'bg-status-warning-bg' },
  5: { label: 'Voided', color: 'text-text-muted', bg: 'bg-bg-hover' },
}

/** Financing status labels */
export const financingStatusConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'None', color: 'text-text-muted', bg: 'bg-bg-hover' },
  1: { label: 'Active', color: 'text-accent-secondary', bg: 'bg-accent-secondary-muted' },
  2: { label: 'Settled', color: 'text-accent-primary', bg: 'bg-accent-primary-muted' },
}

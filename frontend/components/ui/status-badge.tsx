'use client'

import { cn, invoiceStatusConfig, offerStatusConfig, financingStatusConfig } from '@/lib/utils'

interface StatusBadgeProps {
  status: number | string
  type?: 'invoice' | 'offer' | 'financing' | 'custom'
  customLabel?: string
  variant?: 'solid' | 'subtle'
  className?: string
}

export function StatusBadge({
  status,
  type = 'invoice',
  customLabel,
  variant = 'subtle',
  className,
}: StatusBadgeProps) {
  let label = customLabel || String(status)
  let color = 'text-text-muted'
  let bg = 'bg-bg-hover'

  const numStatus = typeof status === 'number' ? status : parseInt(status, 10)

  if (type === 'invoice' && !isNaN(numStatus)) {
    const config = invoiceStatusConfig[numStatus]
    if (config) {
      label = config.label
      color = config.color
      bg = config.bg
    }
  } else if (type === 'offer' && !isNaN(numStatus)) {
    const config = offerStatusConfig[numStatus]
    if (config) {
      label = config.label
      color = config.color
      bg = config.bg
    }
  } else if (type === 'financing' && !isNaN(numStatus)) {
    const config = financingStatusConfig[numStatus]
    if (config) {
      label = config.label
      color = config.color
      bg = config.bg
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-transparent',
        bg,
        color,
        variant === 'solid' && 'bg-opacity-100 text-white',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full bg-current opacity-70')} />
      {label}
    </span>
  )
}

'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { cn, truncateHash, truncateAddress } from '@/lib/utils'

interface HashDisplayProps {
  value: string
  type?: 'hash' | 'address'
  copyable?: boolean
  truncate?: boolean
  className?: string
}

export function HashDisplay({
  value,
  type = 'hash',
  copyable = true,
  truncate = true,
  className,
}: HashDisplayProps) {
  const [copied, setCopied] = useState(false)

  const displayText = truncate
    ? type === 'address'
      ? truncateAddress(value)
      : truncateHash(value)
    : value

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary bg-bg-surface px-2 py-1 rounded border border-border-default select-all',
        className
      )}
    >
      <span>{displayText}</span>
      {copyable && (
        <button
          onClick={handleCopy}
          className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded"
          title="Copy to clipboard"
          type="button"
        >
          {copied ? (
            <Check size={12} className="text-status-success" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      )}
    </div>
  )
}

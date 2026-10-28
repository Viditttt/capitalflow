'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
  badge?: string
  className?: string
  variant?: 'default' | 'accent' | 'emerald'
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  className,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border-default hover:border-border-bright bg-bg-surface',
    accent: 'border-accent-secondary/30 bg-accent-secondary-muted/30 hover:border-accent-secondary',
    emerald: 'border-accent-primary/30 bg-accent-primary-muted/30 hover:border-accent-primary',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 transition-all duration-300 card-hover',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {title}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated text-accent-primary border border-border-default">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-text-primary">
          {value}
        </span>
        {badge && (
          <span className="rounded bg-bg-hover px-1.5 py-0.5 text-xs text-text-secondary">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'font-medium',
                trend.isPositive ? 'text-status-success' : 'text-status-error'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}

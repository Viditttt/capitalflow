'use client'

import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskScoreProps {
  score: number // 1 - 100
  showDetails?: boolean
  className?: string
}

export function RiskScore({ score, showDetails = false, className }: RiskScoreProps) {
  let grade = 'AAA'
  let label = 'Low Risk'
  let textColor = 'text-status-success'
  let barColor = 'bg-status-success'
  let bgMuted = 'bg-status-success-bg'
  let icon = <ShieldCheck size={14} className="text-status-success" />

  if (score >= 85) {
    grade = 'AAA'
    label = 'Prime'
    textColor = 'text-status-success'
    barColor = 'bg-status-success'
    bgMuted = 'bg-status-success-bg'
  } else if (score >= 75) {
    grade = 'AA'
    label = 'Low Risk'
    textColor = 'text-status-success'
    barColor = 'bg-status-success'
    bgMuted = 'bg-status-success-bg'
  } else if (score >= 60) {
    grade = 'A'
    label = 'Moderate'
    textColor = 'text-status-warning'
    barColor = 'bg-status-warning'
    bgMuted = 'bg-status-warning-bg'
    icon = <AlertTriangle size={14} className="text-status-warning" />
  } else {
    grade = 'BBB'
    label = 'Elevated'
    textColor = 'text-status-error'
    barColor = 'bg-status-error'
    bgMuted = 'bg-status-error-bg'
    icon = <AlertCircle size={14} className="text-status-error" />
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold text-text-primary">
            Risk Score: {score}/100
          </span>
          <span className={cn('text-xs font-bold px-1.5 py-0.2 rounded', bgMuted, textColor)}>
            {grade}
          </span>
        </div>
        <span className={cn('text-xs font-medium', textColor)}>{label}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-bg-hover overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-default/50 text-[11px] text-text-muted">
          <div>Buyer Concentration: <span className="text-text-primary font-medium">Low (14%)</span></div>
          <div>Tenor Remaining: <span className="text-text-primary font-medium">Optimal</span></div>
          <div>Verification Source: <span className="text-text-primary font-medium">GSTN E-Way</span></div>
          <div>Dispute History: <span className="text-text-primary font-medium">0 Defaults</span></div>
        </div>
      )}
    </div>
  )
}

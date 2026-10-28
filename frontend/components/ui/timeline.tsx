'use client'

import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineStep {
  title: string
  description?: string
  date?: string
  status: 'completed' | 'current' | 'upcoming' | 'failed'
}

interface TimelineProps {
  steps: TimelineStep[]
  className?: string
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn('relative space-y-6 pl-6', className)}>
      {/* Vertical line connecting steps */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />

      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'
        const isFailed = step.status === 'failed'

        return (
          <div key={index} className="relative flex items-start gap-4">
            {/* Step indicator node */}
            <div
              className={cn(
                'absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border bg-bg-surface z-10 transition-colors',
                isCompleted && 'border-status-success bg-status-success text-white',
                isCurrent && 'border-accent-primary bg-bg-elevated text-accent-primary animate-pulse',
                isFailed && 'border-status-error bg-status-error text-white',
                !isCompleted && !isCurrent && !isFailed && 'border-border-default text-text-muted'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 size={14} />
              ) : isCurrent ? (
                <Clock size={14} />
              ) : isFailed ? (
                <AlertTriangle size={14} />
              ) : (
                <Circle size={10} />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isCurrent ? 'text-accent-primary' : 'text-text-primary'
                  )}
                >
                  {step.title}
                </span>
                {step.date && (
                  <span className="text-xs text-text-muted">{step.date}</span>
                )}
              </div>
              {step.description && (
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

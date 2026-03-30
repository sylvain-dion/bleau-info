'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ShieldCheck, AlertTriangle, X } from 'lucide-react'
import type { GradeReliability } from '@/lib/grades/soft-grade'

interface GradeReliabilityPopoverProps {
  reliability: GradeReliability
  voteCount: number
  stdDev: number
}

const CONFIG: Record<
  'verified' | 'disputed',
  {
    icon: typeof ShieldCheck
    label: string
    badgeClass: string
    iconClass: string
  }
> = {
  verified: {
    icon: ShieldCheck,
    label: 'Cotation vérifiée',
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  disputed: {
    icon: AlertTriangle,
    label: 'Cotation disputée',
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
}

/**
 * Clickable reliability badge with popover explanation (Story 12.5).
 *
 * Verified: 10+ votes with tight consensus (stdDev < 0.5).
 * Disputed: votes are spread out (stdDev > 1.0).
 */
export function GradeReliabilityPopover({
  reliability,
  voteCount,
  stdDev,
}: GradeReliabilityPopoverProps) {
  const [open, setOpen] = useState(false)

  if (!reliability) return null

  const config = CONFIG[reliability]
  const Icon = config.icon

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80 ${config.badgeClass}`}
          aria-label={config.label}
        >
          <Icon className="h-2.5 w-2.5" aria-hidden="true" />
          {config.label}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-72 rounded-lg border border-border bg-popover p-4 shadow-lg"
          sideOffset={8}
          align="start"
        >
          <div className="flex items-start gap-2">
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconClass}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-popover-foreground">
                {config.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {reliability === 'verified'
                  ? `Cette cotation est fiable : ${voteCount} votes avec un consensus serré (écart-type : ${stdDev.toFixed(2)} grade).`
                  : `Les avis divergent sur ce bloc (écart-type : ${stdDev.toFixed(2)} sur ${voteCount} votes). Consultez l'histogramme pour vous faire votre opinion.`}
              </p>
            </div>
            <Popover.Close asChild>
              <button
                type="button"
                className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-3 w-3" />
              </button>
            </Popover.Close>
          </div>
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

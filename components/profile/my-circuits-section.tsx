'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Route, CheckCircle2, Trophy } from 'lucide-react'
import { getAllCircuits } from '@/lib/data/mock-circuits'
import { useTickStore } from '@/stores/tick-store'
import { useCircuitCompletionStore } from '@/stores/circuit-completion-store'
import { getStartedCircuits } from '@/lib/circuits/circuit-progress'
import { toSlug } from '@/lib/data/boulder-service'
import type { CircuitColor } from '@/lib/data/mock-boulders'

const CIRCUIT_LABELS: Record<CircuitColor, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}

/**
 * Profile section showing the user's circuit progression.
 *
 * Lists started circuits sorted by completion %, with completion
 * date for fully completed ones.
 */
export function MyCircuitsSection() {
  const ticks = useTickStore((s) => s.ticks)
  const completions = useCircuitCompletionStore((s) => s.completions)

  const circuits = useMemo(() => {
    const completedIds = new Set(ticks.map((t) => t.boulderId))
    return getStartedCircuits(getAllCircuits(), completedIds)
  }, [ticks])

  if (circuits.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2">
          <Route className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Mes circuits</h2>
        </div>
        <p className="text-center text-xs text-muted-foreground py-4">
          Loguez des croix pour suivre votre progression sur les circuits.
        </p>
      </div>
    )
  }

  const completedCount = circuits.filter((c) => c.isComplete).length

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Mes circuits</h2>
        </div>
        {completedCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Trophy className="h-3 w-3" />
            {completedCount} terminé{completedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {circuits.map((circuit) => {
          const sectorSlug = toSlug(circuit.sector)
          const completionDate = completions[circuit.id]?.completedAt

          return (
            <Link
              key={circuit.id}
              href={`/secteurs/${sectorSlug}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              {/* Color dot */}
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{
                  backgroundColor: circuit.hexColor,
                  border: circuit.color === 'blanc' ? '1px solid #d4d4d8' : undefined,
                }}
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Circuit {CIRCUIT_LABELS[circuit.color]}
                  </span>
                  {circuit.isComplete && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {circuit.sector}
                </span>
              </div>

              {/* Progress */}
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold text-foreground">
                  {circuit.percent}%
                </span>
                <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${circuit.percent}%`,
                      backgroundColor: circuit.isComplete ? '#10b981' : circuit.hexColor,
                    }}
                  />
                </div>
                {circuit.isComplete && completionDate && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(completionDate)}
                  </span>
                )}
                {!circuit.isComplete && (
                  <span className="text-[10px] text-muted-foreground">
                    {circuit.completed}/{circuit.total}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

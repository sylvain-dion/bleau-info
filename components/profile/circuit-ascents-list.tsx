'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, CheckCircle2, Trophy } from 'lucide-react'
import { toSlug } from '@/lib/data/boulder-service'
import type { CircuitColor } from '@/lib/data/mock-boulders'
import type { CircuitGroup } from '@/lib/ascents-hub'
import type { Tick } from '@/lib/validations/tick'
import { AscentsList } from '@/components/profile/ascents-list'

interface CircuitAscentsListProps {
  groups: CircuitGroup[]
  /** Ticks not attached to any circuit (rendered in a final accordion). */
  orphans: Tick[]
}

const CIRCUIT_LABELS: Record<CircuitColor, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}

export function CircuitAscentsList({ groups, orphans }: CircuitAscentsListProps) {
  if (groups.length === 0 && orphans.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground"
        data-testid="circuits-empty"
      >
        Vous n&apos;avez pas encore de croix sur un circuit.
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="circuit-groups-list">
      {groups.map((group) => (
        <CircuitAccordion key={group.circuit.id} group={group} />
      ))}

      {orphans.length > 0 && (
        <OrphanAccordion ticks={orphans} />
      )}
    </div>
  )
}

function CircuitAccordion({ group }: { group: CircuitGroup }) {
  const [open, setOpen] = useState(false)
  const sectorSlug = toSlug(group.circuit.sector)

  return (
    <div
      className="rounded-xl border border-border bg-card"
      data-testid={`circuit-group-${group.circuit.id}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 min-touch"
      >
        {/* Color dot */}
        <div
          className="h-4 w-4 shrink-0 rounded-full"
          style={{
            backgroundColor: group.circuit.hexColor,
            border: group.circuit.color === 'blanc' ? '1px solid #d4d4d8' : undefined,
          }}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Circuit {CIRCUIT_LABELS[group.circuit.color]}
            </span>
            {group.progress.isComplete && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">{group.circuit.sector}</span>
        </div>

        {/* Progress chip */}
        <div className="shrink-0 text-right">
          <span className="text-xs font-bold text-foreground">{group.progress.percent}%</span>
          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${group.progress.percent}%`,
                backgroundColor: group.progress.isComplete ? '#10b981' : group.circuit.hexColor,
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {group.progress.completed}/{group.progress.total}
          </span>
        </div>

        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-3">
          {group.progress.isComplete && (
            <Link
              href={`/secteurs/${sectorSlug}`}
              className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              Circuit entièrement enchaîné — voir le secteur
            </Link>
          )}
          <AscentsList ticks={group.ticks} />
        </div>
      )}
    </div>
  )
}

function OrphanAccordion({ ticks }: { ticks: Tick[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl border border-dashed border-border bg-card"
      data-testid="circuit-group-orphans"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 min-touch"
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground">Hors circuit</span>
          <p className="text-xs text-muted-foreground">
            Blocs ticés en dehors d&apos;un circuit nommé
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {ticks.length}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-3">
          <AscentsList ticks={ticks} />
        </div>
      )}
    </div>
  )
}

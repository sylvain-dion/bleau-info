'use client'

import Link from 'next/link'
import { CalendarDays, MountainSnow } from 'lucide-react'
import { formatGrade } from '@/lib/grades'
import { TICK_STYLE_OPTIONS } from '@/lib/validations/tick'
import type { Tick } from '@/lib/validations/tick'

interface AscentsListProps {
  ticks: Tick[]
  /** Empty-state message shown when the list is empty (after filters). */
  emptyMessage?: string
  /** Optional extra class on the root list. */
  className?: string
}

/**
 * Plain ascent list — one row per `Tick`. Used by:
 *  - `/profil` home (recent slice, capped to 5)
 *  - `/profil/mes-ascensions` Tab 1 (full filtered list)
 *  - Each circuit accordion in Tab 2
 *
 * Keeps the row template in a single place so the visual treatment of
 * a "tick" is consistent across the hub.
 */
export function AscentsList({ ticks, emptyMessage, className }: AscentsListProps) {
  if (ticks.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground"
        data-testid="ascents-empty"
      >
        {emptyMessage ?? 'Aucune ascension enregistrée.'}
      </div>
    )
  }

  return (
    <ul
      className={`space-y-2 ${className ?? ''}`}
      data-testid="ascents-list"
    >
      {ticks.map((tick) => (
        <AscentRow key={tick.id} tick={tick} />
      ))}
    </ul>
  )
}

function AscentRow({ tick }: { tick: Tick }) {
  const styleConfig = TICK_STYLE_OPTIONS.find((opt) => opt.key === tick.tickStyle)
  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
      data-testid={`ascent-row-${tick.id}`}
    >
      {/* Grade badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <span className="text-xs font-black text-primary">
          {formatGrade(tick.boulderGrade)}
        </span>
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/blocs/${tick.boulderId}`}
          className="block truncate text-sm font-semibold text-foreground hover:underline"
        >
          {tick.boulderName}
        </Link>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {styleConfig && (
            <span className={`flex items-center gap-1 ${styleConfig.color}`}>
              <span aria-hidden="true">{styleConfig.icon}</span>
              {styleConfig.label}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatTickDate(tick.tickDate)}
          </span>
        </div>
        {tick.personalNote && (
          <p className="mt-1 truncate text-xs text-muted-foreground/80">
            <MountainSnow className="mr-1 inline h-3 w-3" aria-hidden="true" />
            {tick.personalNote}
          </p>
        )}
      </div>
    </li>
  )
}

function formatTickDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

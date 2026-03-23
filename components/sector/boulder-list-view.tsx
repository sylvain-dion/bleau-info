'use client'

import Link from 'next/link'
import { BoulderListCard, type BoulderListItem } from './boulder-list-card'

interface BoulderListViewProps {
  boulders: BoulderListItem[]
}

interface GradeGroup {
  label: string
  items: BoulderListItem[]
}

/**
 * Full boulder list for a sector, grouped by grade level.
 *
 * Client component that integrates with tick-store and list-store
 * via BoulderListCard. Receives boulder data from the server.
 */
export function BoulderListView({ boulders }: BoulderListViewProps) {
  const groups = groupByGradePrefix(boulders)

  return (
    <>
      {/* Count header */}
      <p className="mb-3 text-xs text-muted-foreground">
        {boulders.length} bloc{boulders.length > 1 ? 's' : ''}
      </p>

      {/* Grouped list */}
      <div className="space-y-6">
        {groups.map(({ label, items }) => (
          <section key={label}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </h2>
            <div className="space-y-1">
              {items.map((b) => (
                <BoulderListCard key={b.id} boulder={b} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Map link */}
      <div className="mt-8 rounded-xl border border-border bg-card p-4 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:underline"
        >
          Voir le secteur sur la carte →
        </Link>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByGradePrefix(boulders: BoulderListItem[]): GradeGroup[] {
  const groups = new Map<string, BoulderListItem[]>()

  for (const b of boulders) {
    const prefix = b.grade.charAt(0)
    const label = `${prefix}e niveau`
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(b)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, items }))
}

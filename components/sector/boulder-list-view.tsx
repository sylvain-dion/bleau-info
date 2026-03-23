'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { BoulderListCard, type BoulderListItem } from './boulder-list-card'
import {
  BoulderSortSelector,
  type SortOption,
} from './boulder-sort-selector'
import { useTickStore } from '@/stores/tick-store'
import { useListStore } from '@/stores/list-store'

interface BoulderListViewProps {
  boulders: BoulderListItem[]
  sectorSlug: string
}

interface GradeGroup {
  label: string
  items: BoulderListItem[]
}

const STORAGE_KEY_PREFIX = 'bleau-sort-'

/**
 * Full boulder list for a sector with sort selector.
 *
 * Sorts client-side. Sort preference persisted in sessionStorage
 * per sector. Grade-grouped view only applies for grade sorts.
 */
export function BoulderListView({ boulders, sectorSlug }: BoulderListViewProps) {
  const [sort, setSort] = useState<SortOption>('grade-asc')

  // Restore sort preference from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY_PREFIX + sectorSlug)
    if (stored) setSort(stored as SortOption)
  }, [sectorSlug])

  function handleSortChange(newSort: SortOption) {
    setSort(newSort)
    sessionStorage.setItem(STORAGE_KEY_PREFIX + sectorSlug, newSort)
  }

  // Stable selectors for sort computations
  const ticks = useTickStore((s) => s.ticks)
  const lists = useListStore((s) => s.lists)

  const tickedIds = useMemo(
    () => new Set(ticks.map((t) => t.boulderId)),
    [ticks]
  )

  const projectBoulderIds = useMemo(() => {
    const ids = new Set<string>()
    for (const list of lists) {
      if (list.emoji === '🎯') {
        for (const item of list.items) ids.add(item.boulderId)
      }
    }
    return ids
  }, [lists])

  const sorted = useMemo(
    () => sortBoulders(boulders, sort, tickedIds, projectBoulderIds),
    [boulders, sort, tickedIds, projectBoulderIds]
  )

  const isGradeSort = sort === 'grade-asc' || sort === 'grade-desc'
  const groups = useMemo(
    () => (isGradeSort ? groupByGradePrefix(sorted) : null),
    [sorted, isGradeSort]
  )

  return (
    <>
      {/* Count + sort */}
      <div className="flex items-baseline justify-between">
        <p className="mb-1 text-xs text-muted-foreground">
          {boulders.length} bloc{boulders.length > 1 ? 's' : ''}
        </p>
      </div>

      <BoulderSortSelector value={sort} onChange={handleSortChange} />

      {/* Grouped list (grade sorts) */}
      {groups ? (
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
      ) : (
        /* Flat list (other sorts) */
        <div className="space-y-1">
          {sorted.map((b) => (
            <BoulderListCard key={b.id} boulder={b} />
          ))}
        </div>
      )}

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
// Sort logic
// ---------------------------------------------------------------------------

function sortBoulders(
  boulders: BoulderListItem[],
  sort: SortOption,
  tickedIds: Set<string>,
  projectIds: Set<string>
): BoulderListItem[] {
  const copy = [...boulders]

  switch (sort) {
    case 'grade-asc':
      return copy.sort((a, b) => a.grade.localeCompare(b.grade))
    case 'grade-desc':
      return copy.sort((a, b) => b.grade.localeCompare(a.grade))
    case 'name-asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name, 'fr'))
    case 'unticked-first':
      return copy.sort((a, b) => {
        const aT = tickedIds.has(a.id) ? 1 : 0
        const bT = tickedIds.has(b.id) ? 1 : 0
        if (aT !== bT) return aT - bT
        return a.grade.localeCompare(b.grade)
      })
    case 'projects-first':
      return copy.sort((a, b) => {
        const aP = projectIds.has(a.id) ? 0 : 1
        const bP = projectIds.has(b.id) ? 0 : 1
        if (aP !== bP) return aP - bP
        return a.grade.localeCompare(b.grade)
      })
  }
}

// ---------------------------------------------------------------------------
// Grouping
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

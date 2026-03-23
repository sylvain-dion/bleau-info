'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, Search, X } from 'lucide-react'
import { BoulderListCard, type BoulderListItem } from './boulder-list-card'
import {
  BoulderSortSelector,
  type SortOption,
} from './boulder-sort-selector'
import {
  BoulderFilterPanel,
  applyFilters,
  hasActiveFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  type BoulderFilters,
} from './boulder-filter-panel'
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

const SORT_STORAGE_KEY = 'bleau-sort-'

/**
 * Full boulder list for a sector with sort + filter controls.
 *
 * Filters and sorts client-side. Sort preference persisted in
 * sessionStorage per sector. Grade-grouped view for grade sorts.
 */
export function BoulderListView({ boulders, sectorSlug }: BoulderListViewProps) {
  const [sort, setSort] = useState<SortOption>('grade-asc')
  const [filters, setFilters] = useState<BoulderFilters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore sort preference from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY + sectorSlug)
    if (stored) setSort(stored as SortOption)
  }, [sectorSlug])

  function handleSortChange(newSort: SortOption) {
    setSort(newSort)
    sessionStorage.setItem(SORT_STORAGE_KEY + sectorSlug, newSort)
  }

  // Stable selectors
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

  const favoriteBoulderIds = useMemo(() => {
    const ids = new Set<string>()
    for (const list of lists) {
      if (list.emoji === '⭐') {
        for (const item of list.items) ids.add(item.boulderId)
      }
    }
    return ids
  }, [lists])

  // Debounced search
  function handleSearchInput(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(value), 200)
  }

  // Filter → Search → Sort pipeline
  const filtered = useMemo(
    () => applyFilters(boulders, filters, tickedIds, projectBoulderIds, favoriteBoulderIds),
    [boulders, filters, tickedIds, projectBoulderIds, favoriteBoulderIds]
  )

  const searched = useMemo(
    () => searchQuery ? searchBoulders(filtered, searchQuery) : filtered,
    [filtered, searchQuery]
  )

  const sorted = useMemo(
    () => sortBoulders(searched, sort, tickedIds, projectBoulderIds),
    [searched, sort, tickedIds, projectBoulderIds]
  )

  const isGradeSort = sort === 'grade-asc' || sort === 'grade-desc'
  const groups = useMemo(
    () => (isGradeSort ? groupByGradePrefix(sorted, sort === 'grade-desc') : null),
    [sorted, isGradeSort, sort]
  )

  const isFiltered = hasActiveFilters(filters)
  const isNarrowed = isFiltered || searchQuery !== ''

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Rechercher un bloc…"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setSearchQuery('') }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Count + filter toggle */}
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isNarrowed
            ? `${sorted.length} / ${boulders.length} blocs`
            : `${boulders.length} bloc${boulders.length > 1 ? 's' : ''}`}
        </p>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            showFilters || isFiltered
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
          {isFiltered && !showFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {countActiveFilters(filters)}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel (collapsible) */}
      {showFilters && (
        <BoulderFilterPanel
          filters={filters}
          onChange={setFilters}
          totalCount={boulders.length}
          filteredCount={filtered.length}
        />
      )}

      <BoulderSortSelector value={sort} onChange={handleSortChange} />

      {/* Empty state */}
      {sorted.length === 0 && isNarrowed && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun bloc trouvé.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vérifiez l&apos;orthographe ou ajustez vos filtres.
          </p>
          <button
            type="button"
            onClick={() => { setFilters(EMPTY_FILTERS); setSearchInput(''); setSearchQuery('') }}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Tout réinitialiser
          </button>
        </div>
      )}

      {/* Grouped list (grade sorts) */}
      {groups && sorted.length > 0 ? (
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
      ) : sorted.length > 0 ? (
        /* Flat list (other sorts) */
        <div className="space-y-1">
          {sorted.map((b) => (
            <BoulderListCard key={b.id} boulder={b} />
          ))}
        </div>
      ) : null}

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
// Search logic
// ---------------------------------------------------------------------------

/** Normalize text: lowercase + strip accents */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function searchBoulders(boulders: BoulderListItem[], query: string): BoulderListItem[] {
  const q = normalize(query)
  return boulders.filter((b) => normalize(b.name).includes(q))
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

function groupByGradePrefix(boulders: BoulderListItem[], descending = false): GradeGroup[] {
  const groups = new Map<string, BoulderListItem[]>()

  for (const b of boulders) {
    const prefix = b.grade.charAt(0)
    const label = `${prefix}e niveau`
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(b)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => descending ? b.localeCompare(a) : a.localeCompare(b))
    .map(([label, items]) => ({ label, items }))
}

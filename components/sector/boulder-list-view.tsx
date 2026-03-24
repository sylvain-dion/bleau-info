'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, Search, X, Map, ListChecks } from 'lucide-react'
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
import { CIRCUIT_COLORS, type CircuitColor } from '@/lib/data/mock-boulders'
import { getCircuitsForSector, type CircuitInfo } from '@/lib/data/mock-circuits'
import { toSlug } from '@/lib/data/boulder-service'

interface BoulderListViewProps {
  boulders: BoulderListItem[]
  sectorSlug: string
  sectorName?: string
}

interface GradeGroup {
  label: string
  items: BoulderListItem[]
}

interface CircuitGroup {
  color: CircuitColor | 'none'
  label: string
  hexColor: string
  gradeRange: string
  count: number
  items: BoulderListItem[]
  circuitInfo?: CircuitInfo
}

const SORT_STORAGE_KEY = 'bleau-sort-'

const CIRCUIT_LABELS: Record<string, string> = {
  jaune: 'Circuit Jaune',
  bleu: 'Circuit Bleu',
  rouge: 'Circuit Rouge',
  blanc: 'Circuit Blanc',
  orange: 'Circuit Orange',
  noir: 'Circuit Noir',
  none: 'Hors circuit',
}

/**
 * Full boulder list for a sector with sort + filter controls.
 *
 * Supports grade grouping, circuit grouping with color headers,
 * and inline circuit color filter pills.
 */
export function BoulderListView({ boulders, sectorSlug, sectorName }: BoulderListViewProps) {
  const [sort, setSort] = useState<SortOption>('grade-asc')
  const [filters, setFilters] = useState<BoulderFilters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [circuitFilters, setCircuitFilters] = useState<(CircuitColor | 'none')[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore sort preference
  useEffect(() => {
    const stored = sessionStorage.getItem(SORT_STORAGE_KEY + sectorSlug)
    if (stored) setSort(stored as SortOption)
  }, [sectorSlug])

  function handleSortChange(newSort: SortOption) {
    setSort(newSort)
    sessionStorage.setItem(SORT_STORAGE_KEY + sectorSlug, newSort)
    // Reset circuit filters when switching away from circuits
    if (newSort !== 'circuits') setCircuitFilters([])
  }

  function handleCircuitFilterToggle(color: CircuitColor | 'none') {
    setCircuitFilters((prev) => {
      if (prev.includes(color)) {
        const next = prev.filter((c) => c !== color)
        return next
      }
      return [...prev, color]
    })
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
  const isCircuitSort = sort === 'circuits'

  const gradeGroups = useMemo(
    () => (isGradeSort ? groupByGradePrefix(sorted, sort === 'grade-desc') : null),
    [sorted, isGradeSort, sort]
  )

  const circuitGroups = useMemo(
    () => {
      if (!isCircuitSort) return null
      const name = sectorName ?? sectorSlug
      return groupByCircuit(sorted, name, circuitFilters)
    },
    [sorted, isCircuitSort, sectorName, sectorSlug, circuitFilters]
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

      <BoulderSortSelector
        value={sort}
        onChange={handleSortChange}
        circuitFilters={circuitFilters}
        onCircuitFilterToggle={handleCircuitFilterToggle}
        sectorSlug={sectorSlug}
      />

      {/* Empty state */}
      {sorted.length === 0 && isNarrowed && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun bloc trouvé.
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

      {/* Circuit-grouped list */}
      {circuitGroups && sorted.length > 0 ? (
        <div className="space-y-6">
          {circuitGroups.map((group) => (
            <CircuitSection key={group.color} group={group} sectorSlug={sectorSlug} />
          ))}
        </div>

      /* Grade-grouped list */
      ) : gradeGroups && sorted.length > 0 ? (
        <div className="space-y-6">
          {gradeGroups.map(({ label, items }) => (
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

      /* Flat list */
      ) : sorted.length > 0 ? (
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
// Circuit section component
// ---------------------------------------------------------------------------

function CircuitSection({ group, sectorSlug }: { group: CircuitGroup; sectorSlug: string }) {
  return (
    <section>
      {/* Circuit header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{
              backgroundColor: group.hexColor,
              border: group.color === 'blanc' ? '1px solid #d4d4d8' : undefined,
            }}
          />
          <h2 className="text-sm font-semibold text-foreground">
            {group.label}
          </h2>
          <span className="text-xs text-muted-foreground">
            {group.count} blocs · {group.gradeRange}
          </span>
        </div>
        {group.color !== 'none' && (
          <Link
            href={`/?circuit=${group.color}&sector=${sectorSlug}`}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <Map className="h-3 w-3" />
            Carte
          </Link>
        )}
      </div>

      {/* Boulder list */}
      <div className="space-y-1">
        {group.items.map((b) => (
          <BoulderListCard key={b.id} boulder={b} />
        ))}
      </div>

      {/* Log entire circuit button */}
      {group.color !== 'none' && group.items.length > 1 && (
        <div className="mt-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <ListChecks className="h-3.5 w-3.5" />
            Loguer l&apos;enchaînement du circuit
          </button>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Search logic
// ---------------------------------------------------------------------------

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
    case 'circuits':
      // Sort by circuit color priority then circuitNumber
      return copy.sort((a, b) => {
        const aCircuit = a.circuit ?? 'zzz'
        const bCircuit = b.circuit ?? 'zzz'
        if (aCircuit !== bCircuit) return aCircuit.localeCompare(bCircuit)
        return (a.circuitNumber ?? 999) - (b.circuitNumber ?? 999)
      })
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
  const groups: Record<string, BoulderListItem[]> = {}

  for (const b of boulders) {
    const prefix = b.grade.charAt(0)
    const label = `${prefix}e niveau`
    if (!groups[label]) groups[label] = []
    groups[label].push(b)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => descending ? b.localeCompare(a) : a.localeCompare(b))
    .map(([label, items]) => ({ label, items }))
}

function groupByCircuit(
  boulders: BoulderListItem[],
  sectorName: string,
  colorFilter: (CircuitColor | 'none')[]
): CircuitGroup[] {
  const circuitInfos = getCircuitsForSector(sectorName)
  const infoByColor: Record<string, CircuitInfo> = {}
  for (const ci of circuitInfos) {
    infoByColor[ci.color] = ci
  }

  const groups: Record<string, BoulderListItem[]> = {}

  for (const b of boulders) {
    const key = b.circuit ?? 'none'
    if (!groups[key]) groups[key] = []
    groups[key].push(b)
  }

  // Circuit color order
  const colorOrder: (CircuitColor | 'none')[] = ['jaune', 'bleu', 'rouge', 'orange', 'blanc', 'noir', 'none']

  return colorOrder
    .filter((c) => c in groups)
    .filter((c) => colorFilter.length === 0 || colorFilter.includes(c))
    .map((color) => {
      const items = groups[color]!
      const grades = items.map((b) => b.grade).sort()
      const info = color !== 'none' ? infoByColor[color] : undefined

      return {
        color,
        label: CIRCUIT_LABELS[color] ?? color,
        hexColor: color === 'none' ? '#a1a1aa' : (CIRCUIT_COLORS[color as CircuitColor] ?? '#a1a1aa'),
        gradeRange: grades.length > 0 ? `${grades[0]} → ${grades[grades.length - 1]}` : '',
        count: items.length,
        items,
        circuitInfo: info,
      }
    })
}

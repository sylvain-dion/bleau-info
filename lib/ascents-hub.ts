/**
 * Pure helpers for the "Mes ascensions" hub (Story 4.6).
 *
 * The hub re-renders the same `Tick[]` array three different ways:
 *  - a flat searchable / sortable / filterable list (Tab 1)
 *  - grouped per circuit (Tab 2)
 *  - aggregate stats (Tab 3 — handled by `lib/stats.ts`)
 *
 * Keeping the transforms in pure functions lets us drive the UI from
 * `useTickStore` without entangling the rendering code with sort/filter
 * state management. Every helper here is deterministic and side-effect
 * free so it's straightforward to unit-test.
 */

import { getGradeIndex } from '@/lib/grades'
import type { Tick, TickStyle } from '@/lib/validations/tick'
import type { CircuitInfo } from '@/lib/data/mock-circuits'
import {
  getCircuitProgress,
  type CircuitProgress,
} from '@/lib/circuits/circuit-progress'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AscentSortKey =
  | 'date-desc'
  | 'date-asc'
  | 'grade-desc'
  | 'grade-asc'
  | 'name-asc'

export interface AscentFilters {
  /** Free-text query matched against boulder name (case-insensitive). */
  search?: string
  /** Filter by tick style (flash / a_vue / travaille). Empty = all. */
  styles?: readonly TickStyle[]
  /** Restrict to ticks at or above this grade (inclusive). */
  minGrade?: string | null
  /** Restrict to ticks at or below this grade (inclusive). */
  maxGrade?: string | null
}

export interface CircuitGroup {
  circuit: CircuitInfo
  progress: CircuitProgress
  /** Ticks belonging to this circuit, newest first. */
  ticks: Tick[]
}

// ---------------------------------------------------------------------------
// Search / filter / sort
// ---------------------------------------------------------------------------

const NORMALIZE_REGEX = /[\u0300-\u036f]/g

/** Lowercase + strip diacritics for accent-insensitive search. */
function normalize(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(NORMALIZE_REGEX, '')
}

/**
 * Apply the active filters to a tick list. Returns a new array — does
 * not mutate the input.
 */
export function filterTicks(ticks: Tick[], filters: AscentFilters): Tick[] {
  const search = filters.search?.trim() ?? ''
  const needle = search ? normalize(search) : ''
  const styles = filters.styles && filters.styles.length > 0 ? new Set(filters.styles) : null
  const minIdx =
    filters.minGrade != null && filters.minGrade !== ''
      ? getGradeIndex(filters.minGrade)
      : -1
  const maxIdx =
    filters.maxGrade != null && filters.maxGrade !== ''
      ? getGradeIndex(filters.maxGrade)
      : -1

  return ticks.filter((tick) => {
    if (needle && !normalize(tick.boulderName).includes(needle)) return false
    if (styles && !styles.has(tick.tickStyle)) return false
    if (minIdx >= 0) {
      const idx = getGradeIndex(tick.boulderGrade)
      if (idx < 0 || idx < minIdx) return false
    }
    if (maxIdx >= 0) {
      const idx = getGradeIndex(tick.boulderGrade)
      if (idx < 0 || idx > maxIdx) return false
    }
    return true
  })
}

/**
 * Sort ticks for display. Ties on the primary key are broken on
 * `tickDate` then `createdAt` so output is stable regardless of input
 * order.
 */
export function sortTicks(ticks: Tick[], key: AscentSortKey): Tick[] {
  const sorted = [...ticks]
  switch (key) {
    case 'date-desc':
      sorted.sort((a, b) => compareDateDesc(a, b))
      break
    case 'date-asc':
      sorted.sort((a, b) => -compareDateDesc(a, b))
      break
    case 'grade-desc':
      sorted.sort((a, b) => {
        const diff = getGradeIndex(b.boulderGrade) - getGradeIndex(a.boulderGrade)
        return diff !== 0 ? diff : compareDateDesc(a, b)
      })
      break
    case 'grade-asc':
      sorted.sort((a, b) => {
        const diff = getGradeIndex(a.boulderGrade) - getGradeIndex(b.boulderGrade)
        return diff !== 0 ? diff : compareDateDesc(a, b)
      })
      break
    case 'name-asc':
      sorted.sort((a, b) => {
        const diff = a.boulderName.localeCompare(b.boulderName, 'fr', {
          sensitivity: 'base',
        })
        return diff !== 0 ? diff : compareDateDesc(a, b)
      })
      break
  }
  return sorted
}

function compareDateDesc(a: Tick, b: Tick): number {
  if (a.tickDate !== b.tickDate) {
    return a.tickDate < b.tickDate ? 1 : -1
  }
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? 1 : -1
  }
  return 0
}

/** Convenience: filter + sort in one call. */
export function selectTicks(
  ticks: Tick[],
  filters: AscentFilters,
  sortKey: AscentSortKey,
): Tick[] {
  return sortTicks(filterTicks(ticks, filters), sortKey)
}

// ---------------------------------------------------------------------------
// Recent / counters
// ---------------------------------------------------------------------------

/** Latest N ticks by date (descending). Used by the profile home block. */
export function recentTicks(ticks: Tick[], limit: number): Tick[] {
  if (limit <= 0) return []
  return sortTicks(ticks, 'date-desc').slice(0, limit)
}

/** Count distinct boulder ids in the tick list. */
export function uniqueBoulderCount(ticks: Tick[]): number {
  const ids = new Set<string>()
  for (const t of ticks) ids.add(t.boulderId)
  return ids.size
}

// ---------------------------------------------------------------------------
// Grouping by circuit (Tab 2)
// ---------------------------------------------------------------------------

/**
 * Group ticks by the circuit each boulder belongs to.
 *
 * The hub displays one accordion per circuit the user has touched —
 * either via a circuit completion or by ticking at least one boulder
 * of the circuit. Sorted by progress (% desc), with completed circuits
 * surfaced first.
 *
 * @param allCircuits full circuit list (typically `getAllCircuits()`)
 * @param ticks the user's tick list
 * @param completedIds set of completed boulder ids — usually
 *   `useTickStore.getCompletedBoulderIds()` so progress matches the
 *   rest of the app
 */
export function groupTicksByCircuit(
  allCircuits: CircuitInfo[],
  ticks: Tick[],
  completedIds: Set<string>,
): CircuitGroup[] {
  if (allCircuits.length === 0) return []

  const ticksByBoulder = new Map<string, Tick[]>()
  for (const t of ticks) {
    const list = ticksByBoulder.get(t.boulderId)
    if (list) list.push(t)
    else ticksByBoulder.set(t.boulderId, [t])
  }

  const groups: CircuitGroup[] = []
  for (const circuit of allCircuits) {
    const circuitTicks: Tick[] = []
    for (const id of circuit.boulderIds) {
      const list = ticksByBoulder.get(id)
      if (list) circuitTicks.push(...list)
    }
    if (circuitTicks.length === 0) continue

    groups.push({
      circuit,
      progress: getCircuitProgress(circuit, completedIds),
      ticks: sortTicks(circuitTicks, 'date-desc'),
    })
  }

  groups.sort((a, b) => {
    if (a.progress.isComplete !== b.progress.isComplete) {
      return a.progress.isComplete ? -1 : 1
    }
    if (a.progress.percent !== b.progress.percent) {
      return b.progress.percent - a.progress.percent
    }
    return a.circuit.sector.localeCompare(b.circuit.sector, 'fr')
  })

  return groups
}

/** Ticks not attached to any circuit boulder (orphans in Tab 2). */
export function orphanTicks(
  allCircuits: CircuitInfo[],
  ticks: Tick[],
): Tick[] {
  const circuitBoulderIds = new Set<string>()
  for (const c of allCircuits) {
    for (const id of c.boulderIds) circuitBoulderIds.add(id)
  }
  return sortTicks(
    ticks.filter((t) => !circuitBoulderIds.has(t.boulderId)),
    'date-desc',
  )
}

/**
 * Sector-specific statistics computation (Story 12.4).
 *
 * Aggregates boulder and tick data for a sector's Stats tab:
 * grade distribution, monthly activity trend, top climbed, top rated.
 */

import { getGradeIndex } from '@/lib/grades'
import { getMockPopularity } from '@/lib/popularity'
import { calculateSoftGrade } from '@/lib/grades/soft-grade'
import type { Tick } from '@/lib/validations/tick'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'
import type { GradeCount } from '@/lib/stats'

// ---------------------------------------------------------------------------
// Grade distribution (by boulder count, not tick count)
// ---------------------------------------------------------------------------

/** Count boulders per grade in a sector, sorted by climbing scale. */
export function computeSectorGradeDistribution(
  boulders: BoulderListItem[]
): GradeCount[] {
  const counts = new Map<string, number>()
  for (const b of boulders) {
    counts.set(b.grade, (counts.get(b.grade) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort(([a], [b]) => getGradeIndex(a) - getGradeIndex(b))
    .map(([grade, count]) => ({ grade, count }))
}

// ---------------------------------------------------------------------------
// Monthly activity trend
// ---------------------------------------------------------------------------

export interface MonthlyTrend {
  current: number
  previous: number
  trend: 'up' | 'down' | 'stable'
}

/** Compare this month's ascent count to last month for sector boulders. */
export function computeMonthlyActivity(
  ticks: Tick[],
  boulderIds: Set<string>
): MonthlyTrend {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`

  let current = 0
  let previous = 0

  for (const tick of ticks) {
    if (!boulderIds.has(tick.boulderId)) continue
    const month = tick.tickDate.slice(0, 7)
    if (month === currentMonth) current++
    else if (month === previousMonth) previous++
  }

  const trend =
    current > previous ? 'up' : current < previous ? 'down' : 'stable'

  return { current, previous, trend }
}

// ---------------------------------------------------------------------------
// Top climbed boulders
// ---------------------------------------------------------------------------

export interface TopClimbedBoulder {
  boulder: BoulderListItem
  count: number
}

/**
 * Get the most climbed boulders in a sector.
 * Combines local ticks + mock community popularity.
 */
export function getTopClimbedBoulders(
  boulders: BoulderListItem[],
  ticks: Tick[],
  limit = 5
): TopClimbedBoulder[] {
  const tickCounts = new Map<string, number>()
  for (const tick of ticks) {
    tickCounts.set(tick.boulderId, (tickCounts.get(tick.boulderId) ?? 0) + 1)
  }

  return boulders
    .map((boulder) => ({
      boulder,
      count:
        (tickCounts.get(boulder.id) ?? 0) + getMockPopularity(boulder.id),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Top rated boulders (community soft-grade)
// ---------------------------------------------------------------------------

export interface TopRatedBoulder {
  boulder: BoulderListItem
  softGrade: string
  voteCount: number
}

/**
 * Get boulders with the most community grade votes (consensus reached).
 * Sorted by vote count descending.
 */
export function getTopRatedBoulders(
  boulders: BoulderListItem[],
  ticks: Tick[],
  limit = 5
): TopRatedBoulder[] {
  // Group ticks by boulder
  const ticksByBoulder = new Map<string, Tick[]>()
  for (const tick of ticks) {
    const existing = ticksByBoulder.get(tick.boulderId) ?? []
    existing.push(tick)
    ticksByBoulder.set(tick.boulderId, existing)
  }

  const rated: TopRatedBoulder[] = []

  for (const boulder of boulders) {
    const boulderTicks = ticksByBoulder.get(boulder.id) ?? []
    const result = calculateSoftGrade(boulderTicks, boulder.grade)
    if (result.hasConsensus) {
      rated.push({
        boulder,
        softGrade: result.grade,
        voteCount: result.voteCount,
      })
    }
  }

  return rated
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, limit)
}

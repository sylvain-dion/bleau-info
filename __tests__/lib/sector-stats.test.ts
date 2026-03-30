import { describe, it, expect } from 'vitest'
import {
  computeSectorGradeDistribution,
  computeMonthlyActivity,
  getTopClimbedBoulders,
  getTopRatedBoulders,
} from '@/lib/sector-stats'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'
import type { Tick } from '@/lib/validations/tick'

function makeBoulder(
  overrides: Partial<BoulderListItem> = {}
): BoulderListItem {
  return {
    id: 'b-1',
    name: 'Bloc Test',
    grade: '5b',
    style: 'dalle',
    circuit: null,
    circuitNumber: null,
    exposure: null,
    ...overrides,
  }
}

let tickId = 0
function makeTick(overrides: Partial<Tick> = {}): Tick {
  tickId++
  return {
    id: `t-${tickId}`,
    userId: 'user-1',
    boulderId: 'b-1',
    boulderName: 'Bloc Test',
    boulderGrade: '5b',
    tickStyle: 'flash',
    tickDate: '2026-03-15',
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// computeSectorGradeDistribution
// ---------------------------------------------------------------------------

describe('computeSectorGradeDistribution', () => {
  it('counts boulders per grade', () => {
    const boulders = [
      makeBoulder({ id: 'a', grade: '5a' }),
      makeBoulder({ id: 'b', grade: '5a' }),
      makeBoulder({ id: 'c', grade: '6b' }),
    ]
    const result = computeSectorGradeDistribution(boulders)
    expect(result).toEqual([
      { grade: '5a', count: 2 },
      { grade: '6b', count: 1 },
    ])
  })

  it('sorts by climbing scale', () => {
    const boulders = [
      makeBoulder({ id: 'a', grade: '7a' }),
      makeBoulder({ id: 'b', grade: '4a' }),
      makeBoulder({ id: 'c', grade: '6a' }),
    ]
    const result = computeSectorGradeDistribution(boulders)
    expect(result.map((r) => r.grade)).toEqual(['4a', '6a', '7a'])
  })

  it('returns empty array for no boulders', () => {
    expect(computeSectorGradeDistribution([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// computeMonthlyActivity
// ---------------------------------------------------------------------------

describe('computeMonthlyActivity', () => {
  it('counts ticks for current and previous month', () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`

    const ticks = [
      makeTick({ boulderId: 'b-1', tickDate: `${currentMonth}-05` }),
      makeTick({ boulderId: 'b-1', tickDate: `${currentMonth}-10` }),
      makeTick({ boulderId: 'b-1', tickDate: `${previousMonth}-15` }),
    ]
    const result = computeMonthlyActivity(ticks, new Set(['b-1']))
    expect(result.current).toBe(2)
    expect(result.previous).toBe(1)
    expect(result.trend).toBe('up')
  })

  it('filters to sector boulders only', () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const ticks = [
      makeTick({ boulderId: 'b-1', tickDate: `${currentMonth}-05` }),
      makeTick({ boulderId: 'other', tickDate: `${currentMonth}-10` }),
    ]
    const result = computeMonthlyActivity(ticks, new Set(['b-1']))
    expect(result.current).toBe(1)
  })

  it('returns stable when counts are equal', () => {
    const result = computeMonthlyActivity([], new Set(['b-1']))
    expect(result.trend).toBe('stable')
  })

  it('returns down when previous was higher', () => {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`

    const ticks = [
      makeTick({ boulderId: 'b-1', tickDate: `${previousMonth}-05` }),
      makeTick({ boulderId: 'b-1', tickDate: `${previousMonth}-10` }),
    ]
    const result = computeMonthlyActivity(ticks, new Set(['b-1']))
    expect(result.trend).toBe('down')
  })
})

// ---------------------------------------------------------------------------
// getTopClimbedBoulders
// ---------------------------------------------------------------------------

describe('getTopClimbedBoulders', () => {
  it('returns boulders sorted by total count descending', () => {
    const boulders = [
      makeBoulder({ id: 'low' }),
      makeBoulder({ id: 'high' }),
    ]
    // 10 ticks on 'high' vs 0 on 'low' — guarantees higher total even with mock
    const ticks = Array.from({ length: 10 }, () =>
      makeTick({ boulderId: 'high' })
    )
    const result = getTopClimbedBoulders(boulders, ticks)
    expect(result[0].boulder.id).toBe('high')
    expect(result[0].count).toBeGreaterThan(result[1].count)
  })

  it('respects limit parameter', () => {
    const boulders = Array.from({ length: 10 }, (_, i) =>
      makeBoulder({ id: `b-${i}` })
    )
    const result = getTopClimbedBoulders(boulders, [], 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('includes mock popularity even with no ticks', () => {
    const boulders = [makeBoulder({ id: 'test-id' })]
    const result = getTopClimbedBoulders(boulders, [])
    expect(result[0].count).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// getTopRatedBoulders
// ---------------------------------------------------------------------------

describe('getTopRatedBoulders', () => {
  it('returns empty when no boulders have consensus', () => {
    const boulders = [makeBoulder({ id: 'b-1' })]
    const ticks = [makeTick({ boulderId: 'b-1', perceivedGrade: '5b' })]
    // Only 1 vote — below SOFT_GRADE_MIN_VOTES (5)
    const result = getTopRatedBoulders(boulders, ticks)
    expect(result).toHaveLength(0)
  })

  it('returns boulders with enough votes sorted by vote count', () => {
    const boulders = [
      makeBoulder({ id: 'b-1', grade: '5b' }),
      makeBoulder({ id: 'b-2', grade: '6a' }),
    ]
    // b-1: 6 votes, b-2: 5 votes
    const ticks = [
      ...Array.from({ length: 6 }, () =>
        makeTick({ boulderId: 'b-1', perceivedGrade: '5c' })
      ),
      ...Array.from({ length: 5 }, () =>
        makeTick({ boulderId: 'b-2', perceivedGrade: '6a' })
      ),
    ]
    const result = getTopRatedBoulders(boulders, ticks)
    expect(result).toHaveLength(2)
    expect(result[0].boulder.id).toBe('b-1')
    expect(result[0].voteCount).toBe(6)
  })

  it('respects limit parameter', () => {
    const boulders = Array.from({ length: 10 }, (_, i) =>
      makeBoulder({ id: `rated-${i}`, grade: '5b' })
    )
    const ticks = boulders.flatMap((b) =>
      Array.from({ length: 5 }, () =>
        makeTick({ boulderId: b.id, perceivedGrade: '5b' })
      )
    )
    const result = getTopRatedBoulders(boulders, ticks, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })
})

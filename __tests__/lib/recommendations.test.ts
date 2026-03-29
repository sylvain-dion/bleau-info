import { describe, it, expect } from 'vitest'
import {
  buildClimberProfile,
  scoreBoulder,
  getRecommendations,
  getPopularBoulders,
  type ClimberProfile,
} from '@/lib/recommendations'
import type { Tick } from '@/lib/validations/tick'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tickCounter = 0

function makeTick(overrides: Partial<Tick> = {}): Tick {
  tickCounter++
  return {
    id: `tick-${tickCounter}`,
    userId: 'user-1',
    boulderId: `boulder-${tickCounter}`,
    boulderName: `Bloc ${tickCounter}`,
    boulderGrade: '5b',
    tickStyle: 'flash',
    tickDate: '2026-03-01',
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeBoulder(overrides: Partial<BoulderListItem> = {}): BoulderListItem {
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

// ---------------------------------------------------------------------------
// buildClimberProfile
// ---------------------------------------------------------------------------

describe('buildClimberProfile', () => {
  it('returns null for fewer than 5 ticks', () => {
    const ticks = [makeTick(), makeTick(), makeTick(), makeTick()]
    expect(buildClimberProfile(ticks, new Map())).toBeNull()
  })

  it('returns null for exactly 4 ticks', () => {
    const ticks = Array.from({ length: 4 }, () => makeTick())
    expect(buildClimberProfile(ticks, new Map())).toBeNull()
  })

  it('returns a profile for exactly 5 ticks', () => {
    const ticks = Array.from({ length: 5 }, () => makeTick())
    const result = buildClimberProfile(ticks, new Map())
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('medianGradeIndex')
    expect(result).toHaveProperty('preferredStyles')
    expect(result).toHaveProperty('tickedBoulderIds')
  })

  it('computes correct median grade from 5 recent ticks', () => {
    // Grades: 4a(3), 5a(6), 5b(7), 6a(9), 6b(11) → sorted indices: [3,6,7,9,11] → median = 7 (5b)
    const grades = ['4a', '5a', '5b', '6a', '6b']
    const ticks = grades.map((g, i) =>
      makeTick({
        boulderGrade: g,
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const profile = buildClimberProfile(ticks, new Map())!
    expect(profile.medianGradeIndex).toBe(7) // 5b
  })

  it('uses only 5 most recent ticks for median', () => {
    // Old tick at 3a, recent 5 at 6a
    const oldTick = makeTick({ boulderGrade: '3a', tickDate: '2025-01-01' })
    const recentTicks = Array.from({ length: 5 }, (_, i) =>
      makeTick({ boulderGrade: '6a', tickDate: `2026-03-0${i + 1}` })
    )
    const profile = buildClimberProfile([oldTick, ...recentTicks], new Map())!
    expect(profile.medianGradeIndex).toBe(9) // 6a, not influenced by 3a
  })

  it('identifies preferred styles above 30% threshold', () => {
    const boulderIds = ['b-1', 'b-2', 'b-3', 'b-4', 'b-5', 'b-6', 'b-7']
    const styleMap = new Map([
      ['b-1', 'dalle'],
      ['b-2', 'dalle'],
      ['b-3', 'dalle'],
      ['b-4', 'devers'],
      ['b-5', 'devers'],
      ['b-6', 'toit'],
      ['b-7', 'arete'],
    ])
    // dalle: 3/7 = 43% ✓, devers: 2/7 = 29% ✗, toit: 1/7 ✗, arete: 1/7 ✗
    const ticks = boulderIds.map((id) =>
      makeTick({ boulderId: id })
    )
    const profile = buildClimberProfile(ticks, styleMap)!
    expect(profile.preferredStyles.has('dalle')).toBe(true)
    expect(profile.preferredStyles.has('devers')).toBe(false)
  })

  it('handles all ticks being the same style', () => {
    const ids = ['s-1', 's-2', 's-3', 's-4', 's-5']
    const styleMap = new Map(ids.map((id) => [id, 'toit']))
    const ticks = ids.map((id) => makeTick({ boulderId: id }))
    const profile = buildClimberProfile(ticks, styleMap)!
    expect(profile.preferredStyles.has('toit')).toBe(true)
    expect(profile.preferredStyles.size).toBe(1)
  })

  it('handles evenly distributed styles (none above threshold)', () => {
    // 5 ticks, 5 different styles → each 20% < 30%
    const ids = ['e-1', 'e-2', 'e-3', 'e-4', 'e-5']
    const styles = ['dalle', 'devers', 'toit', 'arete', 'traverse']
    const styleMap = new Map(ids.map((id, i) => [id, styles[i]]))
    const ticks = ids.map((id) => makeTick({ boulderId: id }))
    const profile = buildClimberProfile(ticks, styleMap)!
    expect(profile.preferredStyles.size).toBe(0)
  })

  it('collects all ticked boulder IDs', () => {
    const ids = ['c-1', 'c-2', 'c-3', 'c-4', 'c-5']
    const ticks = ids.map((id) => makeTick({ boulderId: id }))
    const profile = buildClimberProfile(ticks, new Map())!
    for (const id of ids) {
      expect(profile.tickedBoulderIds.has(id)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// scoreBoulder
// ---------------------------------------------------------------------------

describe('scoreBoulder', () => {
  const baseProfile: ClimberProfile = {
    medianGradeIndex: 7, // 5b
    preferredStyles: new Set(['dalle']),
    tickedBoulderIds: new Set(),
  }

  it('gives 40 grade points for exact grade match', () => {
    const boulder = makeBoulder({ grade: '5b' }) // index 7
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    // grade: 40, style: 30 (dalle), popularity: 0, novelty: 10
    expect(score).toBeCloseTo(80)
  })

  it('gives ~27 grade points for 1 step away', () => {
    const boulder = makeBoulder({ grade: '5c', style: 'toit' }) // index 8, 1 step
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    // grade: 40*(1 - 1/3) ≈ 26.67, style: 0, pop: 0, novelty: 10
    expect(score).toBeCloseTo(36.67, 1)
  })

  it('gives 0 grade points for 3+ steps away', () => {
    const boulder = makeBoulder({ grade: '6b', style: 'toit' }) // index 11, 4 steps
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    // grade: 0, style: 0, pop: 0, novelty: 10
    expect(score).toBeCloseTo(10)
  })

  it('gives 30 style points for matching style', () => {
    const boulder = makeBoulder({ grade: '8c', style: 'dalle' }) // far grade, matching style
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    // grade: 0 (too far), style: 30, pop: 0, novelty: 10
    expect(score).toBeCloseTo(40)
  })

  it('gives 0 style points for non-matching style', () => {
    const boulder = makeBoulder({ grade: '8c', style: 'toit' })
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    expect(score).toBeCloseTo(10) // only novelty
  })

  it('gives 20 popularity points for high popularity', () => {
    const boulder = makeBoulder({ grade: '8c', style: 'toit' })
    const { score } = scoreBoulder(boulder, baseProfile, 10)
    // grade: 0, style: 0, pop: 20, novelty: 10
    expect(score).toBeCloseTo(30)
  })

  it('gives 0 popularity points for zero popularity', () => {
    const boulder = makeBoulder({ grade: '8c', style: 'toit' })
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    expect(score).toBeCloseTo(10) // only novelty
  })

  it('always awards 10 novelty points', () => {
    const boulder = makeBoulder({ grade: '8c', style: 'toit' })
    const { score } = scoreBoulder(boulder, baseProfile, 0)
    expect(score).toBe(10)
  })

  it('sets primaryReason to the highest scoring factor', () => {
    // Exact grade + matching style → grade wins (40 > 30)
    const boulder = makeBoulder({ grade: '5b', style: 'dalle' })
    const { primaryReason } = scoreBoulder(boulder, baseProfile, 0)
    expect(primaryReason).toBe('grade')
  })

  it('includes all qualifying reasons', () => {
    const boulder = makeBoulder({ grade: '5b', style: 'dalle' })
    const { reasons } = scoreBoulder(boulder, baseProfile, 10)
    expect(reasons).toContain('grade')
    expect(reasons).toContain('style')
    expect(reasons).toContain('popular')
  })
})

// ---------------------------------------------------------------------------
// getRecommendations
// ---------------------------------------------------------------------------

describe('getRecommendations', () => {
  it('returns empty array when fewer than 5 ticks', () => {
    const boulders = [makeBoulder()]
    const ticks = [makeTick(), makeTick()]
    expect(getRecommendations(boulders, ticks)).toEqual([])
  })

  it('returns max 5 results by default', () => {
    const boulders = Array.from({ length: 10 }, (_, i) =>
      makeBoulder({ id: `rec-${i}`, grade: '5b', style: 'dalle' })
    )
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({
        boulderId: `other-${i}`,
        boulderGrade: '5b',
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const result = getRecommendations(boulders, ticks)
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('excludes already-ticked boulders', () => {
    const boulders = [
      makeBoulder({ id: 'ticked-1', grade: '5b' }),
      makeBoulder({ id: 'unticked-1', grade: '5b' }),
    ]
    const ticks = Array.from({ length: 5 }, (_, i) =>
      makeTick({
        boulderId: i === 0 ? 'ticked-1' : `other-${i}`,
        boulderGrade: '5b',
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const result = getRecommendations(boulders, ticks)
    expect(result.every((r) => r.boulder.id !== 'ticked-1')).toBe(true)
  })

  it('results are sorted by score descending', () => {
    const boulders = [
      makeBoulder({ id: 'far-grade', grade: '8c', style: 'toit' }),
      makeBoulder({ id: 'match-grade', grade: '5b', style: 'dalle' }),
    ]
    const ticks = Array.from({ length: 5 }, (_, i) =>
      makeTick({
        boulderId: `t-${i}`,
        boulderGrade: '5b',
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const result = getRecommendations(boulders, ticks)
    expect(result[0].boulder.id).toBe('match-grade')
  })

  it('each result has primaryReason set', () => {
    const boulders = [makeBoulder({ id: 'pr-1', grade: '5b' })]
    const ticks = Array.from({ length: 5 }, (_, i) =>
      makeTick({
        boulderId: `pr-t-${i}`,
        boulderGrade: '5b',
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const result = getRecommendations(boulders, ticks)
    for (const rec of result) {
      expect(['grade', 'style', 'popular']).toContain(rec.primaryReason)
    }
  })

  it('respects custom maxResults', () => {
    const boulders = Array.from({ length: 10 }, (_, i) =>
      makeBoulder({ id: `mr-${i}`, grade: '5b' })
    )
    const ticks = Array.from({ length: 5 }, (_, i) =>
      makeTick({
        boulderId: `mr-t-${i}`,
        boulderGrade: '5b',
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const result = getRecommendations(boulders, ticks, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('returns fewer than maxResults if not enough unticked boulders', () => {
    const boulders = [makeBoulder({ id: 'only-1', grade: '5b' })]
    const ticks = Array.from({ length: 5 }, (_, i) =>
      makeTick({
        boulderId: `few-t-${i}`,
        boulderGrade: '5b',
        tickDate: `2026-03-0${i + 1}`,
      })
    )
    const result = getRecommendations(boulders, ticks, 5)
    expect(result.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// getPopularBoulders
// ---------------------------------------------------------------------------

describe('getPopularBoulders', () => {
  it('returns boulders sorted by popularity descending', () => {
    const boulders = [
      makeBoulder({ id: 'pop-a' }),
      makeBoulder({ id: 'pop-b' }),
      makeBoulder({ id: 'pop-c' }),
    ]
    const result = getPopularBoulders(boulders, [])
    // Just verify ordering is consistent (deterministic hash)
    for (let i = 1; i < result.length; i++) {
      const prevPop =
        result[i - 1].id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 5
      const currPop =
        result[i].id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 5
      expect(prevPop).toBeGreaterThanOrEqual(currPop)
    }
  })

  it('filters out already-ticked boulders', () => {
    const boulders = [
      makeBoulder({ id: 'pt-1' }),
      makeBoulder({ id: 'pt-2' }),
    ]
    const ticks = [makeTick({ boulderId: 'pt-1' })]
    const result = getPopularBoulders(boulders, ticks)
    expect(result.every((b) => b.id !== 'pt-1')).toBe(true)
  })

  it('filters by declared grade range when provided', () => {
    const boulders = [
      makeBoulder({ id: 'dg-1', grade: '5b' }), // index 7
      makeBoulder({ id: 'dg-2', grade: '8c' }), // index 26, far away
    ]
    const result = getPopularBoulders(boulders, [], '5a') // index 6, ±2 → 4-8
    expect(result.every((b) => b.id !== 'dg-2')).toBe(true)
  })

  it('returns max 5 by default', () => {
    const boulders = Array.from({ length: 10 }, (_, i) =>
      makeBoulder({ id: `pm-${i}` })
    )
    const result = getPopularBoulders(boulders, [])
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('returns all unticked boulders if fewer than 5 exist', () => {
    const boulders = [makeBoulder({ id: 'few-1' }), makeBoulder({ id: 'few-2' })]
    const result = getPopularBoulders(boulders, [])
    expect(result.length).toBe(2)
  })
})

import { describe, it, expect } from 'vitest'
import {
  BADGE_CATALOG,
  computeBadges,
  computeBadgesFromTicks,
  type BadgeInput,
} from '@/lib/badges'
import type { Tick } from '@/lib/validations/tick'
import { getAllClimbers } from '@/lib/data/mock-climbers'

function publicInput(overrides: Partial<BadgeInput> = {}): BadgeInput {
  return {
    tickCount: 0,
    uniqueBoulders: 0,
    maxGrade: '',
    sectorsVisited: 0,
    circuitsCompleted: 0,
    ...overrides,
  }
}

function earnedIds(result: ReturnType<typeof computeBadges>): string[] {
  return result.filter((b) => b.earned).map((b) => b.definition.id)
}

function getBadge(
  result: ReturnType<typeof computeBadges>,
  id: string,
) {
  const badge = result.find((b) => b.definition.id === id)
  if (!badge) throw new Error(`Badge ${id} not present in result`)
  return badge
}

describe('computeBadges — volume category', () => {
  it('unlocks nothing at 0 ticks', () => {
    const result = computeBadges(publicInput())
    expect(earnedIds(result)).not.toContain('volume-1')
  })

  it('unlocks volume-1 at exactly 1 tick', () => {
    const result = computeBadges(publicInput({ tickCount: 1 }))
    expect(earnedIds(result)).toContain('volume-1')
    expect(earnedIds(result)).not.toContain('volume-10')
  })

  it('unlocks volume-100 at the exact threshold but not volume-500', () => {
    const result = computeBadges(publicInput({ tickCount: 100 }))
    expect(earnedIds(result)).toEqual(
      expect.arrayContaining(['volume-1', 'volume-10', 'volume-50', 'volume-100']),
    )
    expect(earnedIds(result)).not.toContain('volume-500')
  })

  it('does not unlock volume-100 at 99 ticks', () => {
    const result = computeBadges(publicInput({ tickCount: 99 }))
    expect(earnedIds(result)).not.toContain('volume-100')
  })
})

describe('computeBadges — grade category', () => {
  it('unknown grade earns no grade badge', () => {
    const result = computeBadges(publicInput({ maxGrade: 'gibberish' }))
    const gradeEarned = earnedIds(result).filter((id) => id.startsWith('grade-'))
    expect(gradeEarned).toEqual([])
  })

  it('5a earns grade-5 but not grade-6', () => {
    const result = computeBadges(publicInput({ maxGrade: '5a' }))
    expect(earnedIds(result)).toContain('grade-5')
    expect(earnedIds(result)).not.toContain('grade-6')
  })

  it('6c+ earns grade-5 and grade-6 but not grade-7', () => {
    const result = computeBadges(publicInput({ maxGrade: '6c+' }))
    expect(earnedIds(result)).toEqual(
      expect.arrayContaining(['grade-5', 'grade-6']),
    )
    expect(earnedIds(result)).not.toContain('grade-7')
  })

  it('8a unlocks every grade badge', () => {
    const result = computeBadges(publicInput({ maxGrade: '8a' }))
    expect(earnedIds(result)).toEqual(
      expect.arrayContaining(['grade-5', 'grade-6', 'grade-7', 'grade-8']),
    )
  })
})

describe('computeBadges — style badges (optional inputs)', () => {
  it('omits style badges when raw counts are absent', () => {
    const result = computeBadges(publicInput({ tickCount: 1 }))
    const styleBadges = result.filter((b) => b.definition.category === 'style')
    expect(styleBadges).toHaveLength(0)
  })

  it('includes style badges when optional inputs are provided', () => {
    const result = computeBadges(
      publicInput({
        flashCount: 10,
        onsightCount: 0,
        uniqueClimbingDays: 5,
      }),
    )
    const styleIds = result
      .filter((b) => b.definition.category === 'style')
      .map((b) => b.definition.id)
    expect(styleIds).toEqual(
      expect.arrayContaining(['flash-10', 'flash-50', 'onsight-10', 'days-30']),
    )
  })

  it('earns flash-10 at exactly 10 flashes', () => {
    const result = computeBadges(publicInput({ flashCount: 10, onsightCount: 0, uniqueClimbingDays: 0 }))
    expect(earnedIds(result)).toContain('flash-10')
    expect(earnedIds(result)).not.toContain('flash-50')
  })
})

describe('computeBadges — locked badge progress', () => {
  it('progress is always between 0 and 1', () => {
    const result = computeBadges(publicInput({ tickCount: 72 }))
    for (const badge of result) {
      if (!badge.earned) {
        expect(badge.progress).toBeGreaterThanOrEqual(0)
        expect(badge.progress).toBeLessThanOrEqual(1)
      }
    }
  })

  it('progress reflects ratio to threshold', () => {
    const result = computeBadges(publicInput({ tickCount: 50 }))
    const volume100 = getBadge(result, 'volume-100')
    expect(volume100.earned).toBe(false)
    if (!volume100.earned) {
      expect(volume100.progress).toBeCloseTo(0.5, 5)
    }
  })
})

describe('computeBadges — ordering', () => {
  it('earned badges come before locked badges', () => {
    const result = computeBadges(
      publicInput({
        tickCount: 10,
        maxGrade: '6a',
        sectorsVisited: 3,
      }),
    )
    let seenLocked = false
    for (const badge of result) {
      if (!badge.earned) seenLocked = true
      if (badge.earned && seenLocked) {
        throw new Error('Earned badge appeared after a locked badge')
      }
    }
  })
})

describe('computeBadges — mock climbers', () => {
  it('Marie (247 ticks, 7a, 12 sectors, 5 circuits) earns high-tier badges', () => {
    const marie = getAllClimbers().find((c) => c.id === 'climber-1')!
    const result = computeBadges(marie.stats)
    const earned = earnedIds(result)
    expect(earned).toEqual(
      expect.arrayContaining([
        'volume-100',
        'grade-7',
        'diversity-100',
        'explore-10',
        'circuit-5',
      ]),
    )
    expect(earned).not.toContain('volume-500')
    expect(earned).not.toContain('grade-8')
  })

  it('Lucas (34 ticks, 5a, 3 sectors) earns only entry-level badges', () => {
    const lucas = getAllClimbers().find((c) => c.id === 'climber-3')!
    const result = computeBadges(lucas.stats)
    const earned = earnedIds(result)
    expect(earned).toEqual(
      expect.arrayContaining(['volume-1', 'volume-10', 'grade-5', 'explore-3', 'circuit-1', 'diversity-25']),
    )
    expect(earned).not.toContain('volume-50')
    expect(earned).not.toContain('grade-6')
  })
})

describe('computeBadgesFromTicks', () => {
  function mkTick(overrides: Partial<Tick>): Tick {
    return {
      id: 't1',
      userId: 'u1',
      boulderId: 'cul-de-chien-1',
      boulderName: 'La Marie-Rose',
      boulderGrade: '6a',
      tickStyle: 'travaille',
      tickDate: '2026-03-01',
      personalNote: '',
      perceivedGrade: null,
      syncStatus: 'local',
      createdAt: '2026-03-01T00:00:00Z',
      ...overrides,
    }
  }

  it('derives unique sectors via getBoulderById', () => {
    const ticks: Tick[] = [
      mkTick({ id: 't1', boulderId: 'cul-de-chien-1', boulderGrade: '6a', tickDate: '2026-03-01' }),
      mkTick({ id: 't2', boulderId: 'bas-cuvier-1', boulderGrade: '5c', tickDate: '2026-03-02' }),
      mkTick({ id: 't3', boulderId: 'bas-cuvier-2', boulderGrade: '6b', tickDate: '2026-03-02' }),
    ]
    const result = computeBadgesFromTicks(ticks, {})
    // volume-1 earned, explore tracking
    expect(earnedIds(result)).toContain('volume-1')
  })

  it('counts flashes and onsights separately', () => {
    const ticks: Tick[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        mkTick({
          id: `f${i}`,
          boulderId: 'cul-de-chien-1',
          tickStyle: 'flash',
          tickDate: `2026-03-${String(i + 1).padStart(2, '0')}`,
        }),
      ),
    ]
    const result = computeBadgesFromTicks(ticks, {})
    expect(earnedIds(result)).toContain('flash-10')
    expect(earnedIds(result)).not.toContain('onsight-10')
  })

  it('counts unique climbing days from tickDate', () => {
    const ticks: Tick[] = Array.from({ length: 30 }, (_, i) =>
      mkTick({
        id: `d${i}`,
        tickStyle: 'travaille',
        tickDate: `2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      }),
    )
    const result = computeBadgesFromTicks(ticks, {})
    expect(earnedIds(result)).toContain('days-30')
  })

  it('uses max grade across all ticks', () => {
    const ticks: Tick[] = [
      mkTick({ id: 'a', boulderGrade: '5a' }),
      mkTick({ id: 'b', boulderGrade: '7a' }),
      mkTick({ id: 'c', boulderGrade: '6b' }),
    ]
    const result = computeBadgesFromTicks(ticks, {})
    expect(earnedIds(result)).toContain('grade-7')
    expect(earnedIds(result)).not.toContain('grade-8')
  })

  it('counts circuits from completion record keys', () => {
    const ticks: Tick[] = [mkTick({ id: 'x' })]
    const completions = { 'circuit-a': {}, 'circuit-b': {}, 'circuit-c': {}, 'circuit-d': {}, 'circuit-e': {} }
    const result = computeBadgesFromTicks(ticks, completions)
    expect(earnedIds(result)).toContain('circuit-5')
  })

  it('handles empty ticks list', () => {
    const result = computeBadgesFromTicks([], {})
    expect(earnedIds(result)).toEqual([])
  })
})

describe('BADGE_CATALOG', () => {
  it('has unique badge ids', () => {
    const ids = BADGE_CATALOG.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('contains 22 badges across 6 categories', () => {
    expect(BADGE_CATALOG).toHaveLength(22)
    const categories = new Set(BADGE_CATALOG.map((b) => b.category))
    expect(categories.size).toBe(6)
  })
})

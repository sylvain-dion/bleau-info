import { describe, it, expect } from 'vitest'
import {
  computeTickStats,
  computeMonthlyAscents,
  computeGradeDistribution,
  computeStyleDistribution,
  mergeAnnotationMonths,
} from '@/lib/stats'
import type { MonthlyAscent } from '@/lib/stats'
import type { Tick } from '@/lib/validations/tick'

function makeTick(overrides: Partial<Tick> = {}): Tick {
  return {
    id: 'tick-1',
    userId: 'user-1',
    boulderId: 'boulder-1',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    tickStyle: 'flash',
    tickDate: '2026-01-15',
    personalNote: '',
    createdAt: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

describe('computeTickStats', () => {
  it('returns zeroes for empty ticks', () => {
    const stats = computeTickStats([])
    expect(stats.totalTicks).toBe(0)
    expect(stats.uniqueBoulders).toBe(0)
    expect(stats.monthlyAscents).toEqual([])
    expect(stats.gradeDistribution).toEqual([])
    expect(stats.styleDistribution).toEqual([])
  })

  it('counts total ticks correctly', () => {
    const ticks = [makeTick({ id: '1' }), makeTick({ id: '2' }), makeTick({ id: '3' })]
    expect(computeTickStats(ticks).totalTicks).toBe(3)
  })

  it('counts unique boulders correctly', () => {
    const ticks = [
      makeTick({ id: '1', boulderId: 'b1' }),
      makeTick({ id: '2', boulderId: 'b1' }),
      makeTick({ id: '3', boulderId: 'b2' }),
    ]
    expect(computeTickStats(ticks).uniqueBoulders).toBe(2)
  })
})

describe('computeMonthlyAscents', () => {
  it('returns empty for no ticks', () => {
    expect(computeMonthlyAscents([])).toEqual([])
  })

  it('groups ticks by month', () => {
    const ticks = [
      makeTick({ id: '1', tickDate: '2026-01-10' }),
      makeTick({ id: '2', tickDate: '2026-01-20' }),
      makeTick({ id: '3', tickDate: '2026-02-05' }),
    ]
    const result = computeMonthlyAscents(ticks)
    expect(result).toHaveLength(2)
    expect(result[0].month).toBe('2026-01')
    expect(result[0].count).toBe(2)
    expect(result[1].month).toBe('2026-02')
    expect(result[1].count).toBe(1)
  })

  it('fills gap months with zero count', () => {
    const ticks = [
      makeTick({ id: '1', tickDate: '2026-01-10' }),
      makeTick({ id: '2', tickDate: '2026-03-15' }),
    ]
    const result = computeMonthlyAscents(ticks)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ month: '2026-01', count: 1 })
    expect(result[1]).toMatchObject({ month: '2026-02', count: 0 })
    expect(result[2]).toMatchObject({ month: '2026-03', count: 1 })
  })

  it('generates French month labels', () => {
    const ticks = [makeTick({ tickDate: '2026-03-15' })]
    const result = computeMonthlyAscents(ticks)
    // French short format: "mars 2026" or "mars. 2026" depending on locale
    expect(result[0].label).toContain('2026')
    expect(result[0].label.toLowerCase()).toContain('mar')
  })

  it('sorts months chronologically', () => {
    const ticks = [
      makeTick({ id: '1', tickDate: '2026-03-01' }),
      makeTick({ id: '2', tickDate: '2025-12-01' }),
      makeTick({ id: '3', tickDate: '2026-01-01' }),
    ]
    const result = computeMonthlyAscents(ticks)
    expect(result[0].month).toBe('2025-12')
    expect(result[result.length - 1].month).toBe('2026-03')
  })

  it('handles single month correctly', () => {
    const ticks = [makeTick({ tickDate: '2026-06-10' })]
    const result = computeMonthlyAscents(ticks)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
  })
})

describe('computeGradeDistribution', () => {
  it('returns empty for no ticks', () => {
    expect(computeGradeDistribution([])).toEqual([])
  })

  it('counts ticks per grade', () => {
    const ticks = [
      makeTick({ id: '1', boulderGrade: '6a' }),
      makeTick({ id: '2', boulderGrade: '6a' }),
      makeTick({ id: '3', boulderGrade: '7a' }),
    ]
    const result = computeGradeDistribution(ticks)
    expect(result).toEqual([
      { grade: '6a', count: 2 },
      { grade: '7a', count: 1 },
    ])
  })

  it('sorts grades by climbing scale, not alphabetically', () => {
    const ticks = [
      makeTick({ id: '1', boulderGrade: '7a' }),
      makeTick({ id: '2', boulderGrade: '5c' }),
      makeTick({ id: '3', boulderGrade: '6b+' }),
    ]
    const result = computeGradeDistribution(ticks)
    expect(result.map((r) => r.grade)).toEqual(['5c', '6b+', '7a'])
  })

  it('handles grades with + suffix', () => {
    const ticks = [
      makeTick({ id: '1', boulderGrade: '6a+' }),
      makeTick({ id: '2', boulderGrade: '6a' }),
    ]
    const result = computeGradeDistribution(ticks)
    expect(result[0].grade).toBe('6a')
    expect(result[1].grade).toBe('6a+')
  })
})

describe('computeStyleDistribution', () => {
  it('returns empty for no ticks', () => {
    expect(computeStyleDistribution([])).toEqual([])
  })

  it('counts each tick style', () => {
    const ticks = [
      makeTick({ id: '1', tickStyle: 'flash' }),
      makeTick({ id: '2', tickStyle: 'flash' }),
      makeTick({ id: '3', tickStyle: 'a_vue' }),
      makeTick({ id: '4', tickStyle: 'travaille' }),
    ]
    const result = computeStyleDistribution(ticks)
    expect(result).toHaveLength(3)

    const flash = result.find((r) => r.style === 'flash')
    expect(flash?.count).toBe(2)
    expect(flash?.label).toBe('Flash')
    expect(flash?.color).toBe('#F59E0B')

    const aVue = result.find((r) => r.style === 'a_vue')
    expect(aVue?.count).toBe(1)
    expect(aVue?.label).toBe('À vue')
    expect(aVue?.color).toBe('#3B82F6')

    const travaille = result.find((r) => r.style === 'travaille')
    expect(travaille?.count).toBe(1)
    expect(travaille?.label).toBe('Travaillé')
    expect(travaille?.color).toBe('#FF6B00')
  })

  it('filters out styles with zero count', () => {
    const ticks = [
      makeTick({ id: '1', tickStyle: 'flash' }),
      makeTick({ id: '2', tickStyle: 'flash' }),
    ]
    const result = computeStyleDistribution(ticks)
    expect(result).toHaveLength(1)
    expect(result[0].style).toBe('flash')
  })
})

describe('mergeAnnotationMonths', () => {
  const baseMonths: MonthlyAscent[] = [
    { month: '2026-01', label: 'janv. 2026', count: 3 },
    { month: '2026-02', label: 'févr. 2026', count: 0 },
    { month: '2026-03', label: 'mars 2026', count: 5 },
  ]

  it('returns unchanged when no annotation dates', () => {
    const result = mergeAnnotationMonths(baseMonths, [])
    expect(result).toBe(baseMonths)
  })

  it('returns unchanged when monthly ascents is empty', () => {
    const result = mergeAnnotationMonths([], ['2026-05-01'])
    expect(result).toEqual([])
  })

  it('returns unchanged when annotations are within existing range', () => {
    const result = mergeAnnotationMonths(baseMonths, ['2026-02-15'])
    expect(result).toBe(baseMonths)
  })

  it('extends range when annotation is after existing range', () => {
    const result = mergeAnnotationMonths(baseMonths, ['2026-05-10'])
    expect(result).toHaveLength(5) // Jan, Feb, Mar, Apr, May
    expect(result[3]).toMatchObject({ month: '2026-04', count: 0 })
    expect(result[4]).toMatchObject({ month: '2026-05', count: 0 })
    // Original data preserved
    expect(result[0].count).toBe(3)
    expect(result[2].count).toBe(5)
  })

  it('extends range when annotation is before existing range', () => {
    const result = mergeAnnotationMonths(baseMonths, ['2025-11-01'])
    expect(result[0]).toMatchObject({ month: '2025-11', count: 0 })
    expect(result[1]).toMatchObject({ month: '2025-12', count: 0 })
    expect(result[2]).toMatchObject({ month: '2026-01', count: 3 })
  })

  it('extends range in both directions', () => {
    const result = mergeAnnotationMonths(baseMonths, ['2025-12-01', '2026-05-15'])
    expect(result[0].month).toBe('2025-12')
    expect(result[result.length - 1].month).toBe('2026-05')
    // Original months preserved in middle
    expect(result.find((m) => m.month === '2026-01')?.count).toBe(3)
    expect(result.find((m) => m.month === '2026-03')?.count).toBe(5)
  })

  it('fills gap months between annotation and existing range', () => {
    const result = mergeAnnotationMonths(baseMonths, ['2026-06-01'])
    const months = result.map((m) => m.month)
    expect(months).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    ])
  })
})

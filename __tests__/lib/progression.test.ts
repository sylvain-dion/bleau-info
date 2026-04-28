import { describe, it, expect } from 'vitest'
import {
  computePersonalRecords,
  computeMaxGradeTimeline,
  highestEverGrade,
  formatRelativeDay,
  RECORD_TIERS,
} from '@/lib/progression'
import type { Tick } from '@/lib/validations/tick'

function makeTick(
  overrides: Partial<Tick> & { tickDate: string; boulderGrade: string },
): Tick {
  const { tickDate, boulderGrade } = overrides
  return {
    id: overrides.id ?? `${tickDate}-${boulderGrade}`,
    userId: 'u1',
    boulderId: overrides.boulderId ?? 'cul-de-chien-1',
    boulderName: overrides.boulderName ?? 'La Marie-Rose',
    boulderGrade,
    tickStyle: overrides.tickStyle ?? 'flash',
    tickDate,
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: overrides.createdAt ?? `${tickDate}T12:00:00Z`,
  }
}

const TODAY = new Date(2026, 3, 28) // 2026-04-28

// ---------------------------------------------------------------------------
// computePersonalRecords
// ---------------------------------------------------------------------------

describe('computePersonalRecords', () => {
  it('returns an empty array for no ticks', () => {
    expect(computePersonalRecords([])).toEqual([])
  })

  it('records a single 4a tick under tier 4a only', () => {
    const records = computePersonalRecords([
      makeTick({ tickDate: '2026-01-10', boulderGrade: '4a' }),
    ])
    expect(records).toHaveLength(1)
    expect(records[0].tier).toBe('4a')
    expect(records[0].grade).toBe('4a')
    expect(records[0].tickDate).toBe('2026-01-10')
    expect(records[0].label).toBe('Premier 4ᵉ degré')
  })

  it('credits the first 6c+ as crossing 4a, 5a, and 6a tiers', () => {
    const records = computePersonalRecords([
      makeTick({ tickDate: '2026-02-15', boulderGrade: '6c+' }),
    ])
    const tiers = records.map((r) => r.tier)
    expect(tiers).toEqual(['4a', '5a', '6a'])
    // All three records reference the same breakthrough tick.
    for (const r of records) {
      expect(r.grade).toBe('6c+')
      expect(r.tickDate).toBe('2026-02-15')
    }
  })

  it('returns the earliest qualifying tick per tier', () => {
    const ticks = [
      makeTick({ tickDate: '2026-03-01', boulderGrade: '5a', id: 'a' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '4b', id: 'b' }),
      makeTick({ tickDate: '2026-01-15', boulderGrade: '4a', id: 'c' }),
      makeTick({ tickDate: '2026-04-10', boulderGrade: '6a', id: 'd' }),
    ]
    const records = computePersonalRecords(ticks)
    expect(records.find((r) => r.tier === '4a')?.tickDate).toBe('2026-01-15')
    expect(records.find((r) => r.tier === '5a')?.tickDate).toBe('2026-03-01')
    expect(records.find((r) => r.tier === '6a')?.tickDate).toBe('2026-04-10')
    expect(records.find((r) => r.tier === '7a')).toBeUndefined()
    expect(records.find((r) => r.tier === '8a')).toBeUndefined()
  })

  it('uses createdAt as tiebreaker on the same tickDate', () => {
    const ticks = [
      makeTick({
        tickDate: '2026-01-20',
        boulderGrade: '5a',
        id: 'late',
        createdAt: '2026-01-20T18:00:00Z',
        boulderName: 'Late ascent',
      }),
      makeTick({
        tickDate: '2026-01-20',
        boulderGrade: '5a',
        id: 'early',
        createdAt: '2026-01-20T08:00:00Z',
        boulderName: 'Early ascent',
      }),
    ]
    const records = computePersonalRecords(ticks)
    const fiveA = records.find((r) => r.tier === '5a')
    expect(fiveA?.boulderName).toBe('Early ascent')
  })

  it('orders output by tier ascending (4a → 8a)', () => {
    const records = computePersonalRecords([
      makeTick({ tickDate: '2026-01-01', boulderGrade: '8a' }),
    ])
    const tiers = records.map((r) => r.tier)
    expect(tiers).toEqual([...RECORD_TIERS])
  })

  it('skips ticks with unknown grade values', () => {
    const records = computePersonalRecords([
      makeTick({ tickDate: '2026-01-01', boulderGrade: 'unknown' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '5a' }),
    ])
    expect(records.map((r) => r.tier)).toEqual(['4a', '5a'])
    expect(records[0].tickDate).toBe('2026-02-01')
  })

  it('preserves boulder identity on each record', () => {
    const records = computePersonalRecords([
      makeTick({
        tickDate: '2026-01-15',
        boulderGrade: '6a',
        boulderId: 'bas-cuvier-7',
        boulderName: 'La Joker',
      }),
    ])
    const sixA = records.find((r) => r.tier === '6a')
    expect(sixA?.boulderId).toBe('bas-cuvier-7')
    expect(sixA?.boulderName).toBe('La Joker')
  })
})

// ---------------------------------------------------------------------------
// computeMaxGradeTimeline
// ---------------------------------------------------------------------------

describe('computeMaxGradeTimeline', () => {
  it('returns an empty array when months <= 0', () => {
    expect(computeMaxGradeTimeline([], 0, TODAY)).toEqual([])
    expect(computeMaxGradeTimeline([], -3, TODAY)).toEqual([])
  })

  it('returns N entries (oldest first) when months = N', () => {
    const out = computeMaxGradeTimeline([], 12, TODAY)
    expect(out).toHaveLength(12)
    // Oldest entry first.
    expect(out[0].month).toBe('2025-05')
    expect(out[11].month).toBe('2026-04')
  })

  it('marks empty months with null maxGrade and -1 index', () => {
    const out = computeMaxGradeTimeline([], 3, TODAY)
    for (const entry of out) {
      expect(entry.maxGrade).toBeNull()
      expect(entry.maxGradeIndex).toBe(-1)
    }
  })

  it('records the highest grade per month', () => {
    const ticks = [
      makeTick({ tickDate: '2026-04-05', boulderGrade: '5a' }),
      makeTick({ tickDate: '2026-04-15', boulderGrade: '6b' }),
      makeTick({ tickDate: '2026-04-20', boulderGrade: '5c' }),
    ]
    const out = computeMaxGradeTimeline(ticks, 1, TODAY)
    expect(out).toHaveLength(1)
    expect(out[0].month).toBe('2026-04')
    expect(out[0].maxGrade).toBe('6b')
  })

  it('isolates ticks by their calendar month', () => {
    const ticks = [
      makeTick({ tickDate: '2026-02-10', boulderGrade: '5a' }),
      makeTick({ tickDate: '2026-03-10', boulderGrade: '6a' }),
      makeTick({ tickDate: '2026-04-10', boulderGrade: '7a' }),
    ]
    const out = computeMaxGradeTimeline(ticks, 3, TODAY)
    expect(out.map((m) => ({ month: m.month, grade: m.maxGrade }))).toEqual([
      { month: '2026-02', grade: '5a' },
      { month: '2026-03', grade: '6a' },
      { month: '2026-04', grade: '7a' },
    ])
  })

  it('ignores ticks outside the rolling window', () => {
    const ticks = [
      // Way before the window starts (window of 3 months ending at 2026-04 = [2026-02, 2026-04]).
      makeTick({ tickDate: '2025-11-15', boulderGrade: '8a' }),
      makeTick({ tickDate: '2026-03-10', boulderGrade: '5a' }),
    ]
    const out = computeMaxGradeTimeline(ticks, 3, TODAY)
    expect(out.find((m) => m.maxGrade === '8a')).toBeUndefined()
    expect(out.find((m) => m.month === '2026-03')?.maxGrade).toBe('5a')
  })

  it('skips ticks with unknown grades', () => {
    const ticks = [
      makeTick({ tickDate: '2026-04-10', boulderGrade: 'foo' }),
      makeTick({ tickDate: '2026-04-12', boulderGrade: '5a' }),
    ]
    const out = computeMaxGradeTimeline(ticks, 1, TODAY)
    expect(out[0].maxGrade).toBe('5a')
  })

  it('produces a French short month label', () => {
    const out = computeMaxGradeTimeline([], 1, TODAY)
    // toLocaleDateString output depends on the runtime locale, but we expect
    // a non-empty label string for the 2026-04 anchor.
    expect(typeof out[0].label).toBe('string')
    expect(out[0].label.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// highestEverGrade
// ---------------------------------------------------------------------------

describe('highestEverGrade', () => {
  it('returns null for an empty list', () => {
    expect(highestEverGrade([])).toBeNull()
  })

  it('returns the only grade present', () => {
    expect(highestEverGrade([makeTick({ tickDate: '2026-01-01', boulderGrade: '5a' })])).toBe('5a')
  })

  it('returns the highest grade across many ticks', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '5a' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '6c+' }),
      makeTick({ tickDate: '2026-03-01', boulderGrade: '6a' }),
    ]
    expect(highestEverGrade(ticks)).toBe('6c+')
  })

  it('treats unknown grades as lower than any known grade', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: 'foo' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '4a' }),
    ]
    expect(highestEverGrade(ticks)).toBe('4a')
  })
})

// ---------------------------------------------------------------------------
// formatRelativeDay
// ---------------------------------------------------------------------------

describe('formatRelativeDay', () => {
  const NOW = new Date(2026, 3, 28) // 2026-04-28

  it('returns empty string for empty input', () => {
    expect(formatRelativeDay('', NOW)).toBe('')
    expect(formatRelativeDay('not-a-date', NOW)).toBe('')
  })

  it('returns "aujourd\'hui" for today', () => {
    expect(formatRelativeDay('2026-04-28', NOW)).toBe("aujourd'hui")
  })

  it('returns "hier" for yesterday', () => {
    expect(formatRelativeDay('2026-04-27', NOW)).toBe('hier')
  })

  it('returns "il y a N j" for 2..6 days ago', () => {
    expect(formatRelativeDay('2026-04-26', NOW)).toBe('il y a 2 j')
    expect(formatRelativeDay('2026-04-23', NOW)).toBe('il y a 5 j')
  })

  it('returns "il y a N sem." for 7..29 days ago', () => {
    expect(formatRelativeDay('2026-04-21', NOW)).toBe('il y a 1 sem.')
    expect(formatRelativeDay('2026-04-07', NOW)).toBe('il y a 3 sem.')
  })

  it('returns "il y a N mois" for 30..364 days ago', () => {
    expect(formatRelativeDay('2026-03-15', NOW)).toBe('il y a 1 mois')
    expect(formatRelativeDay('2025-09-01', NOW)).toBe('il y a 7 mois')
  })

  it('returns a locale date for ≥ 1 year ago', () => {
    const out = formatRelativeDay('2024-01-15', NOW)
    expect(out).not.toMatch(/il y a/)
    expect(out).toMatch(/2024/)
  })
})

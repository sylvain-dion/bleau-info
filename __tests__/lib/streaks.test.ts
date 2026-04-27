import { describe, it, expect } from 'vitest'
import {
  computeStreakStats,
  computeActivityCalendar,
  toLocalDateKey,
} from '@/lib/streaks'
import type { Tick } from '@/lib/validations/tick'

function makeTick(tickDate: string, id = tickDate): Tick {
  return {
    id,
    userId: 'u1',
    boulderId: 'cul-de-chien-1',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    tickStyle: 'flash',
    tickDate,
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: `${tickDate}T12:00:00Z`,
  }
}

const TODAY = new Date(2026, 3, 27) // 2026-04-27 (month is 0-indexed)

describe('toLocalDateKey', () => {
  it('formats a Date as YYYY-MM-DD in local time', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toLocalDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('computeStreakStats — empty input', () => {
  it('returns zeros and null lastClimbedOn for no ticks', () => {
    const stats = computeStreakStats([], TODAY)
    expect(stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalClimbingDays: 0,
      lastClimbedOn: null,
    })
  })
})

describe('computeStreakStats — current streak', () => {
  it('is 1 when the user climbed today', () => {
    const stats = computeStreakStats([makeTick('2026-04-27')], TODAY)
    expect(stats.currentStreak).toBe(1)
  })

  it('is 1 when last climb was yesterday (grace period)', () => {
    const stats = computeStreakStats([makeTick('2026-04-26')], TODAY)
    expect(stats.currentStreak).toBe(1)
  })

  it('is 0 when last climb was 2 days ago (broken)', () => {
    const stats = computeStreakStats([makeTick('2026-04-25')], TODAY)
    expect(stats.currentStreak).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const ticks = [
      makeTick('2026-04-25'),
      makeTick('2026-04-26'),
      makeTick('2026-04-27'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.currentStreak).toBe(3)
  })

  it('counts consecutive days ending yesterday', () => {
    const ticks = [
      makeTick('2026-04-24'),
      makeTick('2026-04-25'),
      makeTick('2026-04-26'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.currentStreak).toBe(3)
  })

  it('does not count days before a gap', () => {
    const ticks = [
      makeTick('2026-04-20'), // isolated
      makeTick('2026-04-26'),
      makeTick('2026-04-27'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.currentStreak).toBe(2)
  })

  it('treats multiple ticks on the same day as a single climbing day', () => {
    const ticks = [
      makeTick('2026-04-27', 'a'),
      makeTick('2026-04-27', 'b'),
      makeTick('2026-04-27', 'c'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.currentStreak).toBe(1)
    expect(stats.totalClimbingDays).toBe(1)
  })
})

describe('computeStreakStats — longest streak', () => {
  it('finds the longest historical run', () => {
    const ticks = [
      // 7-day run in February
      makeTick('2026-02-01'),
      makeTick('2026-02-02'),
      makeTick('2026-02-03'),
      makeTick('2026-02-04'),
      makeTick('2026-02-05'),
      makeTick('2026-02-06'),
      makeTick('2026-02-07'),
      // gap, then a 3-day run ending today
      makeTick('2026-04-25'),
      makeTick('2026-04-26'),
      makeTick('2026-04-27'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.longestStreak).toBe(7)
    expect(stats.currentStreak).toBe(3)
  })

  it('equals the current streak when current is the longest run', () => {
    const ticks = [
      makeTick('2026-04-25'),
      makeTick('2026-04-26'),
      makeTick('2026-04-27'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.longestStreak).toBe(3)
  })

  it('is 1 when no consecutive days exist', () => {
    const ticks = [makeTick('2026-04-01'), makeTick('2026-04-15'), makeTick('2026-04-27')]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.longestStreak).toBe(1)
  })
})

describe('computeStreakStats — totals & lastClimbedOn', () => {
  it('counts unique climbing days and reports last date', () => {
    const ticks = [
      makeTick('2026-04-01'),
      makeTick('2026-04-02'),
      makeTick('2026-04-02', 'dup'), // same day, different tick
      makeTick('2026-04-15'),
    ]
    const stats = computeStreakStats(ticks, TODAY)
    expect(stats.totalClimbingDays).toBe(3)
    expect(stats.lastClimbedOn).toBe('2026-04-15')
  })
})

describe('computeActivityCalendar', () => {
  it('emits 7 cells per week for the last N weeks (truncated at today)', () => {
    const cells = computeActivityCalendar([], 4, TODAY)
    // 4 weeks * 7 days = 28 cells, but ends at TODAY (Mon 2026-04-27)
    // so the last week has 1 cell only (Monday)
    // Total: 3 full weeks (21) + 1 cell = 22
    expect(cells.length).toBe(22)
    // First cell is the Monday 3 weeks before this Monday
    expect(cells[0].date).toBe('2026-04-06')
    expect(cells[cells.length - 1].date).toBe('2026-04-27')
  })

  it('counts ticks per day correctly', () => {
    const ticks = [
      makeTick('2026-04-26', 'a'),
      makeTick('2026-04-26', 'b'),
      makeTick('2026-04-27', 'c'),
    ]
    // Use 2 weeks so the previous Monday (2026-04-20) is in the window
    // and 2026-04-26 (Sunday of last week) is included.
    const cells = computeActivityCalendar(ticks, 2, TODAY)
    const apr26 = cells.find((c) => c.date === '2026-04-26')
    const apr27 = cells.find((c) => c.date === '2026-04-27')
    const apr25 = cells.find((c) => c.date === '2026-04-25')
    expect(apr26?.count).toBe(2)
    expect(apr27?.count).toBe(1)
    expect(apr25?.count).toBe(0)
  })

  it('does not include cells in the future', () => {
    const cells = computeActivityCalendar([], 1, TODAY)
    for (const cell of cells) {
      expect(cell.date <= '2026-04-27').toBe(true)
    }
  })

  it('returns empty when weeks=0', () => {
    expect(computeActivityCalendar([], 0, TODAY)).toEqual([])
  })

  it('starts each week on Monday', () => {
    const cells = computeActivityCalendar([], 2, TODAY)
    // The first cell should be a Monday
    const firstDate = new Date(cells[0].date)
    expect(firstDate.getDay()).toBe(1) // Monday
  })
})

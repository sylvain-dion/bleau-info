/**
 * Climbing day streaks & activity calendar (Story 14.2).
 *
 * A "climbing day" is a calendar day (YYYY-MM-DD in local time) where the
 * user logged at least one tick. Streaks count consecutive climbing days.
 *
 * The current streak is anchored to either today or yesterday — a streak
 * doesn't "break" the moment midnight passes. It only breaks if the user
 * has skipped one or more full calendar days since their last climb.
 */

import type { Tick } from '@/lib/validations/tick'

/** Number of milliseconds in one day. */
const MS_PER_DAY = 86_400_000

export interface StreakStats {
  /** Currently active streak ending today or yesterday. 0 if broken. */
  currentStreak: number
  /** Longest streak ever achieved (in days). */
  longestStreak: number
  /** Total number of unique climbing days. */
  totalClimbingDays: number
  /** ISO date (YYYY-MM-DD) of the last climbing day, or null. */
  lastClimbedOn: string | null
}

export interface CalendarCell {
  /** YYYY-MM-DD */
  date: string
  /** Number of ticks logged on that day (0 if not climbed) */
  count: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Date to its YYYY-MM-DD representation in local time.
 * Avoids the off-by-one bug from `toISOString()` when the user is east of UTC.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse a YYYY-MM-DD string back to a Date at local midnight. */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Diff between two dateKeys in whole days (a - b).
 * Both keys are interpreted at local midnight.
 */
function dayDiff(a: string, b: string): number {
  return Math.round((parseDateKey(a).getTime() - parseDateKey(b).getTime()) / MS_PER_DAY)
}

/** Build the sorted ascending list of unique date keys from tick.tickDate. */
function uniqueClimbDays(ticks: Tick[]): string[] {
  return Array.from(new Set(ticks.map((t) => t.tickDate))).sort()
}

// ---------------------------------------------------------------------------
// Streak computation
// ---------------------------------------------------------------------------

/**
 * Walk the unique climbing days and find the longest run of consecutive days.
 */
function computeLongestStreak(days: string[]): number {
  if (days.length === 0) return 0

  let longest = 1
  let current = 1
  for (let i = 1; i < days.length; i++) {
    if (dayDiff(days[i], days[i - 1]) === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}

/**
 * Current streak ending at today or yesterday. Returns 0 if the user
 * hasn't climbed in the last 2 calendar days (a one-day grace period
 * to avoid appearing broken in the morning before that day's climb).
 */
function computeCurrentStreak(days: string[], todayKey: string): number {
  if (days.length === 0) return 0

  const last = days[days.length - 1]
  const gap = dayDiff(todayKey, last)
  if (gap > 1) return 0

  let streak = 1
  for (let i = days.length - 2; i >= 0; i--) {
    if (dayDiff(days[i + 1], days[i]) === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Compute streak statistics from a tick list.
 * Pass `today` to make tests deterministic; defaults to `new Date()`.
 */
export function computeStreakStats(
  ticks: Tick[],
  today: Date = new Date(),
): StreakStats {
  const days = uniqueClimbDays(ticks)
  if (days.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalClimbingDays: 0,
      lastClimbedOn: null,
    }
  }

  const todayKey = toLocalDateKey(today)
  return {
    currentStreak: computeCurrentStreak(days, todayKey),
    longestStreak: computeLongestStreak(days),
    totalClimbingDays: days.length,
    lastClimbedOn: days[days.length - 1],
  }
}

// ---------------------------------------------------------------------------
// Activity calendar
// ---------------------------------------------------------------------------

/**
 * Build a contribution-graph-style calendar of the last `weeks` weeks
 * ending on the week containing `today`.
 *
 * Returns one cell per day in chronological order. A consumer can chunk
 * the result by 7 to obtain weekly columns. The first cell is the start
 * of the oldest week (Monday); the last is `today`.
 */
export function computeActivityCalendar(
  ticks: Tick[],
  weeks: number = 12,
  today: Date = new Date(),
): CalendarCell[] {
  const counts = new Map<string, number>()
  for (const tick of ticks) {
    counts.set(tick.tickDate, (counts.get(tick.tickDate) ?? 0) + 1)
  }

  // Find the Monday of the week containing `today`.
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Monday=0..Sunday=6
  const dayOfWeek = (todayLocal.getDay() + 6) % 7
  const thisMonday = new Date(todayLocal)
  thisMonday.setDate(thisMonday.getDate() - dayOfWeek)

  // Start = Monday of the oldest week in the window
  const start = new Date(thisMonday)
  start.setDate(start.getDate() - (weeks - 1) * 7)

  const cells: CalendarCell[] = []
  const totalDays = weeks * 7
  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    if (day > today) break // don't emit future cells
    const key = toLocalDateKey(day)
    cells.push({ date: key, count: counts.get(key) ?? 0 })
  }
  return cells
}

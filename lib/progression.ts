/**
 * Personal records and grade progression timeline (Story 14.6).
 *
 * Two pure compute functions over the tick list:
 *
 *  1. `computePersonalRecords` — for each major tier (4a, 5a, 6a, 7a, 8a),
 *     finds the earliest tick that broke into that tier. This is the
 *     emotional "first 6a !" moment, distinct from the analytical
 *     grade-distribution chart on /statistiques.
 *
 *  2. `computeMaxGradeTimeline` — for each of the last N calendar
 *     months (local tz), the highest grade climbed. Drives the
 *     sparkline displayed under the records list.
 */

import type { Tick } from '@/lib/validations/tick'
import { GRADE_SCALE, getGradeIndex, type Grade } from '@/lib/grades'
import { toLocalDateKey } from '@/lib/streaks'

/** Tier breakthroughs we celebrate as personal records. */
export const RECORD_TIERS: readonly Grade[] = ['4a', '5a', '6a', '7a', '8a']

export interface PersonalRecord {
  /** Threshold grade for this tier (e.g. "6a"). */
  tier: Grade
  /** Display label (e.g. "Premier 6ᵉ degré"). */
  label: string
  /** ISO YYYY-MM-DD when the tier was first crossed. */
  tickDate: string
  /** The grade actually climbed that day (could be `tier` or higher). */
  grade: string
  /** Boulder id of the breakthrough ascent. */
  boulderId: string
  /** Boulder display name. */
  boulderName: string
}

export interface MaxGradeMonth {
  /** YYYY-MM in local time. */
  month: string
  /** French short label, e.g. "avr. 2026". */
  label: string
  /** Highest grade climbed that month, or null when no ticks. */
  maxGrade: string | null
  /** Grade scale index of `maxGrade`, or -1 when null. */
  maxGradeIndex: number
}

const TIER_LABELS: Record<Grade, string> = {
  '3a': '',
  '3b': '',
  '3c': '',
  '4a': 'Premier 4ᵉ degré',
  '4b': '',
  '4c': '',
  '5a': 'Premier 5ᵉ degré',
  '5b': '',
  '5c': '',
  '6a': 'Premier 6ᵉ degré',
  '6a+': '',
  '6b': '',
  '6b+': '',
  '6c': '',
  '6c+': '',
  '7a': 'Premier 7ᵉ degré',
  '7a+': '',
  '7b': '',
  '7b+': '',
  '7c': '',
  '7c+': '',
  '8a': 'Premier 8ᵉ degré',
  '8a+': '',
  '8b': '',
  '8b+': '',
  '8c': '',
}

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

/**
 * Return the earliest tick that broke into each tier. Tiers with no
 * qualifying tick are omitted — the UI shows what's been achieved,
 * not what's still locked (badges already cover that angle).
 *
 * Output is sorted by tier index ascending (4a → 8a).
 */
export function computePersonalRecords(ticks: Tick[]): PersonalRecord[] {
  if (ticks.length === 0) return []

  // Sort ascending by tickDate, then createdAt as tiebreaker.
  const sorted = [...ticks].sort((a, b) => {
    if (a.tickDate !== b.tickDate) return a.tickDate < b.tickDate ? -1 : 1
    return a.createdAt < b.createdAt ? -1 : 1
  })

  const records: PersonalRecord[] = []
  for (const tier of RECORD_TIERS) {
    const tierIdx = getGradeIndex(tier)
    if (tierIdx < 0) continue
    const breakthrough = sorted.find(
      (t) => getGradeIndex(t.boulderGrade) >= tierIdx,
    )
    if (!breakthrough) continue
    records.push({
      tier,
      label: TIER_LABELS[tier] || `Premier ${tier.toUpperCase()}`,
      tickDate: breakthrough.tickDate,
      grade: breakthrough.boulderGrade,
      boulderId: breakthrough.boulderId,
      boulderName: breakthrough.boulderName,
    })
  }
  return records
}

// ---------------------------------------------------------------------------
// Max-grade timeline (sparkline data)
// ---------------------------------------------------------------------------

/**
 * Return the last `months` calendar months (oldest first) with the
 * highest grade climbed in each. Empty months produce `maxGrade: null`
 * and `maxGradeIndex: -1` so the sparkline can break the line cleanly.
 *
 * Anchors on `today` (defaults to `new Date()`) for testability.
 */
export function computeMaxGradeTimeline(
  ticks: Tick[],
  months: number = 12,
  today: Date = new Date(),
): MaxGradeMonth[] {
  if (months <= 0) return []

  // Index ticks by YYYY-MM, tracking the max grade encountered.
  const maxByMonth = new Map<string, { grade: string; index: number }>()
  for (const tick of ticks) {
    const month = tick.tickDate.slice(0, 7)
    const idx = getGradeIndex(tick.boulderGrade)
    if (idx < 0) continue
    const current = maxByMonth.get(month)
    if (!current || idx > current.index) {
      maxByMonth.set(month, { grade: tick.boulderGrade, index: idx })
    }
  }

  // Build the rolling window of `months` months ending at `today`.
  const out: MaxGradeMonth[] = []
  const anchor = new Date(today.getFullYear(), today.getMonth(), 1)
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = maxByMonth.get(month)
    out.push({
      month,
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      maxGrade: entry ? entry.grade : null,
      maxGradeIndex: entry ? entry.index : -1,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Helpers exported for tests / UI
// ---------------------------------------------------------------------------

/** Highest grade ever climbed across the ticks, or null. */
export function highestEverGrade(ticks: Tick[]): string | null {
  let best = -1
  let label: string | null = null
  for (const t of ticks) {
    const idx = getGradeIndex(t.boulderGrade)
    if (idx > best) {
      best = idx
      label = t.boulderGrade
    }
  }
  return label
}

/**
 * Format an ISO YYYY-MM-DD as a short French phrase relative to
 * today (e.g. "il y a 3 j" / "il y a 2 mois" / "12 avr.").
 *
 * Anchored on `now` for deterministic tests. Uses the same local-tz
 * key utility as the streak/calendar code so days line up exactly.
 */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  const then = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round(
    (today.getTime() - then.getTime()) / 86_400_000,
  )

  if (diffDays <= 0) return "aujourd'hui"
  if (diffDays === 1) return 'hier'
  if (diffDays < 7) return `il y a ${diffDays} j`
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`
  return then.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Silence the unused-import warning if tree-shaken — kept for potential
// future use when reusing the local-tz helper for month boundaries.
void toLocalDateKey
void GRADE_SCALE

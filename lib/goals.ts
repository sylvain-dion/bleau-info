/**
 * Personal climbing goals (Story 14.3).
 *
 * Goals turn aggregate stats into user-set targets with live progress.
 * They share the same input shape as `BadgeInput` so the same source of
 * truth (computed from the tick store + circuit completions + streaks)
 * drives both badges and goals.
 *
 * A goal has a target value, an optional deadline, and is computed
 * against the current `BadgeInput`. Grade goals use the
 * `getGradeIndex` ladder so "6c+" satisfies a "≥ 6a" target.
 *
 * Goals are local-first: the store persists them with Zustand. No
 * backend round-trip — they unlock the moment the underlying stat
 * crosses the target.
 */

import { GRADE_SCALE, getGradeIndex, formatGrade } from '@/lib/grades'
import type { BadgeInput } from '@/lib/badges'

export type GoalType =
  | 'tickCount'
  | 'uniqueBoulders'
  | 'sectorsVisited'
  | 'circuitsCompleted'
  | 'longestStreak'
  | 'maxGrade'

export type GoalStatus = 'active' | 'achieved' | 'expired'

export interface Goal {
  id: string
  type: GoalType
  /**
   * Target value:
   * - number for count-based goals (tickCount, uniqueBoulders, etc.)
   * - grade string (e.g. '7a') for `maxGrade`
   */
  target: number | string
  /** ISO date (YYYY-MM-DD) the user wants to hit the target by, or null */
  deadline: string | null
  /** ISO timestamp when the goal was created */
  createdAt: string
  /** ISO timestamp when achieved, null if still pending */
  achievedAt: string | null
}

export interface GoalProgress {
  goal: Goal
  /** Numeric current value used for the progress ratio. */
  currentNumeric: number
  /** Numeric target used for the progress ratio. */
  targetNumeric: number
  /** Human-readable current value (e.g. "47" or "6c+"). */
  currentDisplay: string
  /** Human-readable target value (e.g. "100" or "7A"). */
  targetDisplay: string
  /** 0..1 (clamped). 1 means achieved (or beyond). */
  progress: number
  /** True when current ≥ target. */
  isAchieved: boolean
  /** Days remaining until the deadline; negative when past, null when no deadline. */
  daysRemaining: number | null
  /** Effective lifecycle status — 'active' | 'achieved' | 'expired'. */
  status: GoalStatus
}

// ---------------------------------------------------------------------------
// Catalog metadata (used by the UI)
// ---------------------------------------------------------------------------

export interface GoalTypeMeta {
  type: GoalType
  label: string
  unit: string
  /** Whether the target is a number or a grade string. */
  shape: 'number' | 'grade'
  /** Lucide icon name — resolved client-side. */
  icon: 'Star' | 'Award' | 'Map' | 'Route' | 'Flame' | 'Mountain'
  /** Tailwind text color class. */
  color: string
}

export const GOAL_TYPES: readonly GoalTypeMeta[] = [
  {
    type: 'tickCount',
    label: 'Nombre de croix',
    unit: 'croix',
    shape: 'number',
    icon: 'Star',
    color: 'text-emerald-500',
  },
  {
    type: 'uniqueBoulders',
    label: 'Blocs uniques',
    unit: 'blocs',
    shape: 'number',
    icon: 'Award',
    color: 'text-purple-500',
  },
  {
    type: 'sectorsVisited',
    label: 'Secteurs visités',
    unit: 'secteurs',
    shape: 'number',
    icon: 'Map',
    color: 'text-blue-500',
  },
  {
    type: 'circuitsCompleted',
    label: 'Circuits terminés',
    unit: 'circuits',
    shape: 'number',
    icon: 'Route',
    color: 'text-orange-500',
  },
  {
    type: 'longestStreak',
    label: 'Streak de jours',
    unit: 'jours',
    shape: 'number',
    icon: 'Flame',
    color: 'text-orange-600',
  },
  {
    type: 'maxGrade',
    label: 'Niveau max',
    unit: '',
    shape: 'grade',
    icon: 'Mountain',
    color: 'text-sky-500',
  },
] as const

const GOAL_TYPE_INDEX = new Map<GoalType, GoalTypeMeta>(
  GOAL_TYPES.map((g) => [g.type, g]),
)

export function getGoalTypeMeta(type: GoalType): GoalTypeMeta {
  const meta = GOAL_TYPE_INDEX.get(type)
  if (!meta) throw new Error(`Unknown goal type: ${type}`)
  return meta
}

// ---------------------------------------------------------------------------
// Progress computation
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000

/**
 * Compute progress for a single goal against the current stats input.
 *
 * Numeric goals: progress = current / target (clamped to [0, 1]).
 * Grade goals: progress is based on grade indices on the canonical scale.
 *
 * Status logic:
 * - "achieved" if current ≥ target (regardless of deadline)
 * - "expired" if not achieved AND deadline is in the past
 * - "active" otherwise
 *
 * The `achievedAt` field on the goal takes priority — a goal once
 * achieved stays achieved even if stats later regress (defensive).
 */
export function computeGoalProgress(
  goal: Goal,
  input: BadgeInput,
  today: Date = new Date(),
): GoalProgress {
  const { currentNumeric, targetNumeric, currentDisplay, targetDisplay } =
    extractValues(goal, input)

  const ratio =
    targetNumeric > 0 ? currentNumeric / targetNumeric : currentNumeric > 0 ? 1 : 0
  const progress = Math.max(0, Math.min(1, ratio))
  const isAchieved = goal.achievedAt !== null || currentNumeric >= targetNumeric

  const daysRemaining = computeDaysRemaining(goal.deadline, today)
  const status: GoalStatus = isAchieved
    ? 'achieved'
    : daysRemaining !== null && daysRemaining < 0
      ? 'expired'
      : 'active'

  return {
    goal,
    currentNumeric,
    targetNumeric,
    currentDisplay,
    targetDisplay,
    progress,
    isAchieved,
    daysRemaining,
    status,
  }
}

function extractValues(
  goal: Goal,
  input: BadgeInput,
): {
  currentNumeric: number
  targetNumeric: number
  currentDisplay: string
  targetDisplay: string
} {
  if (goal.type === 'maxGrade') {
    const target = String(goal.target)
    const targetIdx = getGradeIndex(target)
    const currentIdx = getGradeIndex(input.maxGrade)
    return {
      currentNumeric: Math.max(0, currentIdx),
      targetNumeric: Math.max(0, targetIdx),
      currentDisplay: input.maxGrade ? formatGrade(input.maxGrade) : '—',
      targetDisplay: targetIdx >= 0 ? formatGrade(target) : target,
    }
  }

  const numericTarget = Number(goal.target)
  const numericCurrent = numericFor(goal.type, input)
  return {
    currentNumeric: numericCurrent,
    targetNumeric: numericTarget,
    currentDisplay: String(numericCurrent),
    targetDisplay: String(numericTarget),
  }
}

function numericFor(type: GoalType, input: BadgeInput): number {
  switch (type) {
    case 'tickCount':
      return input.tickCount
    case 'uniqueBoulders':
      return input.uniqueBoulders
    case 'sectorsVisited':
      return input.sectorsVisited
    case 'circuitsCompleted':
      return input.circuitsCompleted
    case 'longestStreak':
      return input.longestStreak ?? 0
    case 'maxGrade':
      // Handled by extractValues; never reached for sensible inputs.
      return getGradeIndex(input.maxGrade)
  }
}

/** Days between today (start-of-day) and the deadline; null when no deadline. */
function computeDaysRemaining(
  deadline: string | null,
  today: Date,
): number | null {
  if (!deadline) return null
  const [y, m, d] = deadline.split('-').map(Number)
  if (!y || !m || !d) return null

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const deadlineMidnight = new Date(y, m - 1, d)
  return Math.round(
    (deadlineMidnight.getTime() - todayMidnight.getTime()) / MS_PER_DAY,
  )
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

/**
 * Suggest 3-5 reasonable next-step goals based on current stats.
 *
 * The selection picks the next milestone above each metric so a user
 * who hasn't logged anything sees beginner-friendly targets, while
 * experienced users see ambitious ones.
 */
export function suggestGoals(input: BadgeInput): Array<{
  type: GoalType
  target: number | string
  reason: string
}> {
  const out: Array<{ type: GoalType; target: number | string; reason: string }> = []

  const tickTarget = nextNumericMilestone(input.tickCount, [10, 25, 50, 100, 250, 500])
  if (tickTarget !== null) {
    out.push({
      type: 'tickCount',
      target: tickTarget,
      reason: `Vous êtes à ${input.tickCount} croix`,
    })
  }

  const sectorTarget = nextNumericMilestone(input.sectorsVisited, [3, 6, 10, 15])
  if (sectorTarget !== null) {
    out.push({
      type: 'sectorsVisited',
      target: sectorTarget,
      reason: `${input.sectorsVisited} secteurs visités jusqu'ici`,
    })
  }

  const circuitTarget = nextNumericMilestone(input.circuitsCompleted, [1, 3, 5, 10])
  if (circuitTarget !== null) {
    out.push({
      type: 'circuitsCompleted',
      target: circuitTarget,
      reason: `${input.circuitsCompleted} circuits terminés`,
    })
  }

  const streak = input.longestStreak ?? 0
  const streakTarget = nextNumericMilestone(streak, [3, 7, 14, 30])
  if (streakTarget !== null) {
    out.push({
      type: 'longestStreak',
      target: streakTarget,
      reason: `Record actuel : ${streak} jour${streak > 1 ? 's' : ''}`,
    })
  }

  const gradeTarget = nextGradeMilestone(input.maxGrade)
  if (gradeTarget !== null) {
    out.push({
      type: 'maxGrade',
      target: gradeTarget,
      reason: input.maxGrade
        ? `Niveau max : ${formatGrade(input.maxGrade)}`
        : 'Premier objectif de niveau',
    })
  }

  return out.slice(0, 5)
}

function nextNumericMilestone(current: number, ladder: number[]): number | null {
  for (const m of ladder) {
    if (m > current) return m
  }
  return null
}

/** Next "round" grade above the current one on the canonical scale. */
function nextGradeMilestone(currentGrade: string): string | null {
  const idx = getGradeIndex(currentGrade)
  // Round-grade milestones (entry of each degree)
  const milestones = ['5a', '6a', '6b', '6c', '7a', '7b', '7c', '8a']
  for (const g of milestones) {
    if (getGradeIndex(g) > idx) return g
  }
  return null
}

// ---------------------------------------------------------------------------
// Validation helpers (used by the add-goal form)
// ---------------------------------------------------------------------------

/**
 * Sanity-check a target value. Returns null if valid, otherwise an
 * error message in French suitable for display under the input.
 */
export function validateGoalTarget(
  type: GoalType,
  target: string,
): string | null {
  if (target.trim() === '') return 'Définissez une cible'

  if (getGoalTypeMeta(type).shape === 'grade') {
    if (getGradeIndex(target) === -1) {
      return 'Niveau invalide'
    }
    return null
  }

  const n = Number(target)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 'Entrez un entier'
  if (n <= 0) return 'La cible doit être positive'
  if (n > 100_000) return 'Cible trop élevée'
  return null
}

/** All grade strings in ascending order (re-exported for the UI). */
export const GOAL_GRADE_OPTIONS = GRADE_SCALE

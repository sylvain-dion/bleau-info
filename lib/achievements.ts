/**
 * Achievement detection (Story 14.4).
 *
 * Pure functions that diff "what the user has earned" against
 * "what we've already shown them" and return a list of new
 * `AchievementEvent`s to celebrate.
 *
 * The detector is intentionally stateless: state lives in the
 * achievements store (`seenBadgeIds`, `seenStreakMilestones`,
 * `seenGoalIds`). The hook calls these detectors and dispatches
 * the resulting events to the celebration overlay + log.
 *
 * Three event sources:
 *  1. Badges — any badge that is now `earned: true` and whose id
 *     isn't in `seenBadgeIds`.
 *  2. Streak milestones — when `currentStreak` (or `longestStreak`)
 *     crosses a threshold (3, 7, 14, 30, 60, 100, 200, 365 days).
 *  3. Goals — IDs returned by the goals store's `reconcileAchievements`
 *     that haven't been celebrated yet.
 */

import type { BadgeStatus, BadgeDefinition } from '@/lib/badges'
import type { Goal } from '@/lib/goals'
import { getGoalTypeMeta } from '@/lib/goals'
import { formatGrade } from '@/lib/grades'

export type AchievementKind = 'badge' | 'streak' | 'goal'

export interface AchievementEvent {
  /** Stable id used to dedupe + key the celebration log. */
  id: string
  kind: AchievementKind
  /** Human-readable title (e.g. "Centurion", "7 jours d'affilée"). */
  title: string
  /** Short description (e.g. "100 croix"). */
  subtitle: string
  /** Lucide icon name from the curated subset. */
  icon: BadgeDefinition['icon']
  /** Tailwind text-color class. */
  color: string
  /** ISO timestamp when the event was minted. */
  earnedAt: string
}

/** Streak day-counts that warrant a celebration. */
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 60, 100, 200, 365]

// ---------------------------------------------------------------------------
// Badge detector
// ---------------------------------------------------------------------------

/**
 * Diff the current badge list against seen ids.
 * Returns events for newly-earned badges in catalog order.
 */
export function detectNewBadgeAchievements(
  badges: BadgeStatus[],
  seenBadgeIds: readonly string[],
  now: Date = new Date(),
): AchievementEvent[] {
  const seen = new Set(seenBadgeIds)
  const out: AchievementEvent[] = []
  const earnedAt = now.toISOString()

  for (const badge of badges) {
    if (!badge.earned) continue
    if (seen.has(badge.definition.id)) continue
    out.push({
      id: `badge:${badge.definition.id}`,
      kind: 'badge',
      title: badge.definition.label,
      subtitle: badge.definition.description,
      icon: badge.definition.icon,
      color: badge.definition.color,
      earnedAt,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Streak detector
// ---------------------------------------------------------------------------

/**
 * Detect newly-crossed streak milestones.
 *
 * Compares `longestStreak` against `seenStreakMilestones`. Every
 * milestone <= longestStreak that hasn't been seen yet emits an event.
 * This handles "user came back after a long pause" — they get every
 * milestone they passed even if we never saw them happen live.
 */
export function detectNewStreakAchievements(
  longestStreak: number,
  seenStreakMilestones: readonly number[],
  now: Date = new Date(),
): AchievementEvent[] {
  const seen = new Set(seenStreakMilestones)
  const out: AchievementEvent[] = []
  const earnedAt = now.toISOString()

  for (const m of STREAK_MILESTONES) {
    if (m > longestStreak) break
    if (seen.has(m)) continue
    out.push({
      id: `streak:${m}`,
      kind: 'streak',
      title: streakTitle(m),
      subtitle: `${m} jours consécutifs`,
      icon: 'Flame',
      color: streakColor(m),
      earnedAt,
    })
  }
  return out
}

function streakTitle(days: number): string {
  if (days >= 365) return 'Une année entière'
  if (days >= 100) return `${days} jours sans pause`
  if (days >= 30) return 'Un mois marathon'
  if (days >= 14) return 'Deux semaines de feu'
  if (days >= 7) return 'Une semaine de feu'
  return 'En forme'
}

function streakColor(days: number): string {
  if (days >= 30) return 'text-red-600'
  if (days >= 7) return 'text-orange-600'
  return 'text-orange-500'
}

// ---------------------------------------------------------------------------
// Goal detector
// ---------------------------------------------------------------------------

/**
 * Build celebration events for goals that were just achieved.
 *
 * Caller passes the list of goal ids returned by the goals store's
 * `reconcileAchievements`, plus the current goals list to look up
 * metadata. Filters anything already in `seenGoalIds` so duplicate
 * mounts don't double-celebrate.
 */
export function detectNewGoalAchievements(
  newlyAchievedIds: readonly string[],
  goals: readonly Goal[],
  seenGoalIds: readonly string[],
  now: Date = new Date(),
): AchievementEvent[] {
  const seen = new Set(seenGoalIds)
  const out: AchievementEvent[] = []
  const earnedAt = now.toISOString()
  const byId = new Map(goals.map((g) => [g.id, g]))

  for (const id of newlyAchievedIds) {
    if (seen.has(id)) continue
    const goal = byId.get(id)
    if (!goal) continue

    const meta = getGoalTypeMeta(goal.type)
    const targetLabel =
      meta.shape === 'grade'
        ? formatGrade(String(goal.target))
        : `${goal.target}${meta.unit ? ` ${meta.unit}` : ''}`

    out.push({
      id: `goal:${id}`,
      kind: 'goal',
      title: 'Objectif atteint !',
      subtitle: `${meta.label} — ${targetLabel}`,
      icon: meta.icon === 'Star' ? 'Star' : meta.icon === 'Mountain' ? 'Mountain' : 'Trophy',
      color: meta.color,
      earnedAt,
    })
  }
  return out
}

/**
 * Social sharing for personal achievements (Story 14.5).
 *
 * Generates Web Share API payloads for:
 *  - Earned badges (volume, grade, diversity, explore, circuit, style, streak)
 *  - Active climbing streaks
 *  - Achieved personal goals
 *  - Generic AchievementEvent (used by the celebration overlay)
 *
 * No backend dependency: the URL points at the app root rather than
 * a per-user public profile. The text is the content; the URL is just
 * a "join me on Bleau.info" prompt.
 *
 * The `formatGrade`-aware logic lives in `lib/grades.ts`. We only
 * touch it for grade-shaped goals.
 */

import { formatGrade } from '@/lib/grades'
import type { EarnedBadge, BadgeStatus } from '@/lib/badges'
import type { StreakStats } from '@/lib/streaks'
import type { Goal, GoalProgress } from '@/lib/goals'
import { getGoalTypeMeta } from '@/lib/goals'
import type { AchievementEvent } from '@/lib/achievements'

/** Web Share API payload shape (also used as clipboard text source). */
export interface AchievementShare {
  /** Short title — used by `navigator.share` `title` field. */
  title: string
  /** Full multi-line body used for social posts and clipboard fallback. */
  text: string
  /** Destination URL appended at the end of `text`. */
  url: string
}

const APP_NAME = 'Bleau.info'
const APP_TAGLINE = 'Le topo Fontainebleau de poche'

/**
 * Resolve the absolute URL for the share target.
 *
 * On the client this is `window.location.origin` so dev / staging
 * builds keep working; on the server (or during tests) we fall back
 * to the production origin.
 */
export function getShareOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://bleau.info'
}

/**
 * Type guard for `EarnedBadge` — narrows from the union returned
 * by `computeBadges`. Only earned badges are shareable.
 */
export function isEarnedBadge(badge: BadgeStatus): badge is EarnedBadge {
  return badge.earned === true
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

/**
 * Build a share payload for an earned badge. Locked badges are not
 * shareable and the caller should gate the button on `isEarnedBadge`.
 */
export function buildBadgeShare(badge: EarnedBadge): AchievementShare {
  const url = getShareOrigin()
  const title = `Badge ${badge.definition.label} débloqué`
  const text = [
    `🏆 Badge ${badge.definition.label} débloqué !`,
    badge.definition.description,
    '',
    `📱 ${APP_NAME} — ${APP_TAGLINE}`,
    url,
  ].join('\n')
  return { title, text, url }
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

/**
 * Build a share payload for the user's current streak. Returns null
 * when the streak is too short to be worth sharing (< 3 days).
 */
export function buildStreakShare(stats: StreakStats): AchievementShare | null {
  if (stats.currentStreak < 3) return null
  const url = getShareOrigin()
  const days = stats.currentStreak
  const dayWord = days > 1 ? 'jours' : 'jour'
  const title = `${days} ${dayWord} d'affilée à Fontainebleau`
  const text = [
    `🔥 ${days} ${dayWord} d'affilée à Fontainebleau !`,
    streakFlavor(days),
    '',
    `📱 ${APP_NAME} — ${APP_TAGLINE}`,
    url,
  ].join('\n')
  return { title, text, url }
}

function streakFlavor(days: number): string {
  if (days >= 365) return 'Une année entière de grimpe.'
  if (days >= 100) return 'Plus de 100 jours sans pause.'
  if (days >= 30) return 'Un mois de grimpe non-stop.'
  if (days >= 14) return 'Deux semaines de feu.'
  if (days >= 7) return 'Une semaine de feu.'
  return 'Et ça continue.'
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

/**
 * Build a share payload for an achieved goal. Returns null when the
 * goal hasn't crossed the line yet — only achieved goals are shareable.
 */
export function buildGoalShare(progress: GoalProgress): AchievementShare | null {
  if (!progress.isAchieved) return null
  return buildShareForGoal(progress.goal)
}

function buildShareForGoal(goal: Goal): AchievementShare {
  const meta = getGoalTypeMeta(goal.type)
  const targetLabel =
    meta.shape === 'grade'
      ? formatGrade(String(goal.target))
      : `${goal.target}${meta.unit ? ` ${meta.unit}` : ''}`

  const url = getShareOrigin()
  const title = `Objectif atteint — ${meta.label}`
  const text = [
    '🎯 Objectif atteint !',
    `${meta.label} : ${targetLabel}`,
    '',
    `📱 ${APP_NAME} — ${APP_TAGLINE}`,
    url,
  ].join('\n')
  return { title, text, url }
}

// ---------------------------------------------------------------------------
// Generic achievement event (celebration overlay)
// ---------------------------------------------------------------------------

const EVENT_HEADERS: Record<AchievementEvent['kind'], string> = {
  badge: '🏆 Badge débloqué !',
  streak: '🔥 Streak atteint !',
  goal: '🎯 Objectif atteint !',
}

/**
 * Build a share payload from a generic `AchievementEvent`.
 *
 * Used by the celebration overlay where we don't have the original
 * domain object on hand — only the event shape stored in the queue.
 */
export function buildAchievementShare(
  event: AchievementEvent,
): AchievementShare {
  const url = getShareOrigin()
  const title = `${event.title} — ${APP_NAME}`
  const text = [
    EVENT_HEADERS[event.kind],
    event.title,
    event.subtitle,
    '',
    `📱 ${APP_NAME} — ${APP_TAGLINE}`,
    url,
  ].join('\n')
  return { title, text, url }
}

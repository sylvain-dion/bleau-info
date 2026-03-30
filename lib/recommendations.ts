/**
 * Personalized boulder recommendation engine (Story 12.2).
 *
 * Content-based filtering: scores boulders against a climber profile
 * built from their tick history. Runs entirely client-side for offline support.
 *
 * Scoring weights: grade (40%) + style (30%) + popularity (20%) + novelty (10%)
 */

import { getGradeIndex } from '@/lib/grades'
import { getMockPopularity } from '@/lib/popularity'
import type { Tick } from '@/lib/validations/tick'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendationReason = 'grade' | 'style' | 'popular'

export interface ClimberProfile {
  medianGradeIndex: number
  preferredStyles: Set<string>
  tickedBoulderIds: Set<string>
}

export interface BoulderRecommendation {
  boulder: BoulderListItem
  score: number
  primaryReason: RecommendationReason
  reasons: RecommendationReason[]
}

// ---------------------------------------------------------------------------
// Profile builder
// ---------------------------------------------------------------------------

const MIN_TICKS_FOR_PROFILE = 5
const STYLE_THRESHOLD = 0.3

/**
 * Build a climber profile from tick history.
 * Returns null if fewer than 5 ticks (not enough data).
 *
 * @param ticks          All user ticks (any order)
 * @param boulderStyleMap Map of boulderId → style for style deduction
 */
export function buildClimberProfile(
  ticks: Tick[],
  boulderStyleMap: Map<string, string>
): ClimberProfile | null {
  if (ticks.length < MIN_TICKS_FOR_PROFILE) return null

  // Median grade from the 5 most recent ticks (by tickDate descending)
  const sorted = [...ticks].sort(
    (a, b) => b.tickDate.localeCompare(a.tickDate)
  )
  const recentFive = sorted.slice(0, 5)
  const gradeIndices = recentFive
    .map((t) => getGradeIndex(t.boulderGrade))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b)

  const medianGradeIndex =
    gradeIndices.length > 0
      ? gradeIndices[Math.floor(gradeIndices.length / 2)]
      : 0

  // Preferred styles: styles representing ≥30% of all ticks
  const styleCounts = new Map<string, number>()
  for (const tick of ticks) {
    const style = boulderStyleMap.get(tick.boulderId)
    if (style) {
      styleCounts.set(style, (styleCounts.get(style) ?? 0) + 1)
    }
  }

  const preferredStyles = new Set<string>()
  const totalWithStyle = [...styleCounts.values()].reduce((a, b) => a + b, 0)
  if (totalWithStyle > 0) {
    for (const [style, count] of styleCounts) {
      if (count / totalWithStyle >= STYLE_THRESHOLD) {
        preferredStyles.add(style)
      }
    }
  }

  const tickedBoulderIds = new Set(ticks.map((t) => t.boulderId))

  return { medianGradeIndex, preferredStyles, tickedBoulderIds }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const GRADE_WEIGHT = 40
const STYLE_WEIGHT = 30
const POPULARITY_WEIGHT = 20
const NOVELTY_WEIGHT = 10
const GRADE_DECAY_STEPS = 3
const POPULARITY_CAP = 10

/**
 * Score a single boulder against a climber profile.
 */
export function scoreBoulder(
  boulder: BoulderListItem,
  profile: ClimberProfile,
  popularity: number
): { score: number; primaryReason: RecommendationReason; reasons: RecommendationReason[] } {
  const boulderGradeIdx = getGradeIndex(boulder.grade)

  // Grade match (40%): linear decay over 3 grade steps
  const gradeDiff =
    boulderGradeIdx >= 0
      ? Math.abs(boulderGradeIdx - profile.medianGradeIndex)
      : GRADE_DECAY_STEPS
  const gradeScore =
    GRADE_WEIGHT * Math.max(0, 1 - gradeDiff / GRADE_DECAY_STEPS)

  // Style match (30%): binary
  const styleScore = profile.preferredStyles.has(boulder.style)
    ? STYLE_WEIGHT
    : 0

  // Popularity (20%): capped linear
  const popularityScore =
    POPULARITY_WEIGHT * Math.min(1, popularity / POPULARITY_CAP)

  // Novelty (10%): always awarded (ticked boulders are pre-filtered)
  const noveltyScore = NOVELTY_WEIGHT

  const score = gradeScore + styleScore + popularityScore + noveltyScore

  // Build reasons
  const reasons: RecommendationReason[] = []
  if (gradeScore >= GRADE_WEIGHT * (1 - 1 / GRADE_DECAY_STEPS)) {
    reasons.push('grade')
  }
  if (styleScore > 0) reasons.push('style')
  if (popularityScore >= POPULARITY_WEIGHT * 0.5) reasons.push('popular')

  // Primary reason = highest contributing factor
  const scores: [RecommendationReason, number][] = [
    ['grade', gradeScore],
    ['style', styleScore],
    ['popular', popularityScore],
  ]
  scores.sort((a, b) => b[1] - a[1])
  const primaryReason = scores[0][1] > 0 ? scores[0][0] : 'grade'

  return { score, primaryReason, reasons }
}

// ---------------------------------------------------------------------------
// Main entry points
// ---------------------------------------------------------------------------

/**
 * Get personalized recommendations for a sector.
 * Returns empty array if user has fewer than 5 ticks.
 */
export function getRecommendations(
  boulders: BoulderListItem[],
  ticks: Tick[],
  maxResults = 5
): BoulderRecommendation[] {
  const boulderStyleMap = new Map(boulders.map((b) => [b.id, b.style]))
  const profile = buildClimberProfile(ticks, boulderStyleMap)
  if (!profile) return []

  const candidates = boulders.filter(
    (b) => !profile.tickedBoulderIds.has(b.id)
  )

  const scored: BoulderRecommendation[] = candidates.map((boulder) => {
    const popularity = getMockPopularity(boulder.id)
    const { score, primaryReason, reasons } = scoreBoulder(
      boulder,
      profile,
      popularity
    )
    return { boulder, score, primaryReason, reasons }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return getMockPopularity(b.boulder.id) - getMockPopularity(a.boulder.id)
  })

  return scored.slice(0, maxResults)
}

/**
 * Get popular boulders for users with fewer than 5 ticks.
 * Optionally filters by declared grade (±2 steps).
 */
export function getPopularBoulders(
  boulders: BoulderListItem[],
  ticks: Tick[],
  declaredGrade?: string | null,
  maxResults = 5
): BoulderListItem[] {
  const tickedIds = new Set(ticks.map((t) => t.boulderId))
  let candidates = boulders.filter((b) => !tickedIds.has(b.id))

  if (declaredGrade) {
    const targetIdx = getGradeIndex(declaredGrade)
    if (targetIdx >= 0) {
      candidates = candidates.filter((b) => {
        const idx = getGradeIndex(b.grade)
        return idx >= 0 && Math.abs(idx - targetIdx) <= 2
      })
    }
  }

  candidates.sort(
    (a, b) => getMockPopularity(b.id) - getMockPopularity(a.id)
  )

  return candidates.slice(0, maxResults)
}

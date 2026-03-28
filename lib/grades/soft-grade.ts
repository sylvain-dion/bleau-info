/**
 * Community soft-grade calculation.
 *
 * Computes the perceived grade consensus from ticks that include
 * a perceived grade. Uses median for robustness against outliers.
 */

import { GRADE_SCALE, getGradeIndex } from '@/lib/grades'
import type { Tick } from '@/lib/validations/tick'

/** Minimum votes to show community grade */
export const SOFT_GRADE_MIN_VOTES = 5

export interface SoftGradeResult {
  /** The consensus community grade (median) */
  grade: string
  /** Number of votes */
  voteCount: number
  /** Whether we have enough votes to display */
  hasConsensus: boolean
  /** Distribution: grade → count */
  distribution: Record<string, number>
  /** Difference from official: 'sous-coté' | 'sur-coté' | null */
  deviation: 'sous-coté' | 'sur-coté' | null
}

/**
 * Calculate community soft-grade from tick perceived grades.
 *
 * @param ticks All ticks for a boulder
 * @param officialGrade The boulder's official grade
 */
export function calculateSoftGrade(
  ticks: Tick[],
  officialGrade: string
): SoftGradeResult {
  const withGrade = ticks.filter(
    (t) => t.perceivedGrade && getGradeIndex(t.perceivedGrade) >= 0
  )

  const distribution: Record<string, number> = {}
  for (const t of withGrade) {
    const g = t.perceivedGrade!
    distribution[g] = (distribution[g] ?? 0) + 1
  }

  const voteCount = withGrade.length
  const hasConsensus = voteCount >= SOFT_GRADE_MIN_VOTES

  if (!hasConsensus) {
    return {
      grade: officialGrade,
      voteCount,
      hasConsensus: false,
      distribution,
      deviation: null,
    }
  }

  // Median calculation: sort perceived grades by index, pick middle
  const indices = withGrade
    .map((t) => getGradeIndex(t.perceivedGrade!))
    .sort((a, b) => a - b)

  const medianIdx = indices[Math.floor(indices.length / 2)]
  const grade = GRADE_SCALE[medianIdx] ?? officialGrade

  // Check deviation (more than half a grade = 1 index step)
  const officialIdx = getGradeIndex(officialGrade)
  const diff = medianIdx - officialIdx
  let deviation: 'sous-coté' | 'sur-coté' | null = null
  if (diff >= 1) deviation = 'sous-coté' // community thinks it's harder
  if (diff <= -1) deviation = 'sur-coté' // community thinks it's easier

  return { grade, voteCount, hasConsensus, distribution, deviation }
}

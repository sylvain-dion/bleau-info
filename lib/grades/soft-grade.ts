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

/** Minimum votes for "verified" reliability */
export const RELIABILITY_MIN_VOTES = 10

/** Max std dev (in grade steps) for "verified" */
export const VERIFIED_MAX_STD_DEV = 0.5

/** Min std dev (in grade steps) for "disputed" */
export const DISPUTED_MIN_STD_DEV = 1.0

export type GradeReliability = 'verified' | 'disputed' | null

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
  /** Standard deviation of votes in grade steps */
  stdDev: number
  /** Reliability classification (Story 12.5) */
  reliability: GradeReliability
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
      stdDev: 0,
      reliability: null,
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

  // Standard deviation in grade steps
  const mean = indices.reduce((a, b) => a + b, 0) / indices.length
  const variance =
    indices.reduce((sum, idx) => sum + (idx - mean) ** 2, 0) / indices.length
  const stdDev = Math.sqrt(variance)

  // Reliability classification
  let reliability: GradeReliability = null
  if (voteCount >= RELIABILITY_MIN_VOTES && stdDev < VERIFIED_MAX_STD_DEV) {
    reliability = 'verified'
  } else if (stdDev > DISPUTED_MIN_STD_DEV) {
    reliability = 'disputed'
  }

  return {
    grade,
    voteCount,
    hasConsensus,
    distribution,
    deviation,
    stdDev,
    reliability,
  }
}

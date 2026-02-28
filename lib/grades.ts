/**
 * French climbing grade parsing and comparison utilities.
 *
 * Fontainebleau uses the French bouldering scale:
 * 3a < 3b < 3c < 4a < 4b < 4c < 5a < 5b < 5c < 6a < 6a+ < 6b < 6b+ < 6c < 6c+ < 7a < 7a+ < 7b < 7b+ < 7c < 7c+ < 8a < 8a+ < 8b < 8b+ < 8c
 */

/** All recognized grades in ascending order */
export const GRADE_SCALE = [
  '3a', '3b', '3c',
  '4a', '4b', '4c',
  '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c',
] as const

export type Grade = (typeof GRADE_SCALE)[number]

/** Map grade string to its numeric index for comparison */
const gradeIndex = new Map<string, number>(
  GRADE_SCALE.map((g, i) => [g, i])
)

/** Get numeric index of a grade for comparison. Returns -1 for unknown grades. */
export function getGradeIndex(grade: string): number {
  return gradeIndex.get(grade.toLowerCase()) ?? -1
}

/** Check if a grade falls within a min/max range (inclusive). */
export function isGradeInRange(grade: string, min: Grade | null, max: Grade | null): boolean {
  const idx = getGradeIndex(grade)
  if (idx === -1) return true // Unknown grades are always shown

  if (min !== null) {
    const minIdx = getGradeIndex(min)
    if (minIdx !== -1 && idx < minIdx) return false
  }

  if (max !== null) {
    const maxIdx = getGradeIndex(max)
    if (maxIdx !== -1 && idx > maxIdx) return false
  }

  return true
}

/** Format a grade for display (capitalize first letter) */
export function formatGrade(grade: string): string {
  return grade.toUpperCase()
}

/** Get a human-readable label for a grade range */
export function formatGradeRange(min: Grade | null, max: Grade | null): string {
  if (min && max) return `${formatGrade(min)} – ${formatGrade(max)}`
  if (min) return `${formatGrade(min)}+`
  if (max) return `≤ ${formatGrade(max)}`
  return 'Tous niveaux'
}

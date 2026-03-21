/**
 * Pure conflict resolution functions.
 *
 * Compares local and remote boulder/suggestion data to classify
 * conflicts as LWW-resolvable or requiring manual geographic merge.
 */

import type { FieldDiff, ConflictClassification } from './types'

/** Distance threshold (meters) above which geographic conflicts are flagged */
export const GEOGRAPHIC_THRESHOLD_METERS = 10

/** Fields resolved via Last-Write-Wins (simple text/enum/boolean values) */
const SIMPLE_FIELDS = [
  'name',
  'grade',
  'style',
  'sector',
  'exposure',
  'strollerAccessible',
  'description',
  'height',
] as const

/** Geographic fields that trigger manual merge above threshold */
const GEO_FIELDS = ['latitude', 'longitude'] as const

/**
 * Haversine formula: distance in meters between two lat/lng points.
 *
 * Returns 0 if either coordinate pair is null/undefined.
 */
export function haversineDistance(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0

  const R = 6_371_000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Compare local and remote objects, returning diffs for all changed fields.
 *
 * Only checks SIMPLE_FIELDS + GEO_FIELDS. Ignores metadata (id, timestamps, status).
 */
export function detectFieldDiffs(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  const allFields = [...SIMPLE_FIELDS, ...GEO_FIELDS]

  for (const field of allFields) {
    const localVal = local[field]
    const remoteVal = remote[field]

    if (!valuesEqual(localVal, remoteVal)) {
      diffs.push({ field, localValue: localVal, remoteValue: remoteVal })
    }
  }

  return diffs
}

/**
 * Classify a conflict between local and remote versions.
 *
 * - `none` — no field differences
 * - `lww-resolved` — only simple fields differ, or geo diff ≤ 10m
 * - `geographic` — lat/lng differ by > 10m → requires manual merge
 */
export function classifyConflict(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): ConflictClassification {
  const diffs = detectFieldDiffs(local, remote)

  if (diffs.length === 0) {
    return { type: 'none', diffs: [], distanceMeters: null }
  }

  const hasGeoDiff = diffs.some(
    (d) => d.field === 'latitude' || d.field === 'longitude'
  )

  if (!hasGeoDiff) {
    return { type: 'lww-resolved', diffs, distanceMeters: null }
  }

  const distance = haversineDistance(
    local.latitude as number | null,
    local.longitude as number | null,
    remote.latitude as number | null,
    remote.longitude as number | null
  )

  if (distance > GEOGRAPHIC_THRESHOLD_METERS) {
    return { type: 'geographic', diffs, distanceMeters: Math.round(distance) }
  }

  return { type: 'lww-resolved', diffs, distanceMeters: Math.round(distance) }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  return JSON.stringify(a) === JSON.stringify(b)
}

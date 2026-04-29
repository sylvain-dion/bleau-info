/**
 * Pure helpers for environmental zones (Story 14e.1).
 *
 * No DOM, no Zustand — these run on both server and client and are
 * unit-tested in isolation.
 *
 * The two questions this module answers:
 *   1. "Is this boulder currently inside an active eco zone?"
 *      → `boulderInActiveZones(boulderId, now?)`
 *   2. "Should I show an eco banner on this sector page?"
 *      → `sectorHasActiveZones(sectorSlug, now?)`
 *
 * Plus the primitives: `pointInPolygon` (ray-casting) and `isZoneActive`
 * (date-window check, treating `null` bounds as open-ended).
 */

import type { Position } from 'geojson'
import { mockEnvironmentalZoneList } from '@/lib/data/mock-environmental-zones'
import type {
  EnvironmentalZoneFeature,
  EnvironmentalZoneSeverity,
} from '@/lib/data/mock-environmental-zones'
import { getBoulderById, getBouldersBySector } from '@/lib/data/boulder-service'

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * Ray-casting point-in-polygon. Treats the polygon's first ring as the
 * outer boundary; holes are not considered (mock zones are simple).
 *
 * Edge cases:
 *  - Points on the boundary may resolve either way; deterministic for
 *    fixed inputs but not numerically robust. Good enough for ~100m
 *    eco zones — climbers shouldn't be camping on the polygon edge.
 */
export function pointInPolygon(
  point: Position,
  polygon: Position[][],
): boolean {
  if (!polygon[0] || polygon[0].length < 3) return false

  const [x, y] = point
  const ring = polygon[0]
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

// ---------------------------------------------------------------------------
// Time window
// ---------------------------------------------------------------------------

/**
 * Whether `zone` is active at instant `now` (defaults to current time).
 * `validFrom`/`validTo` are inclusive ISO dates; `null` means open-ended.
 */
export function isZoneActive(
  zone: EnvironmentalZoneFeature,
  now: Date = new Date(),
): boolean {
  const { validFrom, validTo } = zone.properties
  const t = now.getTime()

  if (validFrom) {
    const from = new Date(validFrom).getTime()
    if (Number.isNaN(from) || t < from) return false
  }
  if (validTo) {
    // Treat validTo as inclusive end-of-day (23:59:59.999) so that a
    // climber on the last day still sees the zone as active.
    const to = new Date(validTo).getTime() + 24 * 60 * 60 * 1000 - 1
    if (Number.isNaN(to) || t > to) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * Filter the catalog to zones whose validity window contains `now`.
 * Cheap operation (3 zones in mock); used by every render path.
 */
export function getActiveZones(
  now: Date = new Date(),
): readonly EnvironmentalZoneFeature[] {
  return mockEnvironmentalZoneList.filter((z) => isZoneActive(z, now))
}

/**
 * Returns every active zone whose polygon contains the boulder.
 * Empty array means "boulder is in the clear".
 */
export function boulderInActiveZones(
  boulderId: string,
  now: Date = new Date(),
): EnvironmentalZoneFeature[] {
  const boulder = getBoulderById(boulderId)
  if (!boulder) return []

  const point: Position = [boulder.longitude, boulder.latitude]
  return getActiveZones(now).filter((z) =>
    pointInPolygon(point, z.geometry.coordinates),
  )
}

/**
 * Returns active zones that overlap any boulder in the sector.
 * Empty array means "no eco banner needed".
 *
 * A polygon "overlaps" the sector if at least one boulder of the sector
 * sits inside the polygon. This avoids the need for full polygon-bbox
 * intersection math — sectors are dense, so a single boulder hit is
 * a strong proxy for the sector being affected.
 */
export function sectorHasActiveZones(
  sectorSlug: string,
  now: Date = new Date(),
): EnvironmentalZoneFeature[] {
  const boulders = getBouldersBySector(sectorSlug)
  if (boulders.length === 0) return []

  const active = getActiveZones(now)
  if (active.length === 0) return []

  const matched = new Set<EnvironmentalZoneFeature>()
  for (const boulder of boulders) {
    const point: Position = [boulder.longitude, boulder.latitude]
    for (const zone of active) {
      if (matched.has(zone)) continue
      if (pointInPolygon(point, zone.geometry.coordinates)) {
        matched.add(zone)
      }
    }
    if (matched.size === active.length) break
  }

  return Array.from(matched)
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/**
 * Picks the "loudest" zone of a list — used to drive the banner tone
 * when several zones overlap. Order: forbidden > warning > info.
 */
export function highestSeverity(
  zones: readonly EnvironmentalZoneFeature[],
): EnvironmentalZoneSeverity | null {
  if (zones.length === 0) return null
  const order: Record<EnvironmentalZoneSeverity, number> = {
    info: 0,
    warning: 1,
    forbidden: 2,
  }
  let max: EnvironmentalZoneSeverity = 'info'
  for (const z of zones) {
    if (order[z.properties.severity] > order[max]) {
      max = z.properties.severity
    }
  }
  return max
}

/** True if any of the given zones forbid climbing (gates the tick form). */
export function hasForbiddenZone(
  zones: readonly EnvironmentalZoneFeature[],
): boolean {
  return zones.some((z) => z.properties.severity === 'forbidden')
}

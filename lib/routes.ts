/**
 * Custom route statistics computation (Story 9.5).
 *
 * Computes total walking distance and grade range for a boulder route.
 */

import { distanceMeters } from '@/lib/geo/distance'
import { getGradeIndex, GRADE_SCALE } from '@/lib/grades'
import { getBoulderById } from '@/lib/data/boulder-service'
import type { CustomRoute } from '@/stores/custom-route-store'

export interface RouteStats {
  /** Total walking distance in meters between consecutive boulders */
  totalDistance: number
  /** Minimum grade in the route */
  gradeMin: string | null
  /** Maximum grade in the route */
  gradeMax: string | null
  /** Number of boulders with valid coordinates */
  boulderCount: number
}

/**
 * Compute route statistics from an ordered list of boulder IDs.
 *
 * Distance is the sum of haversine distances between consecutive boulders.
 * Grade range is the min/max across all boulders in the route.
 */
export function computeRouteStats(boulderIds: string[]): RouteStats {
  if (boulderIds.length === 0) {
    return { totalDistance: 0, gradeMin: null, gradeMax: null, boulderCount: 0 }
  }

  const boulders = boulderIds
    .map((id) => getBoulderById(id))
    .filter((b) => b !== null)

  let totalDistance = 0
  for (let i = 1; i < boulders.length; i++) {
    totalDistance += distanceMeters(
      boulders[i - 1].latitude,
      boulders[i - 1].longitude,
      boulders[i].latitude,
      boulders[i].longitude
    )
  }

  let minIdx = Infinity
  let maxIdx = -1
  for (const b of boulders) {
    const idx = getGradeIndex(b.grade)
    if (idx >= 0) {
      if (idx < minIdx) minIdx = idx
      if (idx > maxIdx) maxIdx = idx
    }
  }

  const gradeMin = minIdx < Infinity ? GRADE_SCALE[minIdx] : null
  const gradeMax = maxIdx >= 0 ? GRADE_SCALE[maxIdx] : null

  return { totalDistance, gradeMin, gradeMax, boulderCount: boulders.length }
}

/**
 * Filter custom routes that intersect a given sector (Story 9.7).
 *
 * A route is included if at least one of its boulders belongs to the sector.
 * Used when bundling user routes into the offline sector pack.
 */
export function filterRoutesForSector(
  routes: CustomRoute[],
  sectorBoulderIds: Set<string>
): CustomRoute[] {
  if (sectorBoulderIds.size === 0) return []
  return routes.filter((route) =>
    route.boulderIds.some((id) => sectorBoulderIds.has(id))
  )
}

/**
 * Compute the list of sectors touched by a route (Story 9.7).
 *
 * Returns the unique set of sector names for all boulders in the route.
 * Used to determine offline availability: a route is fully offline when
 * every one of these sectors has been downloaded.
 */
export function getRouteSectors(boulderIds: string[]): string[] {
  const sectors = new Set<string>()
  for (const id of boulderIds) {
    const boulder = getBoulderById(id)
    if (boulder?.sector) sectors.add(boulder.sector)
  }
  return Array.from(sectors)
}

/**
 * Check whether a route is fully available offline (Story 9.7).
 *
 * True when every sector touched by the route has a downloaded pack.
 * Routes with no boulders return false.
 */
export function isRouteOffline(
  boulderIds: string[],
  isSectorOffline: (sectorName: string) => boolean
): boolean {
  if (boulderIds.length === 0) return false
  const sectors = getRouteSectors(boulderIds)
  if (sectors.length === 0) return false
  return sectors.every((s) => isSectorOffline(s))
}

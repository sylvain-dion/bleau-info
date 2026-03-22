/**
 * Duplicate boulder detection.
 *
 * Finds existing boulders within a given radius of a new boulder's
 * coordinates. Uses haversine distance from conflict-resolver.
 * Replaces PostGIS ST_DWithin for the mock-data phase.
 */

import { mockBoulders, type BoulderProperties } from '@/lib/data/mock-boulders'
import { haversineDistance } from '@/lib/sync/conflict-resolver'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'

/** Default search radius in meters (FR-40: 5m for exact duplicates) */
export const DUPLICATE_RADIUS_METERS = 5

/** Extended radius for "nearby" warning (less strict) */
export const NEARBY_RADIUS_METERS = 50

/** A potential duplicate with distance info */
export interface DuplicateCandidate {
  id: string
  name: string
  grade: string
  sector: string
  style: string
  latitude: number
  longitude: number
  distanceMeters: number
  source: 'existing' | 'draft'
}

/**
 * Find existing boulders within a radius of given coordinates.
 *
 * Searches both mock (existing) boulders and local drafts.
 * Equivalent to PostGIS `ST_DWithin(location, NEW.location, radius)`.
 */
export function findDuplicates(
  latitude: number,
  longitude: number,
  radiusMeters: number = NEARBY_RADIUS_METERS,
  excludeId?: string
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = []

  // Search existing boulders (mock data)
  for (const feature of mockBoulders.features) {
    const [lng, lat] = feature.geometry.coordinates
    const distance = haversineDistance(latitude, longitude, lat, lng)

    if (distance <= radiusMeters && feature.properties.id !== excludeId) {
      candidates.push({
        id: feature.properties.id,
        name: feature.properties.name,
        grade: feature.properties.grade,
        sector: feature.properties.sector,
        style: feature.properties.style,
        latitude: lat,
        longitude: lng,
        distanceMeters: Math.round(distance),
        source: 'existing',
      })
    }
  }

  // Search local drafts
  const drafts = useBoulderDraftStore.getState().drafts
  for (const draft of drafts) {
    if (draft.latitude == null || draft.longitude == null) continue
    if (draft.id === excludeId) continue

    const distance = haversineDistance(
      latitude,
      longitude,
      draft.latitude,
      draft.longitude
    )

    if (distance <= radiusMeters) {
      candidates.push({
        id: draft.id,
        name: draft.name,
        grade: draft.grade,
        sector: draft.sector,
        style: draft.style,
        latitude: draft.latitude,
        longitude: draft.longitude,
        distanceMeters: Math.round(distance),
        source: 'draft',
      })
    }
  }

  return candidates.sort((a, b) => a.distanceMeters - b.distanceMeters)
}

/**
 * Check if any exact duplicates exist (within 5m).
 * Returns true if at least one candidate is found.
 */
export function hasExactDuplicate(
  latitude: number,
  longitude: number,
  excludeId?: string
): boolean {
  return findDuplicates(latitude, longitude, DUPLICATE_RADIUS_METERS, excludeId).length > 0
}

/**
 * Deterministic hash for sector data version detection.
 *
 * Uses djb2 algorithm — fast, simple, sufficient for change detection.
 * Not cryptographic; only used to detect when mock data changes.
 */

import { mockBoulders } from '@/lib/data/mock-boulders'
import { mockTopos } from '@/lib/data/mock-topos'

/** djb2 string hash → unsigned 32-bit hex string */
export function djb2Hash(input: string): string {
  let hash = 5381

  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0
  }

  return hash.toString(16).padStart(8, '0')
}

/**
 * Compute a deterministic hash for a sector's data.
 *
 * Serializes the sector's boulders + topos to a stable string and hashes it.
 * Used to detect when source data changes so we can prompt for re-download.
 */
export function computeSectorHash(sectorName: string): string {
  const boulders = mockBoulders.features
    .filter((f) => f.properties.sector === sectorName)
    .map((f) => f.properties)

  const boulderIds = boulders.map((b) => b.id)
  const topos = Object.entries(mockTopos)
    .filter(([key]) => boulderIds.includes(key))
    .sort(([a], [b]) => a.localeCompare(b))

  const payload = JSON.stringify({ boulders, topos })
  return djb2Hash(payload)
}

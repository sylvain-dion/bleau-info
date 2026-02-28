import { mockBoulders } from '@/lib/data/mock-boulders'
import type { BoulderProperties } from '@/lib/data/mock-boulders'

/** Search result types */
export type SearchResultType = 'sector' | 'boulder'

export interface SearchResult {
  type: SearchResultType
  /** Display name */
  name: string
  /** Secondary info (grade for boulders, boulder count for sectors) */
  detail: string
  /** Coordinates [lng, lat] for FlyTo */
  center: [number, number]
  /** Zoom level for FlyTo (higher for boulders, lower for sectors) */
  zoom: number
  /** Bounding box for sectors [west, south, east, north] */
  bounds?: [number, number, number, number]
  /** Boulder properties (only for boulder results) */
  properties?: BoulderProperties
}

/** Pre-computed sector data derived from mock boulders */
interface SectorInfo {
  name: string
  center: [number, number]
  bounds: [number, number, number, number]
  boulderCount: number
}

/** Compute sector metadata from boulder data */
function computeSectors(): SectorInfo[] {
  const sectorMap = new Map<string, { lngs: number[]; lats: number[]; count: number }>()

  for (const feature of mockBoulders.features) {
    const { sector } = feature.properties
    const [lng, lat] = feature.geometry.coordinates

    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, { lngs: [], lats: [], count: 0 })
    }
    const s = sectorMap.get(sector)!
    s.lngs.push(lng)
    s.lats.push(lat)
    s.count++
  }

  return Array.from(sectorMap.entries()).map(([name, data]) => {
    const minLng = Math.min(...data.lngs)
    const maxLng = Math.max(...data.lngs)
    const minLat = Math.min(...data.lats)
    const maxLat = Math.max(...data.lats)

    return {
      name,
      center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number],
      bounds: [minLng, minLat, maxLng, maxLat] as [number, number, number, number],
      boulderCount: data.count,
    }
  })
}

const sectors = computeSectors()

/**
 * Normalize a string for search comparison.
 * Removes accents, lowercases, and trims whitespace.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Search sectors and boulders by name.
 *
 * Returns matching results sorted by relevance:
 * 1. Exact prefix matches first
 * 2. Sectors before boulders
 * 3. Alphabetical within each group
 */
export function searchBouldersAndSectors(
  query: string,
  limit: number = 10
): SearchResult[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const results: SearchResult[] = []

  // Search sectors
  for (const sector of sectors) {
    const normalizedName = normalize(sector.name)
    if (normalizedName.includes(q)) {
      results.push({
        type: 'sector',
        name: sector.name,
        detail: `${sector.boulderCount} blocs`,
        center: sector.center,
        zoom: 15,
        bounds: sector.bounds,
      })
    }
  }

  // Search boulders
  for (const feature of mockBoulders.features) {
    const normalizedName = normalize(feature.properties.name)
    if (normalizedName.includes(q)) {
      const [lng, lat] = feature.geometry.coordinates
      results.push({
        type: 'boulder',
        name: feature.properties.name,
        detail: `${feature.properties.grade} · ${feature.properties.sector}`,
        center: [lng, lat],
        zoom: 17,
        properties: feature.properties,
      })
    }
  }

  // Sort: prefix matches first, then sectors before boulders, then alphabetical
  results.sort((a, b) => {
    const aPrefix = normalize(a.name).startsWith(q) ? 0 : 1
    const bPrefix = normalize(b.name).startsWith(q) ? 0 : 1
    if (aPrefix !== bPrefix) return aPrefix - bPrefix

    const aType = a.type === 'sector' ? 0 : 1
    const bType = b.type === 'sector' ? 0 : 1
    if (aType !== bType) return aType - bType

    return a.name.localeCompare(b.name, 'fr')
  })

  return results.slice(0, limit)
}

/**
 * Server-side data fetching for boulder pages.
 *
 * Wraps mock data access with the same API shape that
 * a real Supabase implementation would provide.
 * Used by ISR pages for static generation.
 */

import { mockBoulders, type BoulderProperties } from './mock-boulders'
import { getTopoData, type TopoData } from './mock-topos'

/** Boulder with coordinates extracted from GeoJSON */
export interface BoulderDetail extends BoulderProperties {
  latitude: number
  longitude: number
  topo: TopoData | null
}

/** Minimal sector info for sector listing pages */
export interface SectorSummary {
  slug: string
  name: string
  boulderCount: number
}

/** Rich sector info for the sector page header (Story 13.1) */
export interface SectorDetail {
  slug: string
  name: string
  zone: string
  boulderCount: number
  gradeMin: string | null
  gradeMax: string | null
  circuitCount: number
  circuitColors: string[]
  styleDistribution: Record<string, number>
  centroid: { latitude: number; longitude: number }
  bbox: [number, number, number, number]
}

/**
 * Get all boulder IDs for static path generation.
 * Used by generateStaticParams().
 */
export function getAllBoulderIds(): string[] {
  return mockBoulders.features.map((f) => f.properties.id)
}

/**
 * Get all unique sector slugs for static path generation.
 */
export function getAllSectorSlugs(): SectorSummary[] {
  const sectors = new Map<string, number>()

  for (const feature of mockBoulders.features) {
    const name = feature.properties.sector
    sectors.set(name, (sectors.get(name) ?? 0) + 1)
  }

  return Array.from(sectors.entries()).map(([name, count]) => ({
    slug: toSlug(name),
    name,
    boulderCount: count,
  }))
}

/**
 * Fetch a single boulder by ID with full detail.
 * Returns null if not found.
 */
export function getBoulderById(id: string): BoulderDetail | null {
  const feature = mockBoulders.features.find((f) => f.properties.id === id)
  if (!feature) return null

  const [longitude, latitude] = feature.geometry.coordinates
  const topo = getTopoData(id)

  return {
    ...feature.properties,
    latitude,
    longitude,
    topo,
  }
}

/**
 * Fetch all boulders in a sector by slug.
 */
export function getBouldersBySector(slug: string): BoulderDetail[] {
  return mockBoulders.features
    .filter((f) => toSlug(f.properties.sector) === slug)
    .map((f) => {
      const [longitude, latitude] = f.geometry.coordinates
      const topo = getTopoData(f.properties.id)
      return { ...f.properties, latitude, longitude, topo }
    })
}

/**
 * Get the sector name from a slug.
 */
export function getSectorNameFromSlug(slug: string): string | null {
  const feature = mockBoulders.features.find(
    (f) => toSlug(f.properties.sector) === slug
  )
  return feature?.properties.sector ?? null
}

/**
 * Get rich aggregated data for a sector page (Story 13.1).
 */
export function getSectorDetail(slug: string): SectorDetail | null {
  const boulders = mockBoulders.features.filter(
    (f) => toSlug(f.properties.sector) === slug
  )

  if (boulders.length === 0) return null

  const name = boulders[0].properties.sector
  const grades = boulders.map((f) => f.properties.grade).sort()

  // Circuit stats
  const circuitSet = new Set<string>()
  for (const f of boulders) {
    if (f.properties.circuit) circuitSet.add(f.properties.circuit)
  }

  // Style distribution
  const styles: Record<string, number> = {}
  for (const f of boulders) {
    const s = f.properties.style
    styles[s] = (styles[s] ?? 0) + 1
  }

  // Centroid + bbox
  const lngs = boulders.map((f) => f.geometry.coordinates[0])
  const lats = boulders.map((f) => f.geometry.coordinates[1])

  return {
    slug,
    name,
    zone: 'Forêt de Fontainebleau',
    boulderCount: boulders.length,
    gradeMin: grades[0] ?? null,
    gradeMax: grades[grades.length - 1] ?? null,
    circuitCount: circuitSet.size,
    circuitColors: Array.from(circuitSet),
    styleDistribution: styles,
    centroid: {
      latitude: lats.reduce((a, b) => a + b, 0) / lats.length,
      longitude: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    },
    bbox: [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ],
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a sector name to a URL-safe slug */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Exported for reuse (e.g. in tests) */
export { toSlug }

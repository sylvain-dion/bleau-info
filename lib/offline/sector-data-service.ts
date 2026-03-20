/**
 * Sector data extraction service.
 *
 * Pure functions that extract sector data from mock sources.
 * This is the only layer to swap when adding real API calls.
 */

import type { FeatureCollection, Point } from 'geojson'
import { mockBoulders, type BoulderProperties } from '@/lib/data/mock-boulders'
import { mockTopos, type TopoData } from '@/lib/data/mock-topos'

/** Summary info for a downloadable sector */
export interface SectorInfo {
  name: string
  boulderCount: number
  topoCount: number
  estimatedSizeBytes: number
}

/** Full sector data ready for offline storage */
export interface SectorData {
  name: string
  boulders: FeatureCollection<Point, BoulderProperties>
  topos: Record<string, TopoData>
  bbox: [number, number, number, number]
  sizeBytes: number
}

/** Average estimated size per boulder (JSON metadata + topo SVG) */
const BYTES_PER_BOULDER = 2048
/** Average estimated size per topo */
const BYTES_PER_TOPO = 4096

/** Get all unique sector names from mock data */
function getSectorNames(): string[] {
  const names = new Set<string>()

  for (const feature of mockBoulders.features) {
    names.add(feature.properties.sector)
  }

  return Array.from(names).sort()
}

/** Estimate download size for a sector */
export function estimateSectorSize(sectorName: string): number {
  const boulders = mockBoulders.features.filter(
    (f) => f.properties.sector === sectorName
  )
  const boulderIds = new Set(boulders.map((b) => b.properties.id))
  const topoCount = Object.keys(mockTopos).filter((id) =>
    boulderIds.has(id)
  ).length

  return boulders.length * BYTES_PER_BOULDER + topoCount * BYTES_PER_TOPO
}

/** List all available sectors with summary info */
export function getAvailableSectors(): SectorInfo[] {
  return getSectorNames().map((name) => {
    const boulders = mockBoulders.features.filter(
      (f) => f.properties.sector === name
    )
    const boulderIds = new Set(boulders.map((b) => b.properties.id))
    const topoCount = Object.keys(mockTopos).filter((id) =>
      boulderIds.has(id)
    ).length

    return {
      name,
      boulderCount: boulders.length,
      topoCount,
      estimatedSizeBytes: estimateSectorSize(name),
    }
  })
}

/** Compute bounding box from a set of features */
function computeBbox(
  features: typeof mockBoulders.features
): [number, number, number, number] {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }

  return [minLng, minLat, maxLng, maxLat]
}

/** Extract full sector data for offline storage */
export function getSectorData(sectorName: string): SectorData {
  const features = mockBoulders.features.filter(
    (f) => f.properties.sector === sectorName
  )

  const boulderIds = new Set(features.map((f) => f.properties.id))

  const topos: Record<string, TopoData> = {}
  for (const [id, topo] of Object.entries(mockTopos)) {
    if (boulderIds.has(id)) {
      topos[id] = topo
    }
  }

  const boulders: FeatureCollection<Point, BoulderProperties> = {
    type: 'FeatureCollection',
    features,
  }

  const sizeBytes = JSON.stringify({ boulders, topos }).length

  return {
    name: sectorName,
    boulders,
    topos,
    bbox: computeBbox(features),
    sizeBytes,
  }
}

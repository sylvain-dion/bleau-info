/**
 * Circuit route data derived from mock boulders.
 *
 * Groups boulders by sector + circuit color, sorts by circuitNumber,
 * and builds LineString routes connecting them in order.
 */

import type { Feature, LineString, FeatureCollection } from 'geojson'
import {
  mockBoulders,
  type CircuitColor,
  CIRCUIT_COLORS,
} from './mock-boulders'

/** Metadata for a single circuit */
export interface CircuitInfo {
  id: string
  color: CircuitColor
  sector: string
  hexColor: string
  boulderCount: number
  gradeRange: { min: string; max: string }
  /** Boulder IDs in order */
  boulderIds: string[]
}

/** Properties on circuit LineString features */
export interface CircuitRouteProperties {
  circuitId: string
  color: CircuitColor
  hexColor: string
  sector: string
  boulderCount: number
}

/** All circuits indexed by id */
const circuitMap = new Map<string, CircuitInfo>()

/** GeoJSON FeatureCollection of circuit routes (LineStrings) */
let _circuitRoutes: FeatureCollection<LineString, CircuitRouteProperties> | null = null

function buildCircuits(): void {
  if (circuitMap.size > 0) return

  // Group boulders by sector + circuit
  const groups = new Map<
    string,
    { color: CircuitColor; sector: string; boulders: Array<{ id: string; number: number; coords: [number, number]; grade: string }> }
  >()

  for (const feature of mockBoulders.features) {
    const { id, circuit, circuitNumber, sector, grade } = feature.properties
    if (!circuit || circuitNumber == null) continue

    const key = `${sector}__${circuit}`
    if (!groups.has(key)) {
      groups.set(key, { color: circuit, sector, boulders: [] })
    }

    groups.get(key)!.boulders.push({
      id,
      number: circuitNumber,
      coords: feature.geometry.coordinates as [number, number],
      grade,
    })
  }

  // Sort each group by circuitNumber and build CircuitInfo
  for (const [key, group] of groups) {
    group.boulders.sort((a, b) => a.number - b.number)
    const grades = group.boulders.map((b) => b.grade).sort()

    const info: CircuitInfo = {
      id: key,
      color: group.color,
      sector: group.sector,
      hexColor: CIRCUIT_COLORS[group.color],
      boulderCount: group.boulders.length,
      gradeRange: {
        min: grades[0] ?? '',
        max: grades[grades.length - 1] ?? '',
      },
      boulderIds: group.boulders.map((b) => b.id),
    }

    circuitMap.set(key, info)
  }
}

/** Get all circuits */
export function getAllCircuits(): CircuitInfo[] {
  buildCircuits()
  return Array.from(circuitMap.values())
}

/** Get circuits for a specific sector */
export function getCircuitsForSector(sector: string): CircuitInfo[] {
  buildCircuits()
  return Array.from(circuitMap.values()).filter((c) => c.sector === sector)
}

/** Get a single circuit by id */
export function getCircuit(id: string): CircuitInfo | undefined {
  buildCircuits()
  return circuitMap.get(id)
}

/**
 * Get circuit routes as GeoJSON LineStrings for map rendering.
 *
 * Each circuit is a LineString connecting boulders in circuitNumber order.
 * Circuits with < 2 boulders are skipped (no line to draw).
 */
export function getCircuitRoutes(): FeatureCollection<LineString, CircuitRouteProperties> {
  if (_circuitRoutes) return _circuitRoutes

  buildCircuits()

  const features: Feature<LineString, CircuitRouteProperties>[] = []

  for (const [key, info] of circuitMap) {
    // Collect boulders with their circuitNumber + coordinates, sort by number
    const bouldersWithCoords: { num: number; coords: [number, number] }[] = []
    for (const feature of mockBoulders.features) {
      const { circuit, circuitNumber, sector } = feature.properties
      if (`${sector}__${circuit}` === key && circuitNumber != null) {
        bouldersWithCoords.push({
          num: circuitNumber,
          coords: feature.geometry.coordinates as [number, number],
        })
      }
    }

    bouldersWithCoords.sort((a, b) => a.num - b.num)
    const sortedCoords = bouldersWithCoords.map((b) => b.coords)

    if (sortedCoords.length < 2) continue

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: sortedCoords,
      },
      properties: {
        circuitId: key,
        color: info.color,
        hexColor: info.hexColor,
        sector: info.sector,
        boulderCount: info.boulderCount,
      },
    })
  }

  _circuitRoutes = {
    type: 'FeatureCollection',
    features,
  }

  return _circuitRoutes
}

import { describe, it, expect } from 'vitest'
import { mockBoulders, CIRCUIT_COLORS, CIRCUIT_SHAPES } from '@/lib/data/mock-boulders'
import type { CircuitColor } from '@/lib/data/mock-boulders'

describe('Mock boulder data', () => {
  it('should be a valid GeoJSON FeatureCollection', () => {
    expect(mockBoulders.type).toBe('FeatureCollection')
    expect(Array.isArray(mockBoulders.features)).toBe(true)
    expect(mockBoulders.features.length).toBeGreaterThan(0)
  })

  it('should have ~50 boulders across multiple sectors', () => {
    expect(mockBoulders.features.length).toBeGreaterThanOrEqual(40)
    expect(mockBoulders.features.length).toBeLessThanOrEqual(60)

    const sectors = new Set(mockBoulders.features.map((f) => f.properties.sector))
    expect(sectors.size).toBeGreaterThanOrEqual(5)
  })

  it('should have valid Point geometries with coordinates in Fontainebleau area', () => {
    for (const feature of mockBoulders.features) {
      expect(feature.geometry.type).toBe('Point')
      const [lng, lat] = feature.geometry.coordinates
      // Fontainebleau area: roughly 2.3-2.9°E, 48.2-48.6°N
      expect(lng).toBeGreaterThan(2.3)
      expect(lng).toBeLessThan(2.9)
      expect(lat).toBeGreaterThan(48.2)
      expect(lat).toBeLessThan(48.6)
    }
  })

  it('should have required properties on every feature', () => {
    for (const feature of mockBoulders.features) {
      const { id, name, grade, sector, style } = feature.properties
      expect(id).toBeTruthy()
      expect(name).toBeTruthy()
      expect(grade).toMatch(/^\d[a-c]\+?$/) // French grade format
      expect(sector).toBeTruthy()
      expect(style).toBeTruthy()
    }
  })

  it('should have circuit info or null for hors-circuit boulders', () => {
    const withCircuit = mockBoulders.features.filter((f) => f.properties.circuit !== null)
    const withoutCircuit = mockBoulders.features.filter((f) => f.properties.circuit === null)

    expect(withCircuit.length).toBeGreaterThan(0)
    expect(withoutCircuit.length).toBeGreaterThan(0)

    for (const f of withCircuit) {
      expect(f.properties.circuitNumber).toBeTypeOf('number')
    }
    for (const f of withoutCircuit) {
      expect(f.properties.circuitNumber).toBeNull()
    }
  })
})

describe('Circuit colors', () => {
  it('should have hex color for every circuit type', () => {
    const circuits: CircuitColor[] = ['jaune', 'bleu', 'rouge', 'blanc', 'orange', 'noir']
    for (const circuit of circuits) {
      expect(CIRCUIT_COLORS[circuit]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('Circuit shapes', () => {
  it('should have a unique shape for every circuit type (colorblind accessibility)', () => {
    const shapes = Object.values(CIRCUIT_SHAPES)
    const uniqueShapes = new Set(shapes)
    expect(uniqueShapes.size).toBe(shapes.length)
  })
})

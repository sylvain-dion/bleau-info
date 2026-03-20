import { describe, it, expect } from 'vitest'
import {
  getAvailableSectors,
  getSectorData,
  estimateSectorSize,
} from '@/lib/offline/sector-data-service'

describe('getAvailableSectors', () => {
  it('returns all 6 sectors', () => {
    const sectors = getAvailableSectors()
    expect(sectors).toHaveLength(6)
  })

  it('returns sorted sector names', () => {
    const sectors = getAvailableSectors()
    const names = sectors.map((s) => s.name)
    expect(names).toEqual([...names].sort())
  })

  it('includes boulder and topo counts', () => {
    const sectors = getAvailableSectors()
    for (const sector of sectors) {
      expect(sector.boulderCount).toBeGreaterThan(0)
      expect(sector.estimatedSizeBytes).toBeGreaterThan(0)
    }
  })
})

describe('getSectorData', () => {
  it('returns correct boulders for Cul de Chien', () => {
    const data = getSectorData('Cul de Chien')
    expect(data.name).toBe('Cul de Chien')
    expect(data.boulders.features.length).toBe(8)
    expect(
      data.boulders.features.every(
        (f) => f.properties.sector === 'Cul de Chien'
      )
    ).toBe(true)
  })

  it('includes topos for boulders that have them', () => {
    const data = getSectorData('Cul de Chien')
    // La Marie-Rose (cul-de-chien-1) has a topo
    expect(data.topos['cul-de-chien-1']).toBeDefined()
  })

  it('computes a valid bbox', () => {
    const data = getSectorData('Bas Cuvier')
    const [minLng, minLat, maxLng, maxLat] = data.bbox
    expect(minLng).toBeLessThanOrEqual(maxLng)
    expect(minLat).toBeLessThanOrEqual(maxLat)
  })

  it('sizeBytes is positive', () => {
    const data = getSectorData('Apremont')
    expect(data.sizeBytes).toBeGreaterThan(0)
  })
})

describe('estimateSectorSize', () => {
  it('returns positive size for known sectors', () => {
    expect(estimateSectorSize('Franchard Isatis')).toBeGreaterThan(0)
  })

  it('returns 0 for unknown sector', () => {
    expect(estimateSectorSize('Nonexistent Sector')).toBe(0)
  })
})

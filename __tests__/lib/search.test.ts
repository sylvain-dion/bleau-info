import { describe, it, expect } from 'vitest'
import { searchBouldersAndSectors } from '@/lib/search'
import type { SearchResult } from '@/lib/search'

describe('searchBouldersAndSectors', () => {
  it('should return empty array for queries shorter than 2 characters', () => {
    expect(searchBouldersAndSectors('')).toEqual([])
    expect(searchBouldersAndSectors('a')).toEqual([])
  })

  it('should return results for valid queries', () => {
    const results = searchBouldersAndSectors('cu')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should match sector names (case insensitive)', () => {
    const results = searchBouldersAndSectors('cuvier')
    const sectors = results.filter((r) => r.type === 'sector')
    expect(sectors.length).toBeGreaterThan(0)
    sectors.forEach((s) => {
      expect(s.name.toLowerCase()).toContain('cuvier')
    })
  })

  it('should match boulder names (case insensitive)', () => {
    const results = searchBouldersAndSectors('la')
    const boulders = results.filter((r) => r.type === 'boulder')
    expect(boulders.length).toBeGreaterThan(0)
  })

  it('should be accent-insensitive', () => {
    // Search without accent should match names with accents
    const results = searchBouldersAndSectors('apremont')
    const sectors = results.filter((r) => r.type === 'sector')
    expect(sectors.length).toBeGreaterThan(0)
  })

  it('should sort prefix matches before substring matches', () => {
    const results = searchBouldersAndSectors('cul')
    if (results.length >= 2) {
      const firstMatch = results[0]
      expect(firstMatch.name.toLowerCase().startsWith('cul')).toBe(true)
    }
  })

  it('should sort sectors before boulders at same relevance', () => {
    // Search for something that matches both sectors and boulders
    const results = searchBouldersAndSectors('cu')
    const firstSectorIndex = results.findIndex((r) => r.type === 'sector')
    const firstBoulderIndex = results.findIndex((r) => r.type === 'boulder')
    if (firstSectorIndex >= 0 && firstBoulderIndex >= 0) {
      expect(firstSectorIndex).toBeLessThan(firstBoulderIndex)
    }
  })

  it('should respect the limit parameter', () => {
    const results = searchBouldersAndSectors('a', 3)
    // Query too short, returns empty
    expect(results).toEqual([])

    const results2 = searchBouldersAndSectors('cu', 2)
    expect(results2.length).toBeLessThanOrEqual(2)
  })

  it('should return sector results with correct structure', () => {
    const results = searchBouldersAndSectors('cuvier')
    const sector = results.find((r) => r.type === 'sector')
    expect(sector).toBeDefined()
    if (sector) {
      expect(sector.type).toBe('sector')
      expect(sector.name).toBeTruthy()
      expect(sector.detail).toContain('blocs')
      expect(sector.center).toHaveLength(2)
      expect(sector.zoom).toBe(15)
      expect(sector.bounds).toHaveLength(4)
    }
  })

  it('should return boulder results with correct structure', () => {
    const results = searchBouldersAndSectors('la')
    const boulder = results.find((r) => r.type === 'boulder')
    expect(boulder).toBeDefined()
    if (boulder) {
      expect(boulder.type).toBe('boulder')
      expect(boulder.name).toBeTruthy()
      expect(boulder.detail).toBeTruthy()
      expect(boulder.center).toHaveLength(2)
      expect(boulder.zoom).toBe(17)
      expect(boulder.properties).toBeDefined()
      expect(boulder.properties!.grade).toBeTruthy()
    }
  })

  it('should return valid coordinates in results', () => {
    const results = searchBouldersAndSectors('cu')
    results.forEach((r) => {
      const [lng, lat] = r.center
      // Fontainebleau area
      expect(lng).toBeGreaterThan(2)
      expect(lng).toBeLessThan(3)
      expect(lat).toBeGreaterThan(48)
      expect(lat).toBeLessThan(49)
    })
  })

  it('should return no results for gibberish queries', () => {
    const results = searchBouldersAndSectors('xyzzzz123')
    expect(results).toEqual([])
  })

  it('should default limit to 10', () => {
    const results = searchBouldersAndSectors('a'.repeat(0)) // short query
    // Actually test with a broad query
    const broad = searchBouldersAndSectors('le')
    expect(broad.length).toBeLessThanOrEqual(10)
  })

  it('should include boulder detail with grade and sector', () => {
    const results = searchBouldersAndSectors('la')
    const boulder = results.find((r) => r.type === 'boulder')
    if (boulder) {
      // Detail format: "6a · Sector Name"
      expect(boulder.detail).toMatch(/·/)
    }
  })

  it('should include sector detail with boulder count', () => {
    const results = searchBouldersAndSectors('cuvier')
    const sector = results.find((r) => r.type === 'sector')
    if (sector) {
      expect(sector.detail).toMatch(/\d+ blocs/)
    }
  })
})

import { describe, it, expect } from 'vitest'
import {
  getAllBoulderIds,
  getAllSectorSlugs,
  getBoulderById,
  getBouldersBySector,
  getSectorNameFromSlug,
  toSlug,
} from '@/lib/data/boulder-service'

describe('toSlug', () => {
  it('converts sector name to URL-safe slug', () => {
    expect(toSlug('Cul de Chien')).toBe('cul-de-chien')
  })

  it('handles accented characters', () => {
    expect(toSlug('Franchard Isatis')).toBe('franchard-isatis')
    expect(toSlug('Éléphant')).toBe('elephant')
  })

  it('handles multiple spaces and special chars', () => {
    expect(toSlug("Roche aux Sabots")).toBe('roche-aux-sabots')
  })
})

describe('getAllBoulderIds', () => {
  it('returns an array of string IDs', () => {
    const ids = getAllBoulderIds()
    expect(ids.length).toBeGreaterThan(0)
    expect(typeof ids[0]).toBe('string')
  })

  it('includes known boulder IDs from mock data', () => {
    const ids = getAllBoulderIds()
    expect(ids).toContain('cul-de-chien-1')
  })
})

describe('getAllSectorSlugs', () => {
  it('returns sector summaries', () => {
    const sectors = getAllSectorSlugs()
    expect(sectors.length).toBeGreaterThan(0)
    expect(sectors[0]).toHaveProperty('slug')
    expect(sectors[0]).toHaveProperty('name')
    expect(sectors[0]).toHaveProperty('boulderCount')
  })

  it('includes known sector', () => {
    const sectors = getAllSectorSlugs()
    const culDeChien = sectors.find((s) => s.slug === 'cul-de-chien')
    expect(culDeChien).toBeDefined()
    expect(culDeChien!.name).toBe('Cul de Chien')
    expect(culDeChien!.boulderCount).toBeGreaterThan(0)
  })
})

describe('getBoulderById', () => {
  it('returns a boulder with full detail', () => {
    const boulder = getBoulderById('cul-de-chien-1')
    expect(boulder).not.toBeNull()
    expect(boulder!.name).toBe('La Marie-Rose')
    expect(boulder!.grade).toBe('6a')
    expect(boulder!.latitude).toBeCloseTo(48.38, 1)
    expect(boulder!.longitude).toBeCloseTo(2.63, 1)
  })

  it('returns null for unknown ID', () => {
    expect(getBoulderById('nonexistent-boulder')).toBeNull()
  })

  it('includes topo data when available', () => {
    const boulder = getBoulderById('cul-de-chien-1')
    expect(boulder!.topo).not.toBeNull()
    expect(boulder!.topo!.boulderId).toBe('cul-de-chien-1')
  })
})

describe('getBouldersBySector', () => {
  it('returns all boulders in a sector', () => {
    const boulders = getBouldersBySector('cul-de-chien')
    expect(boulders.length).toBeGreaterThan(0)
    expect(boulders.every((b) => b.sector === 'Cul de Chien')).toBe(true)
  })

  it('returns empty array for unknown sector', () => {
    expect(getBouldersBySector('nonexistent-sector')).toHaveLength(0)
  })
})

describe('getSectorNameFromSlug', () => {
  it('resolves slug to sector name', () => {
    expect(getSectorNameFromSlug('cul-de-chien')).toBe('Cul de Chien')
  })

  it('returns null for unknown slug', () => {
    expect(getSectorNameFromSlug('nonexistent')).toBeNull()
  })
})

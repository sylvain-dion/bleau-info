import { describe, it, expect } from 'vitest'
import {
  computeRouteStats,
  filterRoutesForSector,
  getRouteSectors,
  isRouteOffline,
} from '@/lib/routes'
import type { CustomRoute } from '@/stores/custom-route-store'

describe('computeRouteStats', () => {
  it('returns zeros for empty route', () => {
    const stats = computeRouteStats([])
    expect(stats.totalDistance).toBe(0)
    expect(stats.gradeMin).toBeNull()
    expect(stats.gradeMax).toBeNull()
    expect(stats.boulderCount).toBe(0)
  })

  it('returns stats for a single boulder', () => {
    // cul-de-chien-1 = La Marie-Rose, grade 6a
    const stats = computeRouteStats(['cul-de-chien-1'])
    expect(stats.boulderCount).toBe(1)
    expect(stats.totalDistance).toBe(0) // single point = no distance
    expect(stats.gradeMin).toBe('6a')
    expect(stats.gradeMax).toBe('6a')
  })

  it('computes distance between consecutive boulders', () => {
    // Two boulders in the same sector — should have non-zero distance
    const stats = computeRouteStats(['cul-de-chien-1', 'cul-de-chien-2'])
    expect(stats.totalDistance).toBeGreaterThan(0)
    expect(stats.boulderCount).toBe(2)
  })

  it('computes grade range across route', () => {
    // cul-de-chien-6 = 3b, cul-de-chien-7 = 6c
    const stats = computeRouteStats(['cul-de-chien-6', 'cul-de-chien-7'])
    expect(stats.gradeMin).toBe('3b')
    expect(stats.gradeMax).toBe('6c')
  })

  it('skips unknown boulder IDs gracefully', () => {
    const stats = computeRouteStats(['cul-de-chien-1', 'nonexistent-99'])
    expect(stats.boulderCount).toBe(1)
  })

  it('sums distances across multiple boulders', () => {
    const stats2 = computeRouteStats(['cul-de-chien-1', 'cul-de-chien-2'])
    const stats3 = computeRouteStats([
      'cul-de-chien-1',
      'cul-de-chien-2',
      'cul-de-chien-3',
    ])
    // More boulders should mean more total distance
    expect(stats3.totalDistance).toBeGreaterThanOrEqual(stats2.totalDistance)
  })
})

// ---------------------------------------------------------------------------
// Story 9.7 — offline helpers
// ---------------------------------------------------------------------------

function makeRoute(id: string, boulderIds: string[]): CustomRoute {
  return {
    id,
    name: `Route ${id}`,
    boulderIds,
    isPublic: false,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  }
}

describe('filterRoutesForSector', () => {
  const routes: CustomRoute[] = [
    makeRoute('r1', ['cul-de-chien-1', 'cul-de-chien-2']),
    makeRoute('r2', ['bas-cuvier-1', 'bas-cuvier-2']),
    makeRoute('r3', ['cul-de-chien-1', 'bas-cuvier-1']), // crosses sectors
    makeRoute('r4', []),
  ]

  it('returns routes whose boulders intersect the sector', () => {
    const sectorIds = new Set(['cul-de-chien-1', 'cul-de-chien-2', 'cul-de-chien-3'])
    const result = filterRoutesForSector(routes, sectorIds)
    expect(result.map((r) => r.id)).toEqual(['r1', 'r3'])
  })

  it('includes multi-sector routes when at least one boulder is in the sector', () => {
    const sectorIds = new Set(['bas-cuvier-1'])
    const result = filterRoutesForSector(routes, sectorIds)
    expect(result.map((r) => r.id)).toEqual(['r2', 'r3'])
  })

  it('returns empty array when sector has no boulders', () => {
    expect(filterRoutesForSector(routes, new Set())).toEqual([])
  })

  it('skips empty routes', () => {
    const sectorIds = new Set(['cul-de-chien-1'])
    const result = filterRoutesForSector(routes, sectorIds)
    expect(result.find((r) => r.id === 'r4')).toBeUndefined()
  })
})

describe('getRouteSectors', () => {
  it('returns unique sectors for the route boulders', () => {
    const sectors = getRouteSectors(['cul-de-chien-1', 'cul-de-chien-2'])
    expect(sectors).toEqual(['Cul de Chien'])
  })

  it('returns empty array for empty route', () => {
    expect(getRouteSectors([])).toEqual([])
  })

  it('ignores unknown boulder IDs', () => {
    const sectors = getRouteSectors(['cul-de-chien-1', 'nonexistent-99'])
    expect(sectors).toEqual(['Cul de Chien'])
  })
})

describe('isRouteOffline', () => {
  it('is true when every sector is downloaded', () => {
    const result = isRouteOffline(['cul-de-chien-1'], () => true)
    expect(result).toBe(true)
  })

  it('is false when any sector is missing', () => {
    const result = isRouteOffline(
      ['cul-de-chien-1', 'bas-cuvier-1'],
      (name) => name === 'Cul de Chien'
    )
    expect(result).toBe(false)
  })

  it('is false for empty route', () => {
    expect(isRouteOffline([], () => true)).toBe(false)
  })

  it('is false when no boulders resolve', () => {
    expect(isRouteOffline(['nonexistent-99'], () => true)).toBe(false)
  })
})

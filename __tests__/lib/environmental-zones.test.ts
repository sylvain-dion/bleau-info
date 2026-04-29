import { describe, it, expect } from 'vitest'
import {
  pointInPolygon,
  isZoneActive,
  getActiveZones,
  boulderInActiveZones,
  sectorHasActiveZones,
  highestSeverity,
  hasForbiddenZone,
} from '@/lib/environmental-zones'
import { mockEnvironmentalZoneList } from '@/lib/data/mock-environmental-zones'
import type { EnvironmentalZoneFeature } from '@/lib/data/mock-environmental-zones'

const zone = (
  partial: Partial<EnvironmentalZoneFeature['properties']> = {},
  ring: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
): EnvironmentalZoneFeature => ({
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [ring] },
  properties: {
    id: 'test-zone',
    type: 'protection',
    severity: 'warning',
    title: 'Zone test',
    description: '',
    validFrom: null,
    validTo: null,
    ...partial,
  },
})

describe('pointInPolygon', () => {
  const square: [number, number][][] = [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
  ]

  it('returns true for a point clearly inside', () => {
    expect(pointInPolygon([5, 5], square)).toBe(true)
  })

  it('returns false for a point clearly outside', () => {
    expect(pointInPolygon([15, 5], square)).toBe(false)
    expect(pointInPolygon([-1, 5], square)).toBe(false)
    expect(pointInPolygon([5, 15], square)).toBe(false)
  })

  it('returns false on degenerate rings (< 3 points)', () => {
    expect(pointInPolygon([1, 1], [[[0, 0]]])).toBe(false)
    expect(pointInPolygon([1, 1], [[]])).toBe(false)
    expect(pointInPolygon([1, 1], [])).toBe(false)
  })

  it('handles concave shapes correctly', () => {
    // L-shape — point in the "notch" should be outside
    const ring: [number, number][][] = [
      [
        [0, 0],
        [10, 0],
        [10, 4],
        [4, 4],
        [4, 10],
        [0, 10],
        [0, 0],
      ],
    ]
    expect(pointInPolygon([2, 2], ring)).toBe(true) // inside the L
    expect(pointInPolygon([8, 8], ring)).toBe(false) // in the notch
  })
})

describe('isZoneActive', () => {
  it('always active when both bounds are null', () => {
    const z = zone({ validFrom: null, validTo: null })
    expect(isZoneActive(z, new Date('2026-01-01'))).toBe(true)
    expect(isZoneActive(z, new Date('2030-12-31'))).toBe(true)
  })

  it('active inside the [from, to] window', () => {
    const z = zone({ validFrom: '2026-03-01', validTo: '2026-06-30' })
    expect(isZoneActive(z, new Date('2026-04-15T12:00:00Z'))).toBe(true)
  })

  it('inactive before validFrom', () => {
    const z = zone({ validFrom: '2026-03-01', validTo: '2026-06-30' })
    expect(isZoneActive(z, new Date('2026-02-28T23:59:59Z'))).toBe(false)
  })

  it('inactive after validTo (end-of-day inclusive)', () => {
    const z = zone({ validFrom: '2026-03-01', validTo: '2026-06-30' })
    // Same day, late evening — still active
    expect(isZoneActive(z, new Date('2026-06-30T22:00:00Z'))).toBe(true)
    // Next day — inactive
    expect(isZoneActive(z, new Date('2026-07-01T12:00:00Z'))).toBe(false)
  })

  it('honours open-ended start (validFrom = null)', () => {
    const z = zone({ validFrom: null, validTo: '2026-06-30' })
    expect(isZoneActive(z, new Date('2020-01-01'))).toBe(true)
    expect(isZoneActive(z, new Date('2026-07-01T12:00:00Z'))).toBe(false)
  })

  it('honours open-ended end (validTo = null)', () => {
    const z = zone({ validFrom: '2026-03-01', validTo: null })
    expect(isZoneActive(z, new Date('2026-02-28T23:59:59Z'))).toBe(false)
    expect(isZoneActive(z, new Date('2030-01-01'))).toBe(true)
  })
})

describe('getActiveZones', () => {
  it('returns the year-round Bas Cuvier zone outside the seasonal window', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const active = getActiveZones(winter)
    const ids = active.map((z) => z.properties.id)
    expect(ids).toContain('zone-humidity-bas-cuvier')
    expect(ids).not.toContain('zone-nidification-cul-de-chien')
    expect(ids).not.toContain('zone-erosion-apremont')
  })

  it('returns nidification + erosion + humidity in spring', () => {
    const spring = new Date('2026-05-01T12:00:00Z')
    const ids = getActiveZones(spring).map((z) => z.properties.id)
    expect(ids).toContain('zone-nidification-cul-de-chien')
    expect(ids).toContain('zone-erosion-apremont')
    expect(ids).toContain('zone-humidity-bas-cuvier')
  })

  it('drops nidification once the season ends', () => {
    const summer = new Date('2026-07-15T12:00:00Z')
    const ids = getActiveZones(summer).map((z) => z.properties.id)
    expect(ids).not.toContain('zone-nidification-cul-de-chien')
    expect(ids).toContain('zone-erosion-apremont')
    expect(ids).toContain('zone-humidity-bas-cuvier')
  })
})

describe('boulderInActiveZones', () => {
  it('returns the nidification zone for a Cul de Chien boulder during the season', () => {
    const spring = new Date('2026-04-15T12:00:00Z')
    const zones = boulderInActiveZones('cul-de-chien-1', spring)
    const ids = zones.map((z) => z.properties.id)
    expect(ids).toContain('zone-nidification-cul-de-chien')
  })

  it('returns no nidification zone outside the season', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const zones = boulderInActiveZones('cul-de-chien-1', winter)
    const ids = zones.map((z) => z.properties.id)
    expect(ids).not.toContain('zone-nidification-cul-de-chien')
  })

  it('returns the year-round humidity zone for Bas Cuvier boulders', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const zones = boulderInActiveZones('bas-cuvier-1', winter)
    const ids = zones.map((z) => z.properties.id)
    expect(ids).toContain('zone-humidity-bas-cuvier')
  })

  it('returns empty when the boulder id does not exist', () => {
    expect(boulderInActiveZones('does-not-exist')).toEqual([])
  })
})

describe('sectorHasActiveZones', () => {
  it('flags Cul de Chien during nidification', () => {
    const spring = new Date('2026-04-15T12:00:00Z')
    const zones = sectorHasActiveZones('cul-de-chien', spring)
    const ids = zones.map((z) => z.properties.id)
    expect(ids).toContain('zone-nidification-cul-de-chien')
  })

  it('does not flag Cul de Chien outside the nidification window', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const zones = sectorHasActiveZones('cul-de-chien', winter)
    expect(zones).toEqual([])
  })

  it('flags Bas Cuvier year-round (humidity)', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const zones = sectorHasActiveZones('bas-cuvier', winter)
    const ids = zones.map((z) => z.properties.id)
    expect(ids).toContain('zone-humidity-bas-cuvier')
  })

  it('returns empty for unknown sector slugs', () => {
    expect(sectorHasActiveZones('mars-base-alpha')).toEqual([])
  })
})

describe('highestSeverity', () => {
  it('returns null on empty input', () => {
    expect(highestSeverity([])).toBeNull()
  })

  it('promotes forbidden over warning over info', () => {
    expect(
      highestSeverity([
        zone({ severity: 'info' }),
        zone({ severity: 'warning' }),
        zone({ severity: 'forbidden' }),
      ]),
    ).toBe('forbidden')

    expect(
      highestSeverity([zone({ severity: 'info' }), zone({ severity: 'warning' })]),
    ).toBe('warning')

    expect(highestSeverity([zone({ severity: 'info' })])).toBe('info')
  })
})

describe('hasForbiddenZone', () => {
  it('returns true when at least one zone is forbidden', () => {
    expect(
      hasForbiddenZone([
        zone({ severity: 'warning' }),
        zone({ severity: 'forbidden' }),
      ]),
    ).toBe(true)
  })

  it('returns false otherwise', () => {
    expect(hasForbiddenZone([])).toBe(false)
    expect(
      hasForbiddenZone([zone({ severity: 'warning' }), zone({ severity: 'info' })]),
    ).toBe(false)
  })
})

describe('mock catalog sanity', () => {
  it('contains the three expected zones', () => {
    const ids = mockEnvironmentalZoneList.map((z) => z.properties.id)
    expect(ids).toEqual([
      'zone-nidification-cul-de-chien',
      'zone-erosion-apremont',
      'zone-humidity-bas-cuvier',
    ])
  })

  it('every zone polygon is a closed ring', () => {
    for (const z of mockEnvironmentalZoneList) {
      const ring = z.geometry.coordinates[0]
      expect(ring.length).toBeGreaterThanOrEqual(4)
      expect(ring[0]).toEqual(ring[ring.length - 1])
    }
  })
})

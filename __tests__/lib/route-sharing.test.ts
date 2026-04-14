import { describe, it, expect } from 'vitest'
import {
  encodeRouteUrl,
  decodeRouteFromUrl,
  generateRouteShareText,
} from '@/lib/route-sharing'
import type { CustomRoute } from '@/stores/custom-route-store'
import type { RouteStats } from '@/lib/routes'

const mockRoute: CustomRoute = {
  id: 'route-123',
  name: 'Parcours du jour',
  boulderIds: ['cul-de-chien-1', 'cul-de-chien-3', 'bas-cuvier-2'],
  isPublic: true,
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-03-15T10:00:00Z',
}

describe('encodeRouteUrl', () => {
  it('encodes route into URL with name and boulders params', () => {
    const url = encodeRouteUrl(mockRoute)
    expect(url).toContain('/parcours/shared?')
    expect(url).toContain('name=Parcours+du+jour')
    expect(url).toContain(
      'boulders=cul-de-chien-1%2Ccul-de-chien-3%2Cbas-cuvier-2'
    )
  })

  it('handles empty boulder list', () => {
    const route = { ...mockRoute, boulderIds: [] }
    const url = encodeRouteUrl(route)
    expect(url).toContain('boulders=')
  })
})

describe('decodeRouteFromUrl', () => {
  it('decodes valid URL params into route data', () => {
    const params = new URLSearchParams(
      'name=Mon+parcours&boulders=a-1,b-2,c-3'
    )
    const result = decodeRouteFromUrl(params)
    expect(result).toEqual({
      name: 'Mon parcours',
      boulderIds: ['a-1', 'b-2', 'c-3'],
    })
  })

  it('returns null when name is missing', () => {
    const params = new URLSearchParams('boulders=a-1,b-2')
    expect(decodeRouteFromUrl(params)).toBeNull()
  })

  it('returns null when boulders is missing', () => {
    const params = new URLSearchParams('name=Test')
    expect(decodeRouteFromUrl(params)).toBeNull()
  })

  it('returns null when boulders is empty', () => {
    const params = new URLSearchParams('name=Test&boulders=')
    expect(decodeRouteFromUrl(params)).toBeNull()
  })

  it('roundtrips correctly with encodeRouteUrl', () => {
    const url = encodeRouteUrl(mockRoute)
    const queryString = url.split('?')[1]
    const result = decodeRouteFromUrl(new URLSearchParams(queryString))
    expect(result).toEqual({
      name: mockRoute.name,
      boulderIds: mockRoute.boulderIds,
    })
  })

  it('trims whitespace from boulder IDs', () => {
    const params = new URLSearchParams('name=Test&boulders= a-1 , b-2 ')
    const result = decodeRouteFromUrl(params)
    expect(result?.boulderIds).toEqual(['a-1', 'b-2'])
  })
})

describe('generateRouteShareText', () => {
  const stats: RouteStats = {
    totalDistance: 450,
    gradeMin: '5a',
    gradeMax: '6b',
    boulderCount: 3,
  }

  it('includes route name', () => {
    const text = generateRouteShareText(mockRoute, stats, 'https://x.com/share')
    expect(text).toContain('Parcours du jour')
  })

  it('includes boulder count and grade range', () => {
    const text = generateRouteShareText(mockRoute, stats, 'https://x.com/share')
    expect(text).toContain('3 blocs')
    expect(text).toContain('5A')
    expect(text).toContain('6B')
  })

  it('includes distance', () => {
    const text = generateRouteShareText(mockRoute, stats, 'https://x.com/share')
    expect(text).toContain('450 m')
  })

  it('includes share URL', () => {
    const url = 'https://bleau.info/parcours/shared?x=y'
    const text = generateRouteShareText(mockRoute, stats, url)
    expect(text).toContain(url)
  })

  it('omits distance when zero', () => {
    const noDistance = { ...stats, totalDistance: 0 }
    const text = generateRouteShareText(mockRoute, noDistance, 'https://x.com')
    expect(text).not.toContain('🚶')
  })
})

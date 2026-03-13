import { describe, it, expect } from 'vitest'
import {
  roundCoordinate,
  formatLatitude,
  formatLongitude,
  formatCoordinates,
} from '@/lib/coordinates'

describe('roundCoordinate', () => {
  it('should round to 6 decimal places', () => {
    expect(roundCoordinate(48.38261923456)).toBe(48.382619)
  })

  it('should preserve values already at 6 decimals', () => {
    expect(roundCoordinate(2.634521)).toBe(2.634521)
  })

  it('should pad shorter values', () => {
    expect(roundCoordinate(48.3)).toBe(48.3)
  })

  it('should handle zero', () => {
    expect(roundCoordinate(0)).toBe(0)
  })

  it('should handle negative values', () => {
    expect(roundCoordinate(-33.8567841)).toBe(-33.856784)
  })

  it('should round up correctly', () => {
    expect(roundCoordinate(48.3826195)).toBe(48.38262)
  })
})

describe('formatLatitude', () => {
  it('should format positive latitude with N', () => {
    expect(formatLatitude(48.382619)).toBe('48.382619° N')
  })

  it('should format negative latitude with S', () => {
    expect(formatLatitude(-33.856784)).toBe('33.856784° S')
  })

  it('should format equator as N', () => {
    expect(formatLatitude(0)).toBe('0.000000° N')
  })

  it('should round before formatting', () => {
    expect(formatLatitude(48.38261923456)).toBe('48.382619° N')
  })

  it('should pad to 6 decimal places', () => {
    expect(formatLatitude(48.3)).toBe('48.300000° N')
  })
})

describe('formatLongitude', () => {
  it('should format positive longitude with E', () => {
    expect(formatLongitude(2.634521)).toBe('2.634521° E')
  })

  it('should format negative longitude with O (Ouest)', () => {
    expect(formatLongitude(-73.985428)).toBe('73.985428° O')
  })

  it('should format prime meridian as E', () => {
    expect(formatLongitude(0)).toBe('0.000000° E')
  })

  it('should round before formatting', () => {
    expect(formatLongitude(2.6345219876)).toBe('2.634522° E')
  })

  it('should pad to 6 decimal places', () => {
    expect(formatLongitude(2.6)).toBe('2.600000° E')
  })
})

describe('formatCoordinates', () => {
  it('should format both values with comma separator', () => {
    expect(formatCoordinates(48.382619, 2.634521)).toBe(
      '48.382619° N, 2.634521° E'
    )
  })

  it('should handle Fontainebleau forest center', () => {
    expect(formatCoordinates(48.4, 2.63)).toBe(
      '48.400000° N, 2.630000° E'
    )
  })

  it('should handle southern and western hemispheres', () => {
    expect(formatCoordinates(-22.951916, -43.210487)).toBe(
      '22.951916° S, 43.210487° O'
    )
  })
})

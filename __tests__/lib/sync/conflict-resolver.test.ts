import { describe, it, expect } from 'vitest'
import {
  haversineDistance,
  detectFieldDiffs,
  classifyConflict,
  GEOGRAPHIC_THRESHOLD_METERS,
} from '@/lib/sync/conflict-resolver'

describe('haversineDistance', () => {
  it('returns 0 when both points are identical', () => {
    expect(haversineDistance(48.3815, 2.6345, 48.3815, 2.6345)).toBe(0)
  })

  it('returns 0 when either coordinate is null', () => {
    expect(haversineDistance(null, 2.6345, 48.3815, 2.6345)).toBe(0)
    expect(haversineDistance(48.3815, null, 48.3815, 2.6345)).toBe(0)
    expect(haversineDistance(48.3815, 2.6345, null, 2.6345)).toBe(0)
    expect(haversineDistance(48.3815, 2.6345, 48.3815, null)).toBe(0)
  })

  it('calculates correct distance between known points (~111 km per degree lat)', () => {
    // 1 degree of latitude ≈ 111,195 m
    const distance = haversineDistance(48.0, 2.0, 49.0, 2.0)
    expect(distance).toBeGreaterThan(110_000)
    expect(distance).toBeLessThan(112_000)
  })

  it('calculates short distances correctly (~15m)', () => {
    // ~15m shift in Fontainebleau area
    const lat1 = 48.381500
    const lng1 = 2.634500
    const lat2 = 48.381635 // +0.000135 ≈ ~15m north
    const lng2 = 2.634500

    const distance = haversineDistance(lat1, lng1, lat2, lng2)
    expect(distance).toBeGreaterThan(12)
    expect(distance).toBeLessThan(18)
  })
})

describe('detectFieldDiffs', () => {
  it('returns empty array when no differences', () => {
    const data = { name: 'Bloc A', grade: '6a', latitude: 48.38, longitude: 2.63 }
    const diffs = detectFieldDiffs(data, { ...data })
    expect(diffs).toHaveLength(0)
  })

  it('detects simple field differences', () => {
    const local = { name: 'Bloc A', grade: '6a', style: 'dalle' }
    const remote = { name: 'Bloc A', grade: '6b', style: 'dalle' }

    const diffs = detectFieldDiffs(local, remote)
    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toEqual({
      field: 'grade',
      localValue: '6a',
      remoteValue: '6b',
    })
  })

  it('detects multiple differences including geographic fields', () => {
    const local = { name: 'Bloc A', grade: '6a', latitude: 48.38, longitude: 2.63 }
    const remote = { name: 'Bloc B', grade: '6a', latitude: 48.39, longitude: 2.64 }

    const diffs = detectFieldDiffs(local, remote)
    expect(diffs).toHaveLength(3) // name, latitude, longitude
    expect(diffs.map((d) => d.field).sort()).toEqual(['latitude', 'longitude', 'name'])
  })

  it('treats null and undefined as equal', () => {
    const local = { height: null }
    const remote = { height: undefined }
    const diffs = detectFieldDiffs(local, remote)
    expect(diffs).toHaveLength(0)
  })
})

describe('classifyConflict', () => {
  it('returns type "none" when no differences', () => {
    const data = { name: 'Bloc', grade: '5a', latitude: 48.38, longitude: 2.63 }
    const result = classifyConflict(data, { ...data })

    expect(result.type).toBe('none')
    expect(result.diffs).toHaveLength(0)
    expect(result.distanceMeters).toBeNull()
  })

  it('returns "lww-resolved" for simple field differences only', () => {
    const local = { name: 'Bloc A', grade: '6a', latitude: 48.38, longitude: 2.63 }
    const remote = { name: 'Bloc A', grade: '6b+', latitude: 48.38, longitude: 2.63 }

    const result = classifyConflict(local, remote)
    expect(result.type).toBe('lww-resolved')
    expect(result.diffs).toHaveLength(1)
    expect(result.distanceMeters).toBeNull()
  })

  it('returns "lww-resolved" when geographic diff is within threshold', () => {
    // ~5m shift — within 10m threshold
    const local = { latitude: 48.381500, longitude: 2.634500 }
    const remote = { latitude: 48.381545, longitude: 2.634500 }

    const result = classifyConflict(local, remote)
    expect(result.type).toBe('lww-resolved')
    expect(result.distanceMeters).not.toBeNull()
    expect(result.distanceMeters!).toBeLessThan(GEOGRAPHIC_THRESHOLD_METERS)
  })

  it('returns "geographic" when geographic diff exceeds threshold', () => {
    // ~30m shift — above 10m threshold
    const local = { latitude: 48.381500, longitude: 2.634500 }
    const remote = { latitude: 48.381770, longitude: 2.634500 }

    const result = classifyConflict(local, remote)
    expect(result.type).toBe('geographic')
    expect(result.distanceMeters).not.toBeNull()
    expect(result.distanceMeters!).toBeGreaterThan(GEOGRAPHIC_THRESHOLD_METERS)
  })

  it('returns "geographic" when both simple and geo fields differ', () => {
    const local = { name: 'Bloc A', grade: '6a', latitude: 48.381500, longitude: 2.634500 }
    const remote = { name: 'Bloc B', grade: '6a', latitude: 48.382000, longitude: 2.635000 }

    const result = classifyConflict(local, remote)
    expect(result.type).toBe('geographic')
    expect(result.diffs.length).toBeGreaterThan(1)
  })
})

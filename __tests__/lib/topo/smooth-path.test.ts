import { describe, it, expect } from 'vitest'
import {
  simplifyPoints,
  pointsToSvgPath,
  createArrowPoints,
  getLastSegmentAngle,
} from '@/lib/topo/smooth-path'

describe('simplifyPoints', () => {
  it('returns empty array for empty input', () => {
    expect(simplifyPoints([])).toEqual([])
  })

  it('returns single point as-is', () => {
    expect(simplifyPoints([10, 20])).toEqual([10, 20])
  })

  it('returns two points as-is', () => {
    expect(simplifyPoints([10, 20, 30, 40])).toEqual([10, 20, 30, 40])
  })

  it('removes points that are too close together', () => {
    // Points within 3px of each other should be removed
    const points = [0, 0, 1, 1, 2, 2, 10, 10, 11, 11, 20, 20]
    const result = simplifyPoints(points)
    expect(result.length).toBeLessThan(points.length)
    // First and last points always kept
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
    expect(result[result.length - 2]).toBe(20)
    expect(result[result.length - 1]).toBe(20)
  })

  it('keeps points that are far apart', () => {
    const points = [0, 0, 100, 100, 200, 200]
    expect(simplifyPoints(points)).toEqual([0, 0, 100, 100, 200, 200])
  })

  it('always keeps first and last points', () => {
    const points = [0, 0, 0.5, 0.5, 1, 1]
    const result = simplifyPoints(points)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
    expect(result[result.length - 2]).toBe(1)
    expect(result[result.length - 1]).toBe(1)
  })

  it('uses custom minimum distance', () => {
    const points = [0, 0, 5, 5, 10, 10, 15, 15]
    const result = simplifyPoints(points, 8)
    // With min distance 8, intermediate points ~7px apart should be filtered
    expect(result.length).toBeLessThan(points.length)
  })
})

describe('pointsToSvgPath', () => {
  it('returns empty string for empty points', () => {
    expect(pointsToSvgPath([])).toBe('')
  })

  it('returns empty string for single point', () => {
    expect(pointsToSvgPath([10, 20])).toBe('')
  })

  it('returns straight line for two points', () => {
    const result = pointsToSvgPath([10, 20, 30, 40])
    expect(result).toBe('M 10 20 L 30 40')
  })

  it('returns smooth path for three points', () => {
    const result = pointsToSvgPath([0, 0, 50, 100, 100, 0])
    expect(result).toMatch(/^M 0 0/)
    expect(result).toContain('Q')
    // Should end at last point
    expect(result).toMatch(/L 100 0$/)
  })

  it('returns smooth path for many points', () => {
    const points = [0, 0, 20, 30, 40, 60, 60, 90, 80, 120]
    const result = pointsToSvgPath(points)
    expect(result).toMatch(/^M 0 0/)
    // Should have multiple Q segments
    const qCount = (result.match(/Q/g) || []).length
    expect(qCount).toBeGreaterThanOrEqual(2)
    // Should end at last point
    expect(result).toMatch(/L 80 120$/)
  })

  it('rounds coordinates to integers', () => {
    const result = pointsToSvgPath([10.7, 20.3, 30.5, 40.8])
    expect(result).toBe('M 11 20 L 31 41')
  })
})

describe('createArrowPoints', () => {
  it('creates 3-vertex polygon string', () => {
    const result = createArrowPoints(100, 100)
    const vertices = result.split(' ')
    expect(vertices).toHaveLength(3)
    vertices.forEach((v) => {
      expect(v).toMatch(/^-?\d+,-?\d+$/)
    })
  })

  it('creates triangle centered near given coordinates', () => {
    const result = createArrowPoints(200, 300, 10)
    const vertices = result.split(' ').map((v) => {
      const [x, y] = v.split(',').map(Number)
      return { x, y }
    })
    // All vertices should be within `size` distance of center
    vertices.forEach(({ x, y }) => {
      const dist = Math.sqrt((x - 200) ** 2 + (y - 300) ** 2)
      expect(dist).toBeLessThanOrEqual(11) // 10 + rounding tolerance
    })
  })

  it('respects custom size', () => {
    const small = createArrowPoints(100, 100, 5)
    const large = createArrowPoints(100, 100, 20)
    // Larger arrow has more spread vertices
    const smallVerts = small.split(' ').map((v) => v.split(',').map(Number))
    const largeVerts = large.split(' ').map((v) => v.split(',').map(Number))

    const smallSpread = Math.abs(smallVerts[0][0] - smallVerts[1][0])
    const largeSpread = Math.abs(largeVerts[0][0] - largeVerts[1][0])
    expect(largeSpread).toBeGreaterThan(smallSpread)
  })

  it('defaults to pointing up when no angle specified', () => {
    const result = createArrowPoints(100, 100, 10)
    const vertices = result.split(' ').map((v) => {
      const [x, y] = v.split(',').map(Number)
      return { x, y }
    })
    // Top vertex should be above center (lower y value)
    const topVertex = vertices.reduce((min, v) => (v.y < min.y ? v : min))
    expect(topVertex.y).toBeLessThan(100)
  })
})

describe('getLastSegmentAngle', () => {
  it('returns -PI/2 (up) for insufficient points', () => {
    expect(getLastSegmentAngle([])).toBe(-Math.PI / 2)
    expect(getLastSegmentAngle([10, 20])).toBe(-Math.PI / 2)
  })

  it('returns 0 for rightward segment', () => {
    const angle = getLastSegmentAngle([0, 0, 10, 0])
    expect(angle).toBeCloseTo(0)
  })

  it('returns PI/2 for downward segment', () => {
    const angle = getLastSegmentAngle([0, 0, 0, 10])
    expect(angle).toBeCloseTo(Math.PI / 2)
  })

  it('returns -PI/2 for upward segment', () => {
    const angle = getLastSegmentAngle([0, 10, 0, 0])
    expect(angle).toBeCloseTo(-Math.PI / 2)
  })

  it('uses last two points from longer array', () => {
    // Many points, but only last segment matters
    const angle = getLastSegmentAngle([0, 0, 50, 50, 100, 50, 200, 50])
    // Last segment: (100,50) → (200,50) = rightward
    expect(angle).toBeCloseTo(0)
  })
})

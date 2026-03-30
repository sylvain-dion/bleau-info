import { describe, it, expect } from 'vitest'
import { computeRouteStats } from '@/lib/routes'

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

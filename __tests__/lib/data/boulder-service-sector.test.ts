import { describe, it, expect } from 'vitest'
import { getSectorDetail, getAllSectorSlugs } from '@/lib/data/boulder-service'

describe('getSectorDetail', () => {
  it('returns null for unknown slug', () => {
    expect(getSectorDetail('nonexistent-sector')).toBeNull()
  })

  it('returns sector detail for valid slug', () => {
    const slugs = getAllSectorSlugs()
    expect(slugs.length).toBeGreaterThan(0)

    const detail = getSectorDetail(slugs[0].slug)
    expect(detail).not.toBeNull()
    expect(detail!.name).toBe(slugs[0].name)
    expect(detail!.boulderCount).toBe(slugs[0].boulderCount)
  })

  it('has valid grade range', () => {
    const slugs = getAllSectorSlugs()
    const detail = getSectorDetail(slugs[0].slug)!

    expect(detail.gradeMin).not.toBeNull()
    expect(detail.gradeMax).not.toBeNull()
    expect(detail.gradeMin!.localeCompare(detail.gradeMax!)).toBeLessThanOrEqual(0)
  })

  it('has zone set to Fontainebleau', () => {
    const slugs = getAllSectorSlugs()
    const detail = getSectorDetail(slugs[0].slug)!
    expect(detail.zone).toBe('Forêt de Fontainebleau')
  })

  it('computes centroid within Fontainebleau bounds', () => {
    const slugs = getAllSectorSlugs()
    const detail = getSectorDetail(slugs[0].slug)!

    expect(detail.centroid.latitude).toBeGreaterThan(48.3)
    expect(detail.centroid.latitude).toBeLessThan(48.5)
    expect(detail.centroid.longitude).toBeGreaterThan(2.3)
    expect(detail.centroid.longitude).toBeLessThan(2.9)
  })

  it('has valid bbox', () => {
    const slugs = getAllSectorSlugs()
    const detail = getSectorDetail(slugs[0].slug)!

    const [minLng, minLat, maxLng, maxLat] = detail.bbox
    expect(minLng).toBeLessThanOrEqual(maxLng)
    expect(minLat).toBeLessThanOrEqual(maxLat)
  })

  it('counts circuits correctly', () => {
    const slugs = getAllSectorSlugs()
    const detail = getSectorDetail(slugs[0].slug)!

    expect(detail.circuitCount).toBeGreaterThanOrEqual(0)
    expect(detail.circuitColors.length).toBe(detail.circuitCount)
  })

  it('computes style distribution summing to boulder count', () => {
    const slugs = getAllSectorSlugs()
    const detail = getSectorDetail(slugs[0].slug)!

    const totalFromStyles = Object.values(detail.styleDistribution).reduce(
      (sum, count) => sum + count,
      0
    )
    expect(totalFromStyles).toBe(detail.boulderCount)
  })
})

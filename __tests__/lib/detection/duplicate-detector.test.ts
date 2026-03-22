import { describe, it, expect, beforeEach } from 'vitest'
import {
  findDuplicates,
  hasExactDuplicate,
  DUPLICATE_RADIUS_METERS,
  NEARBY_RADIUS_METERS,
} from '@/lib/detection/duplicate-detector'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'

describe('findDuplicates', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({ drafts: [] })
  })

  it('finds boulders within radius of known coordinates', () => {
    // Cul de Chien sector center: ~48.3815, ~2.6345
    // Mock boulders are scattered around this point
    const results = findDuplicates(48.3815, 2.6345, 200)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].source).toBe('existing')
  })

  it('returns empty array for coordinates far from any boulder', () => {
    // Coordinates in the middle of the ocean
    const results = findDuplicates(0, 0, NEARBY_RADIUS_METERS)
    expect(results).toHaveLength(0)
  })

  it('results are sorted by distance (closest first)', () => {
    const results = findDuplicates(48.3815, 2.6345, 500)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distanceMeters).toBeGreaterThanOrEqual(
        results[i - 1].distanceMeters
      )
    }
  })

  it('excludes a specific boulder by ID', () => {
    const results = findDuplicates(48.3815, 2.6345, 500, 'cul-de-chien-1')
    const ids = results.map((r) => r.id)
    expect(ids).not.toContain('cul-de-chien-1')
  })

  it('includes local drafts in search', () => {
    // Add a draft near Cul de Chien
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: 'draft-nearby',
          name: 'Test Draft',
          grade: '5a',
          sector: 'Cul de Chien',
          style: 'dalle',
          latitude: 48.3815,
          longitude: 2.6345,
          syncStatus: 'local',
          status: 'draft',
        } as any,
      ],
    })

    const results = findDuplicates(48.3816, 2.6345, NEARBY_RADIUS_METERS)
    const draft = results.find((r) => r.id === 'draft-nearby')
    expect(draft).toBeDefined()
    expect(draft!.source).toBe('draft')
  })

  it('ignores drafts without coordinates', () => {
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: 'draft-no-coords',
          name: 'No GPS',
          grade: '4a',
          sector: 'Test',
          style: 'bloc',
          latitude: null,
          longitude: null,
          syncStatus: 'local',
          status: 'draft',
        } as any,
      ],
    })

    const results = findDuplicates(48.3815, 2.6345, 500)
    const ids = results.map((r) => r.id)
    expect(ids).not.toContain('draft-no-coords')
  })
})

describe('hasExactDuplicate', () => {
  it('returns false for coordinates far from any boulder', () => {
    expect(hasExactDuplicate(0, 0)).toBe(false)
  })

  it('returns true when a boulder is within 5m', () => {
    // Get exact coordinates of first mock boulder (cul-de-chien-1)
    const results = findDuplicates(48.3815, 2.6345, 1000)
    if (results.length > 0) {
      const closest = results[0]
      // Search from almost the same spot (should be within 5m)
      const result = hasExactDuplicate(
        closest.latitude + 0.00001, // ~1m shift
        closest.longitude + 0.00001
      )
      expect(result).toBe(true)
    }
  })
})

describe('constants', () => {
  it('DUPLICATE_RADIUS_METERS is 5', () => {
    expect(DUPLICATE_RADIUS_METERS).toBe(5)
  })

  it('NEARBY_RADIUS_METERS is 50', () => {
    expect(NEARBY_RADIUS_METERS).toBe(50)
  })
})

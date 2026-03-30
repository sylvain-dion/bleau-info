import { describe, it, expect } from 'vitest'
import { buildHeatmapData } from '@/lib/heatmap'
import type { Feature, Point } from 'geojson'
import type { Tick } from '@/lib/validations/tick'

function makeFeature(id: string, lng = 2.63, lat = 48.4): Feature<Point> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: { id, name: `Bloc ${id}`, grade: '5b', style: 'dalle' },
  }
}

function makeTick(boulderId: string, daysAgo = 0): Tick {
  const date = new Date(Date.now() - daysAgo * 86400000)
  return {
    id: `t-${Math.random()}`,
    userId: 'user-1',
    boulderId,
    boulderName: 'Test',
    boulderGrade: '5b',
    tickStyle: 'flash',
    tickDate: date.toISOString().slice(0, 10),
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: date.toISOString(),
  }
}

describe('buildHeatmapData', () => {
  it('returns a FeatureCollection', () => {
    const result = buildHeatmapData([makeFeature('b-1')], [])
    expect(result.type).toBe('FeatureCollection')
    expect(result.features).toHaveLength(1)
  })

  it('adds _activity property to each feature', () => {
    const result = buildHeatmapData([makeFeature('b-1')], [])
    expect(result.features[0].properties?._activity).toBeDefined()
    expect(typeof result.features[0].properties?._activity).toBe('number')
  })

  it('includes mock popularity even with no ticks', () => {
    const result = buildHeatmapData([makeFeature('b-1')], [])
    // Mock popularity is 0-4, so _activity >= 0
    expect(result.features[0].properties?._activity).toBeGreaterThanOrEqual(0)
  })

  it('counts recent ticks (last 30 days)', () => {
    const features = [makeFeature('b-1')]
    const ticks = [makeTick('b-1', 5), makeTick('b-1', 10)]
    const result = buildHeatmapData(features, ticks)
    // _activity = 2 local ticks + mock popularity
    const mockPop =
      'b-1'.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 5
    expect(result.features[0].properties?._activity).toBe(2 + mockPop)
  })

  it('excludes ticks older than 30 days', () => {
    const features = [makeFeature('b-2')]
    const ticks = [makeTick('b-2', 31)]
    const result = buildHeatmapData(features, ticks)
    const mockPop =
      'b-2'.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 5
    expect(result.features[0].properties?._activity).toBe(mockPop)
  })

  it('filters out circuit dot features', () => {
    const boulder = makeFeature('b-1')
    const dot: Feature<Point> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.63, 48.4] },
      properties: { _isCircuitDot: true, _circuitColor: 'rouge' },
    }
    const result = buildHeatmapData([boulder, dot], [])
    expect(result.features).toHaveLength(1)
    expect(result.features[0].properties?.id).toBe('b-1')
  })

  it('handles multiple boulders with different tick counts', () => {
    const features = [makeFeature('m-1'), makeFeature('m-2')]
    const ticks = [
      makeTick('m-1', 1),
      makeTick('m-1', 2),
      makeTick('m-1', 3),
      makeTick('m-2', 1),
    ]
    const result = buildHeatmapData(features, ticks)
    const a1 = result.features.find((f) => f.properties?.id === 'm-1')
    const a2 = result.features.find((f) => f.properties?.id === 'm-2')
    expect(a1!.properties!._activity).toBeGreaterThan(a2!.properties!._activity)
  })

  it('returns empty collection for empty input', () => {
    const result = buildHeatmapData([], [])
    expect(result.features).toHaveLength(0)
  })
})

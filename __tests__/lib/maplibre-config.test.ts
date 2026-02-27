import { describe, it, expect } from 'vitest'
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  MAP_BOUNDS,
  ZOOM_THRESHOLDS,
  CLUSTER_CONFIG,
  MAP_INTERACTION,
} from '@/lib/maplibre/config'

describe('Map configuration', () => {
  it('should center on Fontainebleau forest', () => {
    // Fontainebleau is roughly at 2.6°E, 48.4°N
    expect(MAP_CENTER[0]).toBeCloseTo(2.63, 1) // longitude
    expect(MAP_CENTER[1]).toBeCloseTo(48.4, 1) // latitude
  })

  it('should have sensible zoom defaults', () => {
    expect(MAP_DEFAULT_ZOOM).toBeGreaterThanOrEqual(10)
    expect(MAP_DEFAULT_ZOOM).toBeLessThanOrEqual(14)
    expect(MAP_MIN_ZOOM).toBeLessThan(MAP_DEFAULT_ZOOM)
    expect(MAP_MAX_ZOOM).toBeGreaterThan(MAP_DEFAULT_ZOOM)
  })

  it('should have bounding box that covers Fontainebleau', () => {
    const [west, south, east, north] = MAP_BOUNDS
    // Center should be within bounds
    expect(MAP_CENTER[0]).toBeGreaterThan(west)
    expect(MAP_CENTER[0]).toBeLessThan(east)
    expect(MAP_CENTER[1]).toBeGreaterThan(south)
    expect(MAP_CENTER[1]).toBeLessThan(north)
  })

  it('should have progressive disclosure zoom thresholds', () => {
    expect(ZOOM_THRESHOLDS.sectorClusters).toBeLessThan(ZOOM_THRESHOLDS.boulderDetail)
  })

  it('should have cluster config enabled', () => {
    expect(CLUSTER_CONFIG.cluster).toBe(true)
    expect(CLUSTER_CONFIG.clusterMaxZoom).toBeGreaterThan(0)
    expect(CLUSTER_CONFIG.clusterRadius).toBeGreaterThan(0)
  })

  it('should have reasonable interaction settings', () => {
    expect(MAP_INTERACTION.maxPitch).toBeGreaterThan(0)
    expect(MAP_INTERACTION.maxPitch).toBeLessThanOrEqual(85)
    expect(MAP_INTERACTION.flyToDuration).toBeGreaterThan(0)
  })
})

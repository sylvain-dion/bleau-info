import { describe, it, expect } from 'vitest'
import { getMapStyleUrl, createFallbackStyle } from '@/lib/maplibre/styles'

describe('Map styles', () => {
  describe('getMapStyleUrl', () => {
    it('should return a valid URL for light theme', () => {
      const url = getMapStyleUrl('light')
      expect(url).toMatch(/^https:\/\//)
      expect(url).toContain('openfreemap')
    })

    it('should return a valid URL for dark theme', () => {
      const url = getMapStyleUrl('dark')
      expect(url).toMatch(/^https:\/\//)
      expect(url).toContain('openfreemap')
    })

    it('should return different URLs for light and dark themes', () => {
      const light = getMapStyleUrl('light')
      const dark = getMapStyleUrl('dark')
      expect(light).not.toBe(dark)
    })
  })

  describe('createFallbackStyle', () => {
    it('should return a valid MapLibre style specification', () => {
      const style = createFallbackStyle()
      expect(style.version).toBe(8)
      expect(style.sources).toBeDefined()
      expect(style.layers).toBeDefined()
      expect(style.layers!.length).toBeGreaterThan(0)
    })

    it('should use OSM raster tiles as fallback', () => {
      const style = createFallbackStyle()
      const osmSource = style.sources!['osm'] as { tiles: string[] }
      expect(osmSource.tiles[0]).toContain('openstreetmap.org')
    })
  })
})

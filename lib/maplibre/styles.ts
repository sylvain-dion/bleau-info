import type { StyleSpecification } from 'maplibre-gl'

/**
 * OpenFreeMap style URLs for MapLibre basemaps.
 *
 * OpenFreeMap provides free, API-key-free vector tile styles
 * based on OpenStreetMap data. For production/offline use,
 * these will be replaced by self-hosted PMTiles (ARCH-04).
 */
const STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

/**
 * Returns the basemap style URL for the given theme.
 *
 * Uses OpenFreeMap for development. In production, this will
 * be swapped for self-hosted Protomaps PMTiles for offline support.
 */
export function getMapStyleUrl(theme: 'light' | 'dark'): string {
  return STYLE_URLS[theme]
}

/**
 * Creates a minimal fallback style if the remote style fails to load.
 * Uses OpenStreetMap raster tiles as a backup.
 */
export function createFallbackStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'bleau-fallback',
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
      },
    ],
  }
}

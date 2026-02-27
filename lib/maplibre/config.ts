/** MapLibre configuration for Bleau.info */

/** Center of Fontainebleau forest */
export const MAP_CENTER: [number, number] = [2.63, 48.4]

/** Default zoom level (shows the whole forest) */
export const MAP_DEFAULT_ZOOM = 12

/** Min/max zoom bounds */
export const MAP_MIN_ZOOM = 8
export const MAP_MAX_ZOOM = 19

/** Bounding box for Fontainebleau area [west, south, east, north] */
export const MAP_BOUNDS: [number, number, number, number] = [2.35, 48.3, 2.85, 48.5]

/**
 * Zoom thresholds for progressive disclosure:
 * - Forest level (0–11): Only sector clusters visible
 * - Sector level (12–14): Individual sectors + boulder clusters
 * - Boulder level (15+): Individual boulder markers
 */
export const ZOOM_THRESHOLDS = {
  /** Below this: only sector-level clusters */
  sectorClusters: 12,
  /** Below this: boulder clusters; above: individual markers */
  boulderDetail: 15,
} as const

/** Cluster configuration for GeoJSON source */
export const CLUSTER_CONFIG = {
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
} as const

/** Protomaps basemap tile source */
export const PROTOMAPS_URL =
  'https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt?key=1a264b37765a0249'

/** Map interaction settings */
export const MAP_INTERACTION = {
  /** Max pitch in degrees (slight tilt allowed for 3D feel) */
  maxPitch: 60,
  /** Animation duration for flyTo in ms */
  flyToDuration: 1500,
  /** Cluster expansion zoom step */
  clusterZoomStep: 2,
} as const

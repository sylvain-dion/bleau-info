/**
 * Dexie IndexedDB database for offline sector data.
 *
 * Separate from the drafts database (`bleau-drafts`).
 * Stores full sector data (boulders GeoJSON, topos) for offline use,
 * plus placeholder tables for photos and map tiles.
 */

import Dexie, { type Table } from 'dexie'
import type { FeatureCollection, Point } from 'geojson'
import type { BoulderProperties } from '@/lib/data/mock-boulders'
import type { TopoData } from '@/lib/data/mock-topos'

/** A fully cached sector for offline use */
export interface OfflineSector {
  /** Sector name (primary key) */
  name: string
  /** Full GeoJSON FeatureCollection of boulders in this sector */
  boulders: FeatureCollection<Point, BoulderProperties>
  /** Map of boulderId → TopoData */
  topos: Record<string, TopoData>
  /** Bounding box [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number]
  /** Deterministic hash of source data for update detection */
  versionHash: string
  /** ISO timestamp of download completion */
  downloadedAt: string
  /** Approximate total size in bytes */
  sizeBytes: number
}

/** A cached photo linked to a sector/boulder */
export interface OfflinePhoto {
  /** Auto-increment primary key */
  id?: number
  /** Sector this photo belongs to */
  sectorName: string
  /** Boulder this photo belongs to */
  boulderId: string
  /** Raw photo binary data */
  data: ArrayBuffer
  /** MIME type (e.g. "image/jpeg") */
  mimeType: string
}

/** Placeholder for future map tile caching */
export interface OfflineTile {
  /** Tile key (e.g. "z/x/y") */
  key: string
  /** Sector this tile belongs to */
  sectorName: string
  /** Tile binary data */
  data: ArrayBuffer
}

class OfflineDatabase extends Dexie {
  sectors!: Table<OfflineSector>
  photos!: Table<OfflinePhoto>
  tiles!: Table<OfflineTile>

  constructor() {
    super('bleau-offline')
    this.version(1).stores({
      sectors: 'name',
      photos: '++id, sectorName, boulderId',
      tiles: 'key, sectorName',
    })
  }
}

export const offlineDb = new OfflineDatabase()

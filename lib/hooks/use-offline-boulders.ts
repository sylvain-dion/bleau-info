/**
 * Hook providing boulder data with offline-first fallback.
 *
 * - Online → returns mock data (current behavior)
 * - Offline + sector downloaded → reads from IndexedDB
 * - Offline + not downloaded → returns mock data (in JS bundle)
 *
 * Prepared for future Supabase integration.
 */

import { useState, useEffect } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import { mockBoulders, type BoulderProperties } from '@/lib/data/mock-boulders'
import { mockTopos, type TopoData } from '@/lib/data/mock-topos'
import { useNetworkStore } from '@/stores/network-store'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { offlineDb } from '@/lib/db/offline-db'

interface OfflineBoulderResult {
  boulders: FeatureCollection<Point, BoulderProperties>
  topos: Record<string, TopoData>
  isOfflineData: boolean
  isLoading: boolean
}

/** Filter mock data for a given sector */
function getMockSectorData(sectorName: string) {
  const features = mockBoulders.features.filter(
    (f) => f.properties.sector === sectorName
  )

  const boulderIds = new Set(features.map((f) => f.properties.id))
  const topos: Record<string, TopoData> = {}
  for (const [id, topo] of Object.entries(mockTopos)) {
    if (boulderIds.has(id)) topos[id] = topo
  }

  const boulders: FeatureCollection<Point, BoulderProperties> = {
    type: 'FeatureCollection',
    features,
  }

  return { boulders, topos }
}

/**
 * Get boulders + topos for a sector, preferring offline IndexedDB data.
 */
export function useOfflineBoulders(
  sectorName: string
): OfflineBoulderResult {
  const isOnline = useNetworkStore((s) => s.isOnline)
  const isSectorOffline = useOfflineSectorStore((s) =>
    s.sectors[sectorName]?.status === 'downloaded'
  )

  const [offlineData, setOfflineData] = useState<{
    boulders: FeatureCollection<Point, BoulderProperties>
    topos: Record<string, TopoData>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only read from IndexedDB when offline and sector is downloaded
    if (isOnline || !isSectorOffline) {
      setOfflineData(null)
      return
    }

    setIsLoading(true)
    offlineDb.sectors
      .get(sectorName)
      .then((sector) => {
        if (sector) {
          setOfflineData({
            boulders: sector.boulders,
            topos: sector.topos,
          })
        }
      })
      .finally(() => setIsLoading(false))
  }, [sectorName, isOnline, isSectorOffline])

  // Prefer offline data when available
  if (offlineData) {
    return {
      boulders: offlineData.boulders,
      topos: offlineData.topos,
      isOfflineData: true,
      isLoading,
    }
  }

  // Fallback to mock data
  const mock = getMockSectorData(sectorName)
  return {
    boulders: mock.boulders,
    topos: mock.topos,
    isOfflineData: false,
    isLoading,
  }
}

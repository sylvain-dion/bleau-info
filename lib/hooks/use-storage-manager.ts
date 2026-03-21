'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import {
  getStorageEstimate,
  type StorageEstimate,
} from '@/lib/offline/storage-quota'

export interface SectorStorageEntry {
  name: string
  sizeBytes: number
  downloadedAt: string
}

export interface StorageManagerState {
  /** Downloaded sectors with size/date info */
  sectors: SectorStorageEntry[]
  /** Sum of all sector sizeBytes from the store */
  totalSectorBytes: number
  /** Browser-reported storage estimate */
  estimate: StorageEstimate
  /** True while fetching the storage estimate */
  isLoading: boolean
  /** Remove a sector and refresh the estimate */
  removeSector: (name: string) => Promise<number>
}

const EMPTY_ESTIMATE: StorageEstimate = { quota: 0, usage: 0, available: 0 }

/** Stable selector — only re-renders when sectors object changes */
const selectSectors = (s: ReturnType<typeof useOfflineSectorStore.getState>) =>
  s.sectors

/** Stable selector — only re-renders when removeSector ref changes */
const selectRemove = (s: ReturnType<typeof useOfflineSectorStore.getState>) =>
  s.removeSector

/**
 * Aggregate storage data for the storage manager UI.
 *
 * Combines Zustand sector metadata with `navigator.storage.estimate()`
 * to show total quota usage and per-pack sizes.
 */
export function useStorageManager(): StorageManagerState {
  const rawSectors = useOfflineSectorStore(selectSectors)
  const storeRemove = useOfflineSectorStore(selectRemove)

  const [estimate, setEstimate] = useState<StorageEstimate>(EMPTY_ESTIMATE)
  const [isLoading, setIsLoading] = useState(true)

  const refreshEstimate = useCallback(async () => {
    setIsLoading(true)
    const result = await getStorageEstimate()
    setEstimate(result)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshEstimate()
  }, [refreshEstimate])

  const sectors: SectorStorageEntry[] = Object.values(rawSectors)
    .filter((s) => s.status === 'downloaded')
    .map((s) => ({
      name: s.name,
      sizeBytes: s.sizeBytes,
      downloadedAt: s.downloadedAt,
    }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)

  const totalSectorBytes = sectors.reduce((sum, s) => sum + s.sizeBytes, 0)

  const removeSector = useCallback(
    async (name: string): Promise<number> => {
      const entry = Object.values(rawSectors).find((s) => s.name === name)
      const freedBytes = entry?.sizeBytes ?? 0

      await storeRemove(name)
      await refreshEstimate()

      return freedBytes
    },
    [rawSectors, storeRemove, refreshEstimate]
  )

  return { sectors, totalSectorBytes, estimate, isLoading, removeSector }
}

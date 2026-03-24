'use client'

import { useState, useEffect } from 'react'
import { useNetworkStore } from '@/stores/network-store'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { useCommentStore } from '@/stores/comment-store'
import { useConditionReportStore } from '@/stores/condition-report-store'
import { offlineDb, type OfflineSector } from '@/lib/db/offline-db'
import type { SectorDetail } from '@/lib/data/boulder-service'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'

interface OfflineSectorPageData {
  sector: SectorDetail
  boulders: BoulderListItem[]
}

interface UseOfflineSectorPageResult {
  /** True when offline and no cached data — show fallback UI */
  showOfflineFallback: boolean
  /** Offline data available — replaces server data */
  offlineData: OfflineSectorPageData | null
  /** True while loading from IndexedDB */
  isLoading: boolean
  /** ISO timestamp of last download */
  downloadedAt: string | null
}

/**
 * Hook for offline-first sector page rendering.
 *
 * When online: returns null (use server-rendered data).
 * When offline + cached: loads from IndexedDB and returns sector + boulders.
 * When offline + not cached: signals to show the fallback UI.
 */
export function useOfflineSectorPage(
  sectorSlug: string,
  sectorName: string
): UseOfflineSectorPageResult {
  const isOnline = useNetworkStore((s) => s.isOnline)
  const sectors = useOfflineSectorStore((s) => s.sectors)
  const sectorState = sectors[sectorName]
  const isCached = sectorState?.status === 'downloaded'

  const [offlineData, setOfflineData] = useState<OfflineSectorPageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOnline || !isCached) {
      setOfflineData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    offlineDb.sectors
      .get(sectorName)
      .then((cached) => {
        if (cancelled || !cached) return
        setOfflineData(buildFromOffline(cached, sectorSlug))
        hydrateCachedData(cached)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [isOnline, isCached, sectorName, sectorSlug])

  return {
    showOfflineFallback: !isOnline && !isCached && !isLoading,
    offlineData: !isOnline && isCached ? offlineData : null,
    isLoading,
    downloadedAt: sectorState?.downloadedAt ?? null,
  }
}

// ---------------------------------------------------------------------------
// Compute SectorDetail from cached OfflineSector
// ---------------------------------------------------------------------------

function buildFromOffline(
  cached: OfflineSector,
  slug: string
): OfflineSectorPageData {
  const features = cached.boulders.features
  const grades = features.map((f) => f.properties.grade).sort()

  const circuitSet = new Set<string>()
  const styles: Record<string, number> = {}

  for (const f of features) {
    if (f.properties.circuit) circuitSet.add(f.properties.circuit)
    const s = f.properties.style
    styles[s] = (styles[s] ?? 0) + 1
  }

  const lngs = features.map((f) => f.geometry.coordinates[0])
  const lats = features.map((f) => f.geometry.coordinates[1])

  const sector: SectorDetail = {
    slug,
    name: cached.name,
    zone: 'Forêt de Fontainebleau',
    boulderCount: features.length,
    gradeMin: grades[0] ?? null,
    gradeMax: grades[grades.length - 1] ?? null,
    circuitCount: circuitSet.size,
    circuitColors: Array.from(circuitSet),
    styleDistribution: styles,
    centroid: {
      latitude: lats.length > 0 ? lats.reduce((a, b) => a + b, 0) / lats.length : 0,
      longitude: lngs.length > 0 ? lngs.reduce((a, b) => a + b, 0) / lngs.length : 0,
    },
    bbox: cached.bbox,
  }

  const boulders: BoulderListItem[] = features.map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    grade: f.properties.grade,
    style: f.properties.style,
    circuit: f.properties.circuit,
    circuitNumber: f.properties.circuitNumber,
    exposure: f.properties.exposure,
  }))

  return { sector, boulders }
}

/**
 * Merge cached comments/conditions into Zustand stores.
 *
 * Only adds items not already present (by id) to avoid duplicates
 * with locally-created offline content.
 */
function hydrateCachedData(cached: OfflineSector): void {
  if (cached.comments?.length) {
    const store = useCommentStore.getState()
    const existingIds = new Set(store.comments.map((c) => c.id))
    const newComments = cached.comments.filter((c) => !existingIds.has(c.id))
    if (newComments.length > 0) {
      useCommentStore.setState((s) => ({
        comments: [...s.comments, ...newComments],
      }))
    }
  }

  if (cached.conditionReports?.length) {
    const store = useConditionReportStore.getState()
    const existingIds = new Set(store.reports.map((r) => r.id))
    const newReports = cached.conditionReports.filter(
      (r) => !existingIds.has(r.id)
    )
    if (newReports.length > 0) {
      useConditionReportStore.setState((s) => ({
        reports: [...s.reports, ...newReports],
      }))
    }
  }
}

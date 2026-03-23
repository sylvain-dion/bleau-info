'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Mountain, ChevronRight } from 'lucide-react'
import { toSlug } from '@/lib/data/boulder-service'
import { useMapStore } from '@/stores/map-store'
import type { Map as MaplibreMap } from 'maplibre-gl'

interface SectorContextBarProps {
  mapRef: React.RefObject<MaplibreMap | null>
}

interface VisibleSector {
  name: string
  count: number
}

const ZOOM_THRESHOLD = 15

/**
 * Contextual bar showing the dominant sector when zoomed in on the map.
 *
 * Appears at the bottom of the map when:
 * - Zoom ≥ 15
 * - A single sector has > 60% of visible boulders
 * - No bottom sheet is open
 */
export function SectorContextBar({ mapRef }: SectorContextBarProps) {
  const selectedFeatureId = useMapStore((s) => s.selectedFeatureId)
  const isSheetOpen = selectedFeatureId != null
  const [sector, setSector] = useState<VisibleSector | null>(null)

  const updateSector = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const zoom = map.getZoom()
    if (zoom < ZOOM_THRESHOLD) {
      setSector(null)
      return
    }

    // Query visible features from the boulders layer
    const features = map.queryRenderedFeatures(undefined, {
      layers: ['boulder-markers'],
    })

    if (!features || features.length === 0) {
      setSector(null)
      return
    }

    // Group by sector
    const counts = new Map<string, number>()
    for (const f of features) {
      const name = f.properties?.sector as string
      if (name) {
        counts.set(name, (counts.get(name) ?? 0) + 1)
      }
    }

    if (counts.size === 0) {
      setSector(null)
      return
    }

    // Find dominant sector (> 60% of visible boulders)
    const total = features.length
    let dominant: VisibleSector | null = null

    for (const [name, count] of counts) {
      if (count / total > 0.6) {
        dominant = { name, count }
        break
      }
    }

    setSector(dominant)
  }, [mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.on('moveend', updateSector)
    map.on('zoomend', updateSector)

    // Initial check
    updateSector()

    return () => {
      map.off('moveend', updateSector)
      map.off('zoomend', updateSector)
    }
  }, [mapRef, updateSector])

  if (!sector || isSheetOpen) return null

  return (
    <Link
      href={`/secteurs/${toSlug(sector.name)}`}
      className="absolute inset-x-4 bottom-4 z-20 flex items-center gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur transition-colors hover:bg-muted"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Mountain className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{sector.name}</p>
        <p className="text-xs text-muted-foreground">
          {sector.count} blocs visibles
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

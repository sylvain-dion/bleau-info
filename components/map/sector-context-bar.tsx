'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Mountain, ChevronRight } from 'lucide-react'
import { toSlug } from '@/lib/data/boulder-service'
import { mockBoulders } from '@/lib/data/mock-boulders'
import { useMapStore } from '@/stores/map-store'
import type { Map as MaplibreMap } from 'maplibre-gl'

interface SectorContextBarProps {
  mapRef: React.RefObject<MaplibreMap | null>
}

interface VisibleSector {
  name: string
  count: number
  total: number
}

const ZOOM_THRESHOLD = 13

/**
 * Contextual bar showing the dominant sector when zoomed in on the map.
 *
 * Computes which boulders fall within the current viewport bounds,
 * groups them by sector, and shows the dominant sector (>60%) if any.
 *
 * Hidden when:
 * - Zoom < 13
 * - No single sector dominates (multiple sectors equally visible)
 * - Bottom sheet is open (boulder selected)
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

    // Get the viewport bounds
    const bounds = map.getBounds()
    const west = bounds.getWest()
    const south = bounds.getSouth()
    const east = bounds.getEast()
    const north = bounds.getNorth()

    // Count boulders per sector within viewport
    const counts = new Map<string, { visible: number; total: number }>()

    // First pass: count total boulders per sector
    for (const feature of mockBoulders.features) {
      const name = feature.properties.sector
      if (!counts.has(name)) {
        counts.set(name, { visible: 0, total: 0 })
      }
      counts.get(name)!.total++
    }

    // Second pass: count visible boulders (within viewport)
    let totalVisible = 0
    for (const feature of mockBoulders.features) {
      const [lng, lat] = feature.geometry.coordinates
      if (lng >= west && lng <= east && lat >= south && lat <= north) {
        const name = feature.properties.sector
        counts.get(name)!.visible++
        totalVisible++
      }
    }

    if (totalVisible === 0) {
      setSector(null)
      return
    }

    // Find dominant sector (>60% of visible boulders)
    let dominant: VisibleSector | null = null

    for (const [name, data] of counts) {
      if (data.visible > 0 && data.visible / totalVisible > 0.6) {
        dominant = { name, count: data.visible, total: data.total }
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
    if (map.loaded()) {
      updateSector()
    } else {
      map.on('load', updateSector)
    }

    return () => {
      map.off('moveend', updateSector)
      map.off('zoomend', updateSector)
      map.off('load', updateSector)
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
          {sector.total} blocs
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

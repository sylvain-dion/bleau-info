'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { ArrowLeft, Crosshair, MapPin } from 'lucide-react'
import { MAP_CENTER, MAP_MAX_ZOOM } from '@/lib/maplibre/config'
import { getMapStyleUrl } from '@/lib/maplibre/styles'
import { useGeolocation } from '@/hooks/use-geolocation'
import { roundCoordinate, formatLatitude, formatLongitude } from '@/lib/coordinates'

/** Zoom level for precise boulder placement */
const PICKER_ZOOM = 18

/** Minimum zoom enforced in picker for precision */
const PICKER_MIN_ZOOM = 14

interface LocationPickerProps {
  /** Called when user confirms a position */
  onConfirm: (coords: { latitude: number; longitude: number }) => void
  /** Called when user cancels */
  onCancel: () => void
  /** Initial position to center on (from previous pick) */
  initialPosition?: { latitude: number; longitude: number } | null
  /** Current theme for map style */
  theme: 'light' | 'dark'
}

/**
 * Full-screen map overlay for precise boulder geolocation.
 *
 * Uses a fixed crosshair pattern (not draggable marker) for
 * better mobile UX. User pans the map to position the crosshair
 * on the boulder. Coordinates update in real-time from map center.
 */
export function LocationPicker({
  onConfirm,
  onCancel,
  initialPosition,
  theme,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: initialPosition?.latitude ?? MAP_CENTER[1],
    lng: initialPosition?.longitude ?? MAP_CENTER[0],
  })
  const [zoom, setZoom] = useState(initialPosition ? PICKER_ZOOM : 15)
  const [mapReady, setMapReady] = useState(false)

  const handleGpsSuccess = useCallback((pos: { latitude: number; longitude: number }) => {
    mapRef.current?.flyTo({
      center: [pos.longitude, pos.latitude],
      zoom: PICKER_ZOOM,
      duration: 1000,
    })
  }, [])

  const { locate, isLocating } = useGeolocation(
    handleGpsSuccess,
    undefined,
    { enableHighAccuracy: true }
  )

  // Initialize MapLibre map
  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(theme),
      center: [center.lng, center.lat],
      zoom,
      minZoom: PICKER_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
    })

    map.on('load', () => {
      setMapReady(true)
    })

    // Update coordinates on every move
    map.on('move', () => {
      const c = map.getCenter()
      setCenter({ lat: c.lat, lng: c.lng })
    })

    map.on('moveend', () => {
      setZoom(Math.round(map.getZoom()))
    })

    mapRef.current = map

    // Auto-locate if no initial position
    if (!initialPosition) {
      locate()
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, [])

  function handleConfirm() {
    onConfirm({
      latitude: roundCoordinate(center.lat),
      longitude: roundCoordinate(center.lng),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      role="dialog"
      aria-label="Placer le bloc sur la carte"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Annuler"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          Placer le bloc
        </h2>
      </div>

      {/* Map container */}
      <div className="relative flex-1">
        <div ref={containerRef} className="h-full w-full" data-testid="location-map" />

        {/* Fixed crosshair overlay */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            {/* Vertical line */}
            <div className="h-6 w-0.5 bg-primary/80" />
            {/* Center dot */}
            <div className="h-3 w-3 rounded-full border-2 border-primary bg-primary/30" />
            {/* Vertical line */}
            <div className="h-6 w-0.5 bg-primary/80" />
          </div>
        </div>

        {/* GPS recenter button */}
        <button
          type="button"
          onClick={locate}
          disabled={isLocating}
          className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg ring-1 ring-border transition-colors hover:bg-muted disabled:opacity-50"
          aria-label="Recentrer sur ma position"
        >
          <Crosshair className={`h-5 w-5 text-primary ${isLocating ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Bottom bar — coordinates + confirm */}
      <div className="border-t border-border bg-background px-4 pb-safe pt-3">
        {/* Coordinates display */}
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span data-testid="coordinates-display">
              {mapReady
                ? `${formatLatitude(center.lat)}, ${formatLongitude(center.lng)}`
                : 'Chargement...'}
            </span>
          </div>
          <span>Zoom {zoom}</span>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!mapReady}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 min-touch"
        >
          Confirmer la position
        </button>
      </div>
    </div>
  )
}

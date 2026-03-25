'use client'

import { useEffect, useRef } from 'react'
import { useGuidedModeStore } from '@/stores/guided-mode-store'
import type { Map as MapLibreMap } from 'maplibre-gl'

const SOURCE_ID = 'user-position-source'
const LAYER_ID = 'user-position-dot'
const HALO_LAYER_ID = 'user-position-halo'

interface UserPositionLayerProps {
  mapRef: React.RefObject<MapLibreMap | null>
}

/**
 * Renders the user's GPS position as a blue dot on the map.
 * Only active when guided mode is on.
 */
export function UserPositionLayer({ mapRef }: UserPositionLayerProps) {
  const isActive = useGuidedModeStore((s) => s.isActive)
  const setUserPosition = useGuidedModeStore((s) => s.setUserPosition)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive || !('geolocation' in navigator)) return

    const map = mapRef.current
    if (!map) return

    // Add source + layers if not present
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      map.addLayer({
        id: HALO_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 16,
          'circle-color': '#4285F4',
          'circle-opacity': 0.15,
        },
      })

      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 7,
          'circle-color': '#4285F4',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserPosition(latitude, longitude)

        const src = map.getSource(SOURCE_ID)
        if (src && 'setData' in src) {
          (src as { setData: (d: GeoJSON.GeoJSON) => void }).setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                properties: {},
              },
            ],
          })
        }
      },
      (err) => {
        console.warn('[GPS] Position error:', err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10_000,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      // Clean up layers
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getLayer(HALO_LAYER_ID)) map.removeLayer(HALO_LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [isActive, mapRef, setUserPosition])

  return null
}

'use client'

import { useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import {
  isGeolocationAvailable,
  isPageVisible,
} from '@/lib/geolocation-guard'
import { MAP_INTERACTION } from '@/lib/maplibre/config'

/**
 * Auto-locate hook — NFR-04 compliant.
 *
 * When the user returns to the app (page becomes visible), this hook
 * triggers a single `getCurrentPosition` call and flies the map to
 * the user's position. Only active if the user has previously used
 * the "Locate me" button (opt-in via `enabled` flag).
 *
 * IMPORTANT: No GPS is requested when the page is in the background.
 * This hook listens for `visibilitychange` and only acts on `visible`.
 */
export function useAutoLocate(
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled: boolean
) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!isGeolocationAvailable()) return

    function handleVisibilityChange() {
      if (!isPageVisible()) return
      if (!enabledRef.current) return
      if (!mapRef.current) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: mapRef.current.getZoom(),
            duration: MAP_INTERACTION.flyToDuration,
          })
        },
        () => {
          // Geolocation denied or failed — silently ignore on auto-locate
        },
        {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 60_000,
        }
      )
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mapRef])
}

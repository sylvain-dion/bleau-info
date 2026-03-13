'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { shouldRequestPosition } from '@/lib/geolocation-guard'

export interface GeoPosition {
  latitude: number
  longitude: number
}

interface UseGeolocationReturn {
  /** Trigger a one-time position request (only if page is visible) */
  locate: () => void
  /** Last known position, or null */
  position: GeoPosition | null
  /** True while a geolocation request is in flight */
  isLocating: boolean
  /** Last geolocation error, or null */
  error: GeolocationPositionError | null
}

interface UseGeolocationOptions {
  /** Request high-accuracy GPS (slower, more battery). Default: false. */
  enableHighAccuracy?: boolean
}

/**
 * Safe geolocation hook — NFR-04 compliant.
 *
 * Wraps `navigator.geolocation.getCurrentPosition` with a visibility
 * guard. Will NOT request GPS if the page is in the background.
 *
 * @param onSuccess Optional callback when position is obtained
 * @param onError Optional callback when geolocation fails
 * @param options Optional geolocation settings
 */
export function useGeolocation(
  onSuccess?: (pos: GeoPosition) => void,
  onError?: () => void,
  options?: UseGeolocationOptions
): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const locate = useCallback(() => {
    if (!shouldRequestPosition()) {
      onError?.()
      return
    }

    setIsLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (result) => {
        if (!mountedRef.current) return
        const pos: GeoPosition = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        }
        setPosition(pos)
        setIsLocating(false)
        onSuccess?.(pos)
      },
      (err) => {
        if (!mountedRef.current) return
        setError(err)
        setIsLocating(false)
        onError?.()
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? false,
        timeout: 10_000,
        maximumAge: 30_000,
      }
    )
  }, [onSuccess, onError, options?.enableHighAccuracy])

  return { locate, position, isLocating, error }
}

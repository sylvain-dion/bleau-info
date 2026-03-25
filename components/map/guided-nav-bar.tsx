'use client'

import { useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Navigation,
  CheckCircle2,
} from 'lucide-react'
import { useGuidedModeStore } from '@/stores/guided-mode-store'
import { useTickStore } from '@/stores/tick-store'
import { distanceMeters, formatDistance, bearing } from '@/lib/geo/distance'
import { getBoulderById } from '@/lib/data/boulder-service'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type { Map as MapLibreMap } from 'maplibre-gl'

interface GuidedNavBarProps {
  mapRef: React.RefObject<MapLibreMap | null>
}

/**
 * Bottom navigation bar for guided circuit mode.
 *
 * Shows current boulder info, prev/next controls, distance
 * to next boulder, and progress indicators.
 */
export function GuidedNavBar({ mapRef }: GuidedNavBarProps) {
  const isActive = useGuidedModeStore((s) => s.isActive)
  const circuitColor = useGuidedModeStore((s) => s.circuitColor)
  const boulderIds = useGuidedModeStore((s) => s.boulderIds)
  const currentIndex = useGuidedModeStore((s) => s.currentIndex)
  const userPosition = useGuidedModeStore((s) => s.userPosition)
  const goNext = useGuidedModeStore((s) => s.goNext)
  const goPrev = useGuidedModeStore((s) => s.goPrev)
  const stopGuide = useGuidedModeStore((s) => s.stopGuide)

  const ticks = useTickStore((s) => s.ticks)
  const tickedIds = useMemo(
    () => new Set(ticks.map((t) => t.boulderId)),
    [ticks]
  )

  const currentBoulder = useMemo(
    () => getBoulderById(boulderIds[currentIndex]) ?? null,
    [boulderIds, currentIndex]
  )

  const nextBoulder = useMemo(
    () => getBoulderById(boulderIds[currentIndex + 1]) ?? null,
    [boulderIds, currentIndex]
  )

  // Distance and bearing to next boulder from user position
  const nextInfo = useMemo(() => {
    if (!userPosition || !nextBoulder) return null
    const dist = distanceMeters(
      userPosition.lat,
      userPosition.lng,
      nextBoulder.latitude,
      nextBoulder.longitude
    )
    const bear = bearing(
      userPosition.lat,
      userPosition.lng,
      nextBoulder.latitude,
      nextBoulder.longitude
    )
    return { distance: dist, bearing: bear }
  }, [userPosition, nextBoulder])

  // Distance from current to next boulder (fallback when no GPS)
  const boulderToBouldeDist = useMemo(() => {
    if (!currentBoulder || !nextBoulder) return null
    return distanceMeters(
      currentBoulder.latitude,
      currentBoulder.longitude,
      nextBoulder.latitude,
      nextBoulder.longitude
    )
  }, [currentBoulder, nextBoulder])

  // Fly map to current boulder when index changes
  useMemo(() => {
    if (!currentBoulder || !mapRef.current) return
    mapRef.current.flyTo({
      center: [currentBoulder.longitude, currentBoulder.latitude],
      zoom: 18,
      duration: 800,
    })
  }, [currentBoulder, mapRef])

  if (!isActive || !currentBoulder) return null

  const hexColor = circuitColor
    ? CIRCUIT_COLORS[circuitColor as keyof typeof CIRCUIT_COLORS] ?? '#888'
    : '#888'

  const isFirst = currentIndex === 0
  const isLast = currentIndex === boulderIds.length - 1
  const isCompleted = tickedIds.has(currentBoulder.id)
  const completedCount = boulderIds.filter((id) => tickedIds.has(id)).length

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[425px] px-3 pb-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / boulderIds.length) * 100}%`,
              backgroundColor: hexColor,
            }}
          />
        </div>

        {/* Main content */}
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Prev button */}
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80 disabled:opacity-30"
            aria-label="Boulder précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Current boulder info */}
          <div className="min-w-0 flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: hexColor }}
              >
                {currentIndex + 1}
              </span>
              <span className="truncate text-sm font-semibold text-foreground">
                {currentBoulder.name}
              </span>
              {isCompleted && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{currentBoulder.grade}</span>
              <span>•</span>
              <span>
                {completedCount}/{boulderIds.length} réalisés
              </span>
              {nextBoulder && (
                <>
                  <span>•</span>
                  {nextInfo ? (
                    <span className="flex items-center gap-0.5">
                      <Navigation
                        className="h-3 w-3"
                        style={{ transform: `rotate(${nextInfo.bearing}deg)` }}
                      />
                      {formatDistance(nextInfo.distance)}
                    </span>
                  ) : (
                    boulderToBouldeDist && (
                      <span>{formatDistance(boulderToBouldeDist)}</span>
                    )
                  )}
                </>
              )}
            </div>
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-30"
            style={{ backgroundColor: hexColor }}
            aria-label="Boulder suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={stopGuide}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Quitter
          </button>
          <div className="flex gap-1">
            {boulderIds.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => useGuidedModeStore.getState().goToIndex(i)}
                className="h-2 w-2 rounded-full transition-all"
                style={{
                  backgroundColor:
                    i === currentIndex
                      ? hexColor
                      : tickedIds.has(id)
                        ? '#22c55e'
                        : '#d4d4d8',
                  transform: i === currentIndex ? 'scale(1.5)' : 'scale(1)',
                }}
                aria-label={`Bloc ${i + 1}`}
              />
            ))}
          </div>
          {isLast ? (
            <span className="text-xs font-medium text-emerald-600">
              Dernier bloc
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{boulderIds.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

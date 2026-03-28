'use client'

import { useEffect, useState } from 'react'
import { Droplets, Wind, Thermometer, Clock } from 'lucide-react'
import {
  fetchRainHistory,
  estimateDryingHours,
  type RainHistory,
  type DryingEstimate,
} from '@/lib/weather/drying-service'

interface DryingHistoryCardProps {
  sectorLat: number
  sectorLng: number
  dominantExposure: string | null
}

/**
 * 7-day rain history chart + drying time estimate.
 *
 * CSS-only bar chart (no charting library).
 * Drying formula accounts for cumulative rain, temp, wind, and exposure.
 */
export function DryingHistoryCard({
  sectorLat,
  sectorLng,
  dominantExposure,
}: DryingHistoryCardProps) {
  const [history, setHistory] = useState<RainHistory | null>(null)
  const [drying, setDrying] = useState<DryingEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchRainHistory(sectorLat, sectorLng).then((data) => {
      if (cancelled) return
      setHistory(data)

      if (data && data.days.length > 0) {
        // Use last 3 days for drying estimate (most relevant)
        const recent = data.days.slice(-3)
        const recentRain = recent.reduce((s, d) => s + d.precipMm, 0)
        const avgTemp =
          recent.reduce((s, d) => s + d.tempMean, 0) / recent.length
        const avgWind =
          recent.reduce((s, d) => s + d.windMax, 0) / recent.length

        setDrying(
          estimateDryingHours(recentRain, avgTemp, avgWind, dominantExposure)
        )
      }

      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [sectorLat, sectorLng, dominantExposure])

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-4">
        <div className="mb-3 h-4 w-32 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
      </div>
    )
  }

  if (!history || history.days.length === 0) return null

  const maxPrecip = Math.max(...history.days.map((d) => d.precipMm), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-foreground">
            Historique de pluie (7 jours)
          </h3>
        </div>
        {drying && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${drying.color}`}
          >
            {drying.label}
          </span>
        )}
      </div>

      {/* Bar chart */}
      <div className="mb-3 flex items-end gap-1" style={{ height: 80 }}>
        {history.days.map((day) => {
          const heightPct =
            day.precipMm > 0
              ? Math.max((day.precipMm / maxPrecip) * 100, 4)
              : 0

          return (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              {/* Bar */}
              <div className="relative flex w-full flex-1 items-end justify-center">
                {day.precipMm > 0 ? (
                  <div
                    className="w-full max-w-[28px] rounded-t bg-blue-400/70 transition-all dark:bg-blue-500/60"
                    style={{ height: `${heightPct}%` }}
                    title={`${day.precipMm.toFixed(1)} mm`}
                  />
                ) : (
                  <div className="h-0.5 w-full max-w-[28px] rounded bg-muted" />
                )}
              </div>
              {/* Label */}
              <span className="text-[10px] text-muted-foreground">
                {day.dayName}
              </span>
            </div>
          )
        })}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplets className="h-3 w-3 text-blue-400" />
          Cumul : {history.totalPrecipMm} mm
        </span>
        {history.days.length > 0 && (
          <>
            <span className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-amber-500" />
              Moy : {Math.round(
                history.days.reduce((s, d) => s + d.tempMean, 0) /
                  history.days.length
              )}°C
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-cyan-500" />
              Vent : {Math.round(
                history.days.reduce((s, d) => s + d.windMax, 0) /
                  history.days.length
              )} km/h
            </span>
          </>
        )}
        {dominantExposure && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Exposition : {dominantExposure}
          </span>
        )}
      </div>

      {/* Source */}
      <p className="mt-2 text-[10px] text-muted-foreground/60">
        Source : Open-Meteo Archive
      </p>
    </div>
  )
}

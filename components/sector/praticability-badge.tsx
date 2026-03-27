'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  computePraticability,
  type PraticabilityScore,
} from '@/lib/weather/praticability'
import { fetchWeatherForecast } from '@/lib/weather/weather-service'
import { useConditionReportStore } from '@/stores/condition-report-store'
import { RECENT_THRESHOLD_MS, type ConditionValue } from '@/lib/validations/condition'
import type { BoulderExposureValue } from '@/lib/validations/boulder'

interface PraticabilityBadgeProps {
  sectorLat: number
  sectorLng: number
  /** Boulder IDs in this sector (for condition report lookup) */
  boulderIds: string[]
  /** Dominant exposure in the sector */
  dominantExposure?: BoulderExposureValue | null
  /** Compact mode (just dot + label, no score) */
  compact?: boolean
}

/**
 * Badge showing the praticability score of a sector.
 *
 * Fetches weather on mount, combines with crowdsource data.
 */
export function PraticabilityBadge({
  sectorLat,
  sectorLng,
  boulderIds,
  dominantExposure = null,
  compact = false,
}: PraticabilityBadgeProps) {
  const [score, setScore] = useState<PraticabilityScore | null>(null)
  const allReports = useConditionReportStore((s) => s.reports)

  const recentConditions = useMemo(() => {
    const cutoff = Date.now() - RECENT_THRESHOLD_MS
    const ids = new Set(boulderIds)
    return allReports
      .filter(
        (r) =>
          ids.has(r.boulderId) &&
          new Date(r.reportedAt).getTime() > cutoff
      )
      .map((r) => r.condition as ConditionValue)
  }, [allReports, boulderIds])

  useEffect(() => {
    let cancelled = false
    fetchWeatherForecast({ lat: sectorLat, lng: sectorLng, days: 3 }).then(
      (forecast) => {
        if (cancelled) return
        const result = computePraticability(
          forecast?.days ?? [],
          dominantExposure,
          recentConditions
        )
        setScore(result)
      }
    )
    return () => {
      cancelled = true
    }
  }, [sectorLat, sectorLng, dominantExposure, recentConditions])

  if (!score || score.level === 'inconnu') return null

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${score.color}`}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor:
              score.level === 'sec'
                ? '#059669'
                : score.level === 'humide'
                  ? '#d97706'
                  : '#dc2626',
          }}
        />
        {score.label}
        {!score.hasCrowdsource && (
          <span className="opacity-60">~</span>
        )}
      </span>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${score.color}`}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{
          backgroundColor:
            score.level === 'sec'
              ? '#059669'
              : score.level === 'humide'
                ? '#d97706'
                : '#dc2626',
        }}
      />
      {score.label}
      {!score.hasCrowdsource && (
        <span className="text-[10px] opacity-60">(estimé)</span>
      )}
    </div>
  )
}

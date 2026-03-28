'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Thermometer,
  Users,
  Clock,
  Wind,
  Droplets,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import {
  fetchWeatherForecast,
  STALE_THRESHOLD_MS,
  type DayForecast,
  type WeatherForecast,
} from '@/lib/weather/weather-service'
import { DryingHistoryCard } from './drying-history-card'
import { useConditionReportStore } from '@/stores/condition-report-store'
import {
  CONDITION_CONFIG,
  RECENT_THRESHOLD_MS,
  ARCHIVE_THRESHOLD_MS,
  type ConditionValue,
} from '@/lib/validations/condition'

import type { RainHistory } from '@/lib/weather/drying-service'

interface SectorWeatherTabProps {
  sectorName: string
  sectorLat?: number
  sectorLng?: number
  bouldersInSector: { id: string; name: string }[]
  /** Cached weather from offline pack (shown with staleness warning) */
  offlineWeather?: {
    forecast: WeatherForecast | null
    rainHistory: RainHistory | null
    praticabilityScore: number | null
    downloadedAt: string
  }
}

/**
 * Météo tab for the sector page.
 *
 * Shows weather forecast (3 or 7 days) from Open-Meteo
 * + aggregated condition reports from all boulders in the sector.
 */
export function SectorWeatherTab({
  sectorName,
  sectorLat,
  sectorLng,
  bouldersInSector,
  offlineWeather,
}: SectorWeatherTabProps) {
  const [forecastDays, setForecastDays] = useState<3 | 7>(3)
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadForecast = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchWeatherForecast({
      lat: sectorLat,
      lng: sectorLng,
      days: forecastDays,
    })
    setForecast(data)
    setIsLoading(false)
  }, [sectorLat, sectorLng, forecastDays])

  useEffect(() => {
    loadForecast()
  }, [loadForecast])

  const isStale = forecast
    ? Date.now() - new Date(forecast.fetchedAt).getTime() > STALE_THRESHOLD_MS
    : false

  // --- Condition reports ---
  const allReports = useConditionReportStore((s) => s.reports)
  const boulderIds = useMemo(
    () => new Set(bouldersInSector.map((b) => b.id)),
    [bouldersInSector]
  )

  const { recentReports, conditionSummary, dominantCondition } = useMemo(() => {
    const now = Date.now()
    const recentCutoff = now - RECENT_THRESHOLD_MS
    const archiveCutoff = now - ARCHIVE_THRESHOLD_MS

    const sectorReports = allReports
      .filter(
        (r) =>
          boulderIds.has(r.boulderId) &&
          new Date(r.reportedAt).getTime() > archiveCutoff
      )
      .sort(
        (a, b) =>
          new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      )

    const recent = sectorReports.filter(
      (r) => new Date(r.reportedAt).getTime() > recentCutoff
    )

    const counts = new Map<ConditionValue, number>()
    for (const r of recent) {
      counts.set(r.condition, (counts.get(r.condition) ?? 0) + 1)
    }

    const summary = Array.from(counts.entries())
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count)

    return {
      recentReports: sectorReports,
      conditionSummary: summary,
      dominantCondition: summary.length > 0 ? summary[0].condition : null,
    }
  }, [allReports, boulderIds])

  return (
    <div className="space-y-6">
      {/* Offline staleness banner */}
      {offlineWeather && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Données météo hors-ligne du{' '}
            {new Date(offlineWeather.downloadedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' '}— non temps réel
          </span>
        </div>
      )}

      {/* Weather forecast */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Prévisions météo
            </h2>
          </div>
          {/* 3/7 day toggle */}
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setForecastDays(3)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                forecastDays === 3
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3 jours
            </button>
            <button
              type="button"
              onClick={() => setForecastDays(7)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                forecastDays === 7
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 jours
            </button>
          </div>
        </div>

        {/* Staleness warning */}
        {isStale && forecast && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Données du {new Date(forecast.fetchedAt).toLocaleDateString('fr-FR')} — peut-être obsolètes
            </span>
            <button
              type="button"
              onClick={loadForecast}
              className="ml-auto shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : forecast ? (
          <div className="space-y-2">
            {forecast.days.map((day) => (
              <DayForecastCard key={day.date} day={day} />
            ))}
            <p className="text-right text-[10px] text-muted-foreground">
              Source : {forecast.source} — mis à jour{' '}
              {formatRelative(forecast.fetchedAt)}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-8 text-center">
            <Thermometer className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Prévisions indisponibles
            </p>
            <button
              type="button"
              onClick={loadForecast}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </section>

      {/* Drying history (Story 10.3) */}
      <DryingHistoryCard
        sectorLat={sectorLat ?? 48.4088}
        sectorLng={sectorLng ?? 2.6988}
        dominantExposure={null}
      />

      {/* Crowdsourced conditions summary */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Conditions terrain — {sectorName}
          </h2>
        </div>

        {conditionSummary.length > 0 ? (
          <>
            {dominantCondition && (
              <div className="mb-3 rounded-lg border border-border bg-card p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  Condition dominante (dernières 48h)
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {CONDITION_CONFIG[dominantCondition].emoji}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {CONDITION_CONFIG[dominantCondition].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    basé sur{' '}
                    {conditionSummary.reduce((s, c) => s + c.count, 0)} report
                    {conditionSummary.reduce((s, c) => s + c.count, 0) > 1
                      ? 's'
                      : ''}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-3 flex flex-wrap gap-2">
              {conditionSummary.map(({ condition, count }) => {
                const config = CONDITION_CONFIG[condition]
                return (
                  <div
                    key={condition}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${config.color}`}
                  >
                    <span>{config.emoji}</span>
                    {config.label}
                    <span className="opacity-70">×{count}</span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucun report de conditions récent
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Reportez les conditions depuis la fiche d&apos;un bloc
            </p>
          </div>
        )}

        {recentReports.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Derniers reports
            </p>
            {recentReports.slice(0, 10).map((report) => {
              const config = CONDITION_CONFIG[report.condition]
              return (
                <div
                  key={report.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="mt-0.5 text-sm">{config.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {report.boulderName}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {report.comment && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {report.comment}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {report.userName} — {formatRelative(report.reportedAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Day forecast card
// ---------------------------------------------------------------------------

function DayForecastCard({ day }: { day: DayForecast }) {
  const conditionColors: Record<string, string> = {
    sec: 'text-amber-600 bg-amber-500/10',
    humide: 'text-blue-600 bg-blue-500/10',
    incertain: 'text-zinc-500 bg-zinc-500/10',
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      {/* Icon + day name */}
      <div className="w-12 shrink-0 text-center">
        <span className="text-xl">{day.icon}</span>
        <p className="mt-0.5 text-xs font-semibold text-foreground">
          {day.dayName}
        </p>
      </div>

      {/* Temps */}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{day.description}</p>
        <p className="text-sm font-bold text-foreground">
          {day.tempMin}° / {day.tempMax}°
        </p>
      </div>

      {/* Wind + precip */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Droplets className="h-3 w-3" />
          {day.precipitationProbMax}%
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Wind className="h-3 w-3" />
          {day.windSpeedMax} km/h
        </div>
      </div>

      {/* Inferred condition */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          conditionColors[day.inferredCondition] ?? conditionColors.incertain
        }`}
      >
        {day.inferredCondition === 'sec'
          ? 'Sec'
          : day.inferredCondition === 'humide'
            ? 'Humide'
            : '~'}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

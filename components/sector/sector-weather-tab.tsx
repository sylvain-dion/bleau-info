'use client'

import { useMemo } from 'react'
import { Thermometer, Users, Clock } from 'lucide-react'
import { WeatherForecastCard } from '@/components/boulder/weather-forecast'
import { useConditionReportStore } from '@/stores/condition-report-store'
import {
  CONDITION_CONFIG,
  RECENT_THRESHOLD_MS,
  ARCHIVE_THRESHOLD_MS,
  type ConditionValue,
} from '@/lib/validations/condition'

interface SectorWeatherTabProps {
  sectorName: string
  bouldersInSector: { id: string; name: string }[]
}

/**
 * Météo tab for the sector page.
 *
 * Shows 3-day weather forecast + aggregated condition reports
 * from all boulders in the sector.
 */
export function SectorWeatherTab({
  sectorName,
  bouldersInSector,
}: SectorWeatherTabProps) {
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

    const dominant = summary.length > 0 ? summary[0].condition : null

    return {
      recentReports: sectorReports,
      conditionSummary: summary,
      dominantCondition: dominant,
    }
  }, [allReports, boulderIds])

  return (
    <div className="space-y-6">
      {/* Weather forecast */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Prévisions météo
          </h2>
        </div>
        <WeatherForecastCard />
      </section>

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
            {/* Dominant condition highlight */}
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
                    basé sur {conditionSummary.reduce((s, c) => s + c.count, 0)} report
                    {conditionSummary.reduce((s, c) => s + c.count, 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Condition breakdown */}
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

        {/* Recent reports list */}
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

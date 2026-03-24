'use client'

import { useState, useMemo } from 'react'
import { Thermometer, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useConditionReportStore } from '@/stores/condition-report-store'
import { SyncStatusPill } from '@/components/ui/sync-status-pill'
import { WeatherForecastCard } from './weather-forecast'
import {
  CONDITION_VALUES,
  CONDITION_CONFIG,
  ARCHIVE_THRESHOLD_MS,
  type ConditionValue,
} from '@/lib/validations/condition'
import { showConditionReportedToast } from '@/lib/feedback'

interface ConditionSectionProps {
  boulderId: string
  boulderName: string
}

/**
 * Condition reporting section for a boulder.
 *
 * Quick selector (5 condition buttons) + optional comment.
 * Shows recent reports below (last 7 days).
 */
export function ConditionSection({
  boulderId,
  boulderName,
}: ConditionSectionProps) {
  const { user } = useAuthStore()
  const allReports = useConditionReportStore((s) => s.reports)
  const addReport = useConditionReportStore((s) => s.addReport)

  const [selected, setSelected] = useState<ConditionValue | null>(null)
  const [comment, setComment] = useState('')

  const recentReports = useMemo(() => {
    const cutoff = Date.now() - ARCHIVE_THRESHOLD_MS
    return allReports
      .filter(
        (r) =>
          r.boulderId === boulderId &&
          new Date(r.reportedAt).getTime() > cutoff
      )
      .sort(
        (a, b) =>
          new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      )
  }, [allReports, boulderId])

  function handleSubmit() {
    if (!selected || !user) return

    addReport({
      userId: user.id,
      userName:
        user.user_metadata?.display_name ?? user.email ?? 'Anonyme',
      boulderId,
      boulderName,
      condition: selected,
      comment: comment.trim(),
    })

    setSelected(null)
    setComment('')
    showConditionReportedToast()
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Thermometer className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Conditions
        </h2>
      </div>

      {/* Weather forecast */}
      <WeatherForecastCard />

      {/* Quick selector */}
      {user ? (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {CONDITION_VALUES.map((cond) => {
              const config = CONDITION_CONFIG[cond]
              const isActive = selected === cond
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() =>
                    setSelected(isActive ? null : cond)
                  }
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? `${config.color} ring-2 ring-current/30`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span>{config.emoji}</span>
                  {config.label}
                </button>
              )
            })}
          </div>

          {/* Comment + submit (visible when a condition is selected) */}
          {selected && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Commentaire optionnel..."
                maxLength={200}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Envoyer
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground">
          Connectez-vous pour reporter les conditions
        </p>
      )}

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <div className="space-y-2">
          {recentReports.map((report) => {
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
                      {report.userName}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <SyncStatusPill syncStatus={report.syncStatus} />
                  </div>
                  {report.comment && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {report.comment}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRelative(report.reportedAt)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {recentReports.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Aucun report récent
        </p>
      )}
    </section>
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

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  CheckCircle2,
  Thermometer,
  Plus,
  TrendingUp,
  ChevronDown,
} from 'lucide-react'
import {
  collectSectorActivity,
  computeWeeklySummary,
  type ActivityEvent,
} from '@/lib/data/activity-feed'
import { useTickStore } from '@/stores/tick-store'
import { useConditionReportStore } from '@/stores/condition-report-store'

interface SectorActivityTabProps {
  boulderIds: string[]
}

const PAGE_SIZE = 10

/**
 * Activity tab for the sector page.
 *
 * Shows weekly summary + paginated event feed.
 */
export function SectorActivityTab({ boulderIds }: SectorActivityTabProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Subscribe to stores for reactivity
  const ticks = useTickStore((s) => s.ticks)
  const reports = useConditionReportStore((s) => s.reports)

  const idSet = useMemo(() => new Set(boulderIds), [boulderIds])

  const events = useMemo(
    () => collectSectorActivity(idSet, 50),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idSet, ticks.length, reports.length]
  )

  const summary = useMemo(
    () => computeWeeklySummary(idSet),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idSet, ticks.length, reports.length]
  )

  const visibleEvents = events.slice(0, visibleCount)
  const hasMore = visibleCount < events.length

  return (
    <div className="space-y-4">
      {/* Weekly summary */}
      {(summary.ticksThisWeek > 0 || summary.conditionsThisWeek > 0) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Cette semaine
            </h3>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {summary.ticksThisWeek > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {summary.ticksThisWeek} ascension{summary.ticksThisWeek > 1 ? 's' : ''}
              </span>
            )}
            {summary.conditionsThisWeek > 0 && (
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3 text-blue-500" />
                {summary.conditionsThisWeek} report{summary.conditionsThisWeek > 1 ? 's' : ''} conditions
              </span>
            )}
            {summary.newBouldersThisWeek > 0 && (
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3 text-amber-500" />
                {summary.newBouldersThisWeek} nouveau{summary.newBouldersThisWeek > 1 ? 'x' : ''} bloc{summary.newBouldersThisWeek > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Popular boulders */}
          {summary.popularBoulders.length > 0 && (
            <div className="mt-3 border-t border-border pt-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Blocs populaires
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.popularBoulders.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blocs/${b.id}`}
                    className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {b.name} · {b.tickCount}×
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event feed */}
      {visibleEvents.length > 0 ? (
        <div className="space-y-1">
          {visibleEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="flex w-full items-center justify-center gap-1 py-3 text-xs font-medium text-primary hover:underline"
            >
              <ChevronDown className="h-3 w-3" />
              Voir plus
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Activity className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucune activité récente
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Loguez des croix pour alimenter le feed
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<string, React.ReactNode> = {
  tick: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  condition: <Thermometer className="h-3.5 w-3.5 text-blue-500" />,
  new_boulder: <Plus className="h-3.5 w-3.5 text-amber-500" />,
}

function EventRow({ event }: { event: ActivityEvent }) {
  const content = (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div className="mt-0.5 shrink-0">
        {event.meta?.conditionEmoji ? (
          <span className="text-sm">{event.meta.conditionEmoji}</span>
        ) : (
          EVENT_ICONS[event.type]
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground">
          <span className="font-medium">{event.userName}</span>{' '}
          {event.description}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {formatRelative(event.timestamp)}
        </p>
      </div>
    </div>
  )

  if (event.boulderId) {
    return (
      <Link href={`/blocs/${event.boulderId}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Il y a ${d}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

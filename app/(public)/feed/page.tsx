'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  CheckCircle2,
  Thermometer,
  Plus,
  Download,
  Sparkles,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'
import { collectGlobalFeed } from '@/lib/data/global-feed'
import { useTickStore } from '@/stores/tick-store'
import { useConditionReportStore } from '@/stores/condition-report-store'
import type { ActivityEvent } from '@/lib/data/activity-feed'

const PAGE_SIZE = 15

export default function FeedPage() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Subscribe for reactivity
  const ticks = useTickStore((s) => s.ticks)
  const reports = useConditionReportStore((s) => s.reports)

  const { events, isDiscoveryMode, followedSectorCount } = useMemo(
    () => collectGlobalFeed(50),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ticks.length, reports.length]
  )

  const visibleEvents = events.slice(0, visibleCount)
  const hasMore = visibleCount < events.length

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Carte
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Activity className="h-5 w-5 text-primary" />
          Fil d&apos;actualité
        </h1>
        {!isDiscoveryMode && (
          <p className="mt-1 text-xs text-muted-foreground">
            Activité de vos {followedSectorCount} secteur{followedSectorCount > 1 ? 's' : ''} suivis
          </p>
        )}
      </div>

      {/* Discovery mode banner */}
      {isDiscoveryMode && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Mode Découverte
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Téléchargez un pack secteur pour personnaliser votre fil
                et suivre l&apos;activité de vos spots préférés.
              </p>
              <Link
                href="/secteurs"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                Parcourir les secteurs
              </Link>
            </div>
          </div>
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aucune activité pour le moment
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Loguez des croix ou reportez des conditions pour alimenter le fil
          </p>
        </div>
      )}
    </main>
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

'use client'

import { useState } from 'react'
import {
  Trophy,
  Mountain,
  Map,
  Route,
  Award,
  Zap,
  Eye,
  Flame,
  CalendarDays,
  Star,
  Sparkles,
} from 'lucide-react'
import { useAchievementsStore } from '@/stores/achievements-store'
import type { AchievementEvent } from '@/lib/achievements'

const ICONS = {
  Trophy,
  Mountain,
  Map,
  Route,
  Award,
  Zap,
  Eye,
  Flame,
  CalendarDays,
  Star,
} as const

const PREVIEW_COUNT = 5

/**
 * Profile page section listing the most recent achievements.
 *
 * Shows the latest 5 by default with a "see all" toggle that
 * expands the list up to the persistence cap (30 entries).
 */
export function AchievementsLog() {
  const log = useAchievementsStore((s) => s.log)
  const [expanded, setExpanded] = useState(false)

  if (log.length === 0) return null

  const visible = expanded ? log : log.slice(0, PREVIEW_COUNT)
  const canExpand = log.length > PREVIEW_COUNT

  return (
    <section
      aria-label="Journal des réussites"
      className="mb-6"
      data-testid="achievements-log"
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        Réussites récentes
        <span className="text-[10px] font-normal text-muted-foreground">
          {log.length}
        </span>
      </h2>
      <ul className="space-y-2">
        {visible.map((event) => (
          <AchievementRow key={event.id + event.earnedAt} event={event} />
        ))}
      </ul>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          {expanded ? 'Réduire' : `Tout voir (${log.length})`}
        </button>
      )}
    </section>
  )
}

function AchievementRow({ event }: { event: AchievementEvent }) {
  const Icon = ICONS[event.icon] ?? Trophy
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className={`h-4 w-4 ${event.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {event.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {event.subtitle}
        </p>
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground/80">
        {formatRelative(event.earnedAt)}
      </span>
    </li>
  )
}

function formatRelative(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = Date.now()
  const diffMs = now - date.getTime()
  const oneMinute = 60_000
  const oneHour = 3_600_000
  const oneDay = 86_400_000

  if (diffMs < oneMinute) return "à l'instant"
  if (diffMs < oneHour) return `il y a ${Math.floor(diffMs / oneMinute)} min`
  if (diffMs < oneDay) return `il y a ${Math.floor(diffMs / oneHour)} h`
  if (diffMs < 7 * oneDay) return `il y a ${Math.floor(diffMs / oneDay)} j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, Clock, ChevronDown, ChevronUp, User } from 'lucide-react'
import { useTickStore } from '@/stores/tick-store'

interface ActivityCounterProps {
  boulderId: string
  /** Compact mode: just a badge with count */
  compact?: boolean
}

/**
 * Shows recent activity on a boulder.
 *
 * Full mode: "X ascensions ce mois" + expandable climber list.
 * Compact mode: small badge with count.
 */
export function ActivityCounter({
  boulderId,
  compact = false,
}: ActivityCounterProps) {
  const ticks = useTickStore((s) => s.ticks)
  const [showClimbers, setShowClimbers] = useState(false)

  const { monthCount, lastAscent, recentClimbers } = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Count local ticks this month
    const monthTicks = ticks.filter(
      (t) =>
        t.boulderId === boulderId &&
        new Date(t.createdAt) >= monthStart
    )

    // Simulate mock community ticks (deterministic from boulderId hash)
    const hash = boulderId
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const mockCount = (hash % 5) // 0-4 mock community ascents

    const totalMonth = monthTicks.length + mockCount

    // Last ascent (all time)
    const allTicks = ticks
      .filter((t) => t.boulderId === boulderId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    const lastLocal = allTicks[0]?.createdAt ?? null

    // Mock community climbers
    const MOCK_NAMES = ['Alex B.', 'Marie L.', 'Thomas R.', 'Léa D.', 'Hugo M.']
    const climbers: { name: string; date: string }[] = []

    // Add local ticks
    if (monthTicks.length > 0) {
      climbers.push({ name: 'Moi', date: monthTicks[0].createdAt })
    }

    // Add mock community (seeded by boulderId)
    for (let i = 0; i < mockCount; i++) {
      const daysAgo = ((hash + i * 7) % 20) + 1
      const date = new Date(now.getTime() - daysAgo * 86400000)
      if (date >= monthStart) {
        climbers.push({
          name: MOCK_NAMES[(hash + i) % MOCK_NAMES.length],
          date: date.toISOString(),
        })
      }
    }

    return {
      monthCount: totalMonth,
      lastAscent: lastLocal,
      recentClimbers: climbers.slice(0, 5),
    }
  }, [ticks, boulderId])

  // Compact badge
  if (compact) {
    if (monthCount === 0) return null
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
        <TrendingUp className="h-2.5 w-2.5" />
        {monthCount}
      </span>
    )
  }

  // Full display
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {monthCount > 0 ? (
            <span className="text-sm font-medium text-foreground">
              {monthCount} ascension{monthCount > 1 ? 's' : ''} ce mois
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Aucune ascension récente
            </span>
          )}
        </div>

        {recentClimbers.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClimbers(!showClimbers)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {showClimbers ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showClimbers ? 'Masquer' : 'Voir qui'}
          </button>
        )}
      </div>

      {lastAscent && monthCount === 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Dernière : {formatRelative(lastAscent)}
        </div>
      )}

      {showClimbers && recentClimbers.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {recentClimbers.map((climber, i) => (
            <div
              key={`${climber.name}-${i}`}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <User className="h-3 w-3" />
              <span className="font-medium text-foreground">
                {climber.name}
              </span>
              <span className="ml-auto">{formatRelative(climber.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return `Il y a ${Math.floor(days / 30)} mois`
}

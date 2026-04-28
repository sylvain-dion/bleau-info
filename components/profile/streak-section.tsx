'use client'

import { Flame, Trophy, CalendarDays } from 'lucide-react'
import {
  computeStreakStats,
  computeActivityCalendar,
  type CalendarCell,
} from '@/lib/streaks'
import type { Tick } from '@/lib/validations/tick'
import { ShareButton } from '@/components/share/share-button'
import { buildStreakShare } from '@/lib/social-share'

interface StreakSectionProps {
  ticks: Tick[]
  /** Number of weeks to display in the calendar heatmap. Default 12. */
  weeks?: number
}

/**
 * Climbing streak banner + 12-week activity calendar (Story 14.2).
 *
 * Renders three stat tiles (current streak, longest streak, total days)
 * and a GitHub-style contribution graph below.
 */
export function StreakSection({ ticks, weeks = 12 }: StreakSectionProps) {
  const stats = computeStreakStats(ticks)
  const cells = computeActivityCalendar(ticks, weeks)

  if (stats.totalClimbingDays === 0) {
    return (
      <section
        aria-label="Activité de grimpe"
        className="mb-6 rounded-xl border border-dashed border-border bg-card p-4 text-center"
      >
        <Flame className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          Loggez votre première croix pour démarrer un streak.
        </p>
      </section>
    )
  }

  const streakShare = buildStreakShare(stats)

  return (
    <section aria-label="Activité de grimpe" className="mb-6">
      {/* Streak summary tiles */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <StreakTile
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          value={stats.currentStreak}
          label="Streak actuel"
          unit="jour"
        />
        <StreakTile
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
          value={stats.longestStreak}
          label="Record"
          unit="jour"
        />
        <StreakTile
          icon={<CalendarDays className="h-4 w-4 text-sky-500" />}
          value={stats.totalClimbingDays}
          label="Jours grimpés"
          unit=""
        />
      </div>

      {/* Share active streak */}
      {streakShare && (
        <div className="mb-3 flex justify-end">
          <ShareButton
            share={streakShare}
            variant="icon"
            ariaLabel="Partager mon streak"
          />
        </div>
      )}

      {/* Calendar heatmap */}
      <ActivityCalendar cells={cells} />
    </section>
  )
}

// ---------------------------------------------------------------------------

interface StreakTileProps {
  icon: React.ReactNode
  value: number
  label: string
  /** Singular unit label appended after the value when value !== 0 */
  unit: string
}

function StreakTile({ icon, value, label, unit }: StreakTileProps) {
  const display = unit
    ? `${value} ${unit}${value > 1 ? 's' : ''}`
    : String(value)
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-2 py-3 text-center">
      {icon}
      <p className="text-base font-bold text-foreground">{display}</p>
      <p className="text-[10px] leading-none text-muted-foreground">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface ActivityCalendarProps {
  cells: CalendarCell[]
}

/**
 * Render the calendar as 7 rows (Mon–Sun) × N week columns.
 * Cells in the future (beyond `cells`) render as empty slots so the
 * grid stays visually rectangular.
 */
function ActivityCalendar({ cells }: ActivityCalendarProps) {
  if (cells.length === 0) return null

  // Group cells into week-columns of 7. The first cell is a Monday.
  const columns: (CalendarCell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    const week: (CalendarCell | null)[] = cells.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    columns.push(week)
  }

  return (
    <div
      className="rounded-lg border border-border bg-card p-3"
      data-testid="activity-calendar"
    >
      <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Activité — {columns.length} dernières semaines</span>
        <span className="flex items-center gap-1">
          Moins
          <span className="flex gap-[2px]">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={`h-2 w-2 rounded-[2px] ${cellColor(level)}`}
              />
            ))}
          </span>
          Plus
        </span>
      </div>
      <div className="flex gap-[3px]" role="grid" aria-label="Calendrier d'activité">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]" role="row">
            {week.map((cell, di) => (
              <CalendarSquare key={`${wi}-${di}`} cell={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarSquare({ cell }: { cell: CalendarCell | null }) {
  if (cell === null) {
    return <span className="h-3 w-3" role="gridcell" aria-hidden="true" />
  }
  const level = intensityLevel(cell.count)
  const labelDate = formatDateFr(cell.date)
  const climbsLabel = cell.count === 0
    ? 'aucune croix'
    : `${cell.count} croix`
  return (
    <span
      role="gridcell"
      title={`${labelDate} — ${climbsLabel}`}
      aria-label={`${labelDate} : ${climbsLabel}`}
      className={`h-3 w-3 rounded-[2px] ${cellColor(level)}`}
    />
  )
}

/** Map a tick-count to a 0..4 intensity bucket. */
function intensityLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

/** Tailwind class for each intensity level. */
function cellColor(level: number): string {
  switch (level) {
    case 0:
      return 'bg-muted'
    case 1:
      return 'bg-emerald-200 dark:bg-emerald-900/60'
    case 2:
      return 'bg-emerald-300 dark:bg-emerald-700'
    case 3:
      return 'bg-emerald-500 dark:bg-emerald-500'
    case 4:
      return 'bg-emerald-700 dark:bg-emerald-300'
    default:
      return 'bg-muted'
  }
}

/** Format YYYY-MM-DD as "27 avr." in French. */
function formatDateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

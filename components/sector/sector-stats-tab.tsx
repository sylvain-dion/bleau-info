'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, BarChart3, Trophy, Star } from 'lucide-react'
import { useTickStore } from '@/stores/tick-store'
import { GradeDistributionChart } from '@/components/stats/grade-distribution-chart'
import {
  computeSectorGradeDistribution,
  computeMonthlyActivity,
  getTopClimbedBoulders,
  getTopRatedBoulders,
} from '@/lib/sector-stats'
import { formatGrade, formatGradeRange, type Grade } from '@/lib/grades'
import type { BoulderListItem } from './boulder-list-card'

interface SectorStatsTabProps {
  boulders: BoulderListItem[]
}

/**
 * Sector statistics tab content (Story 12.4).
 *
 * Shows grade distribution, monthly activity trend,
 * top 5 most climbed, and top 5 community-rated boulders.
 */
export function SectorStatsTab({ boulders }: SectorStatsTabProps) {
  const ticks = useTickStore((s) => s.ticks)

  const boulderIds = useMemo(
    () => new Set(boulders.map((b) => b.id)),
    [boulders]
  )

  const sectorTicks = useMemo(
    () => ticks.filter((t) => boulderIds.has(t.boulderId)),
    [ticks, boulderIds]
  )

  const gradeDistribution = useMemo(
    () => computeSectorGradeDistribution(boulders),
    [boulders]
  )

  const monthlyTrend = useMemo(
    () => computeMonthlyActivity(ticks, boulderIds),
    [ticks, boulderIds]
  )

  const topClimbed = useMemo(
    () => getTopClimbedBoulders(boulders, sectorTicks),
    [boulders, sectorTicks]
  )

  const topRated = useMemo(
    () => getTopRatedBoulders(boulders, sectorTicks),
    [boulders, sectorTicks]
  )

  const gradeMin = (boulders.length > 0 ? boulders.reduce((min, b) => (b.grade < min ? b.grade : min), boulders[0].grade) : null) as Grade | null
  const gradeMax = (boulders.length > 0 ? boulders.reduce((max, b) => (b.grade > max ? b.grade : max), boulders[0].grade) : null) as Grade | null

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Blocs
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {boulders.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatGradeRange(gradeMin, gradeMax)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Ascensions ce mois
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {monthlyTrend.current}
          </p>
          <TrendIndicator trend={monthlyTrend} />
        </div>
      </div>

      {/* Grade distribution */}
      {gradeDistribution.length > 0 && (
        <section>
          <SectionHeader icon={BarChart3} title="Répartition par cotation" />
          <GradeDistributionChart data={gradeDistribution} />
        </section>
      )}

      {/* Top 5 most climbed */}
      {topClimbed.length > 0 && (
        <section>
          <SectionHeader icon={Trophy} title="Les plus grimpés ce mois" />
          <div className="space-y-1">
            {topClimbed.map(({ boulder, count }, i) => (
              <Link
                key={boulder.id}
                href={`/blocs/${boulder.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {boulder.name}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {count} croix
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {boulder.grade}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top 5 community rated */}
      {topRated.length > 0 && (
        <section>
          <SectionHeader icon={Star} title="Les mieux notés" />
          <div className="space-y-1">
            {topRated.map(({ boulder, softGrade, voteCount }, i) => (
              <Link
                key={boulder.id}
                href={`/blocs/${boulder.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {boulder.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {voteCount} vote{voteCount > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground line-through">
                  {formatGrade(boulder.grade)}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {formatGrade(softGrade)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {sectorTicks.length === 0 && topClimbed.every((t) => t.count === 0) && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de données d&apos;activité.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Grimpez et loguez vos croix pour enrichir les statistiques !
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof BarChart3
  title: string
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
  )
}

function TrendIndicator({ trend }: { trend: { current: number; previous: number; trend: 'up' | 'down' | 'stable' } }) {
  if (trend.previous === 0 && trend.current === 0) {
    return (
      <p className="text-xs text-muted-foreground">Pas de données</p>
    )
  }

  const Icon =
    trend.trend === 'up'
      ? TrendingUp
      : trend.trend === 'down'
        ? TrendingDown
        : Minus

  const color =
    trend.trend === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend.trend === 'down'
        ? 'text-red-500 dark:text-red-400'
        : 'text-muted-foreground'

  const label =
    trend.trend === 'up'
      ? `+${trend.current - trend.previous} vs mois dernier`
      : trend.trend === 'down'
        ? `${trend.current - trend.previous} vs mois dernier`
        : 'Stable'

  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

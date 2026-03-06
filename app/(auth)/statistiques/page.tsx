'use client'

import { BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useTickStats } from '@/hooks/use-tick-stats'
import { SummaryCards } from '@/components/stats/summary-cards'
import { AscentsTimelineChart } from '@/components/stats/ascents-timeline-chart'
import { GradeDistributionChart } from '@/components/stats/grade-distribution-chart'
import { StylePieChart } from '@/components/stats/style-pie-chart'
import { StatsEmptyState } from '@/components/stats/stats-empty-state'

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

export default function StatistiquesPage() {
  const { user, isLoading } = useAuthStore()
  const stats = useTickStats()

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Statistiques</h1>
          <p className="text-sm text-muted-foreground">Votre progression en bloc</p>
        </div>
      </div>

      {stats.totalTicks === 0 ? (
        <StatsEmptyState />
      ) : (
        <div className="space-y-5">
          <SummaryCards
            uniqueBoulders={stats.uniqueBoulders}
            totalTicks={stats.totalTicks}
          />
          <ChartCard title="Ascensions par mois">
            <AscentsTimelineChart data={stats.monthlyAscents} />
          </ChartCard>
          <ChartCard title="Répartition par cotation">
            <GradeDistributionChart data={stats.gradeDistribution} />
          </ChartCard>
          <ChartCard title="Style d'ascension">
            <StylePieChart data={stats.styleDistribution} />
          </ChartCard>
        </div>
      )}
    </div>
  )
}

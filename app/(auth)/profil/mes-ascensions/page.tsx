'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ListChecks,
  Mountain,
  Route as RouteIcon,
  TrendingUp,
  BarChart3,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useTickStore } from '@/stores/tick-store'
import { useAnnotationStore } from '@/stores/annotation-store'
import { useTickStats } from '@/hooks/use-tick-stats'
import { useAnnotations } from '@/hooks/use-annotations'
import { mergeAnnotationMonths } from '@/lib/stats'
import { getAllCircuits } from '@/lib/data/mock-circuits'
import {
  selectTicks,
  groupTicksByCircuit,
  orphanTicks,
  uniqueBoulderCount,
  type AscentSortKey,
  type AscentFilters,
} from '@/lib/ascents-hub'
import { AscentsToolbar } from '@/components/profile/ascents-toolbar'
import { AscentsList } from '@/components/profile/ascents-list'
import { CircuitAscentsList } from '@/components/profile/circuit-ascents-list'
import { SummaryCards } from '@/components/stats/summary-cards'
import { AscentsTimelineChart } from '@/components/stats/ascents-timeline-chart'
import { GradeDistributionChart } from '@/components/stats/grade-distribution-chart'
import { StylePieChart } from '@/components/stats/style-pie-chart'
import { StatsEmptyState } from '@/components/stats/stats-empty-state'
import { AnnotationForm } from '@/components/stats/annotation-form'
import { AnnotationList } from '@/components/stats/annotation-list'
import type { Annotation, AnnotationFormData } from '@/lib/validations/annotation'
import type { Tick } from '@/lib/validations/tick'

type TabKey = 'ascents' | 'circuits' | 'stats'

const TABS: ReadonlyArray<{ key: TabKey; label: string; icon: typeof ListChecks }> = [
  { key: 'ascents', label: 'Toutes mes ascensions', icon: ListChecks },
  { key: 'circuits', label: 'Mes circuits', icon: RouteIcon },
  { key: 'stats', label: 'Mes statistiques', icon: BarChart3 },
]

/**
 * /profil/mes-ascensions — Hub regroupant Carnet de croix +
 * progression circuits + statistiques (Story 4.6).
 *
 * Trois onglets sur un même écran avec un header global affichant les
 * deux compteurs synthèse. Refonte de la home /profil et de la page
 * /statistiques accomplie en parallèle.
 */
export default function MesAscensionsPage() {
  const { user, isLoading } = useAuthStore()
  const ticks = useTickStore((s) => s.ticks)
  const completedIds = useMemo(
    () => new Set(ticks.map((t) => t.boulderId)),
    [ticks],
  )
  const [activeTab, setActiveTab] = useState<TabKey>('ascents')

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }
  if (!user) return null

  const totalTicks = ticks.length
  const uniqueCount = uniqueBoulderCount(ticks)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <header className="mb-5">
        <Link
          href="/profil"
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour au profil
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Mountain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mes ascensions</h1>
            <p className="text-sm text-muted-foreground">
              Carnet, circuits et statistiques
            </p>
          </div>
        </div>
      </header>

      {/* Global counters */}
      <div className="mb-5">
        <SummaryCards
          uniqueBoulders={uniqueCount}
          totalTicks={totalTicks}
        />
      </div>

      {/* Tab navigation */}
      <nav
        className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1"
        role="tablist"
        aria-label="Sections du hub"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`tab-panel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors min-touch ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{shortLabel(tab.key)}</span>
            </button>
          )
        })}
      </nav>

      {/* Tab panels */}
      {activeTab === 'ascents' && (
        <div
          id="tab-panel-ascents"
          role="tabpanel"
          aria-labelledby="tab-ascents"
        >
          <AscentsTab ticks={ticks} />
        </div>
      )}
      {activeTab === 'circuits' && (
        <div
          id="tab-panel-circuits"
          role="tabpanel"
          aria-labelledby="tab-circuits"
        >
          <CircuitsTab ticks={ticks} completedIds={completedIds} />
        </div>
      )}
      {activeTab === 'stats' && (
        <div
          id="tab-panel-stats"
          role="tabpanel"
          aria-labelledby="tab-stats"
        >
          <StatsTab />
        </div>
      )}
    </div>
  )
}

function shortLabel(key: TabKey): string {
  switch (key) {
    case 'ascents':
      return 'Ascensions'
    case 'circuits':
      return 'Circuits'
    case 'stats':
      return 'Stats'
  }
}

// ---------------------------------------------------------------------------
// Tab 1 — Toutes mes ascensions
// ---------------------------------------------------------------------------

function AscentsTab({ ticks }: { ticks: Tick[] }) {
  const [filters, setFilters] = useState<AscentFilters>({})
  const [sortKey, setSortKey] = useState<AscentSortKey>('date-desc')

  const filtered = useMemo(
    () => selectTicks(ticks, filters, sortKey),
    [ticks, filters, sortKey],
  )

  if (ticks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <Mountain className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">Aucune croix</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Loguez votre première ascension depuis la fiche d&apos;un bloc.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AscentsToolbar
        filters={filters}
        sortKey={sortKey}
        onFiltersChange={setFilters}
        onSortChange={setSortKey}
        totalCount={ticks.length}
        filteredCount={filtered.length}
      />
      <AscentsList
        ticks={filtered}
        emptyMessage="Aucun bloc ne correspond à ces filtres."
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 — Mes circuits
// ---------------------------------------------------------------------------

function CircuitsTab({
  ticks,
  completedIds,
}: {
  ticks: Tick[]
  completedIds: Set<string>
}) {
  const groups = useMemo(
    () => groupTicksByCircuit(getAllCircuits(), ticks, completedIds),
    [ticks, completedIds],
  )
  const orphans = useMemo(
    () => orphanTicks(getAllCircuits(), ticks),
    [ticks],
  )

  return <CircuitAscentsList groups={groups} orphans={orphans} />
}

// ---------------------------------------------------------------------------
// Tab 3 — Mes statistiques (fusion de l'ancienne page /statistiques)
// ---------------------------------------------------------------------------

function StatsTab() {
  const stats = useTickStats()
  const { annotations, annotationsByMonth } = useAnnotations()
  const { addAnnotation, updateAnnotation, removeAnnotation } = useAnnotationStore()
  const [showForm, setShowForm] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | undefined>(
    undefined,
  )

  const handleAdd = useCallback(
    (data: AnnotationFormData) => {
      addAnnotation(data)
      setShowForm(false)
    },
    [addAnnotation],
  )

  const handleUpdate = useCallback(
    (data: AnnotationFormData) => {
      if (!editingAnnotation) return
      updateAnnotation(editingAnnotation.id, data)
      setEditingAnnotation(undefined)
      setShowForm(false)
    },
    [editingAnnotation, updateAnnotation],
  )

  const handleEdit = useCallback((annotation: Annotation) => {
    setEditingAnnotation(annotation)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingAnnotation(undefined)
  }, [])

  if (stats.totalTicks === 0) {
    return <StatsEmptyState />
  }

  const mergedMonthlyAscents = mergeAnnotationMonths(
    stats.monthlyAscents,
    annotations.map((a) => a.date),
  )

  return (
    <div className="space-y-5">
      <ChartCard
        title="Ascensions par mois"
        action={
          <button
            type="button"
            onClick={() => {
              setEditingAnnotation(undefined)
              setShowForm((prev) => !prev)
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-500 hover:bg-blue-500/10"
            aria-label="Ajouter une annotation"
          >
            <Plus className="h-3.5 w-3.5" />
            Annoter
          </button>
        }
      >
        <AscentsTimelineChart
          data={mergedMonthlyAscents}
          annotationsByMonth={annotationsByMonth}
        />
        {showForm && (
          <div className="mt-4">
            <AnnotationForm
              onSubmit={editingAnnotation ? handleUpdate : handleAdd}
              onClose={handleCloseForm}
              editingAnnotation={editingAnnotation}
            />
          </div>
        )}
        <AnnotationList
          annotations={annotations}
          onEdit={handleEdit}
          onDelete={removeAnnotation}
        />
      </ChartCard>

      <ChartCard title="Répartition par cotation">
        <GradeDistributionChart data={stats.gradeDistribution} />
      </ChartCard>

      <ChartCard title="Style d'ascension">
        <StylePieChart data={stats.styleDistribution} />
      </ChartCard>
    </div>
  )
}

function ChartCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { BarChart3, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useAnnotationStore } from '@/stores/annotation-store'
import { useTickStats } from '@/hooks/use-tick-stats'
import { useAnnotations } from '@/hooks/use-annotations'
import { mergeAnnotationMonths } from '@/lib/stats'
import type { Annotation, AnnotationFormData } from '@/lib/validations/annotation'
import { SummaryCards } from '@/components/stats/summary-cards'
import { AscentsTimelineChart } from '@/components/stats/ascents-timeline-chart'
import { GradeDistributionChart } from '@/components/stats/grade-distribution-chart'
import { StylePieChart } from '@/components/stats/style-pie-chart'
import { StatsEmptyState } from '@/components/stats/stats-empty-state'
import { AnnotationForm } from '@/components/stats/annotation-form'
import { AnnotationList } from '@/components/stats/annotation-list'

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
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function StatistiquesPage() {
  const { user, isLoading } = useAuthStore()
  const stats = useTickStats()
  const { annotations, annotationsByMonth } = useAnnotations()
  const { addAnnotation, updateAnnotation, removeAnnotation } =
    useAnnotationStore()

  const [showForm, setShowForm] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState<
    Annotation | undefined
  >(undefined)

  const handleAdd = useCallback(
    (data: AnnotationFormData) => {
      addAnnotation(data)
      setShowForm(false)
    },
    [addAnnotation]
  )

  const handleUpdate = useCallback(
    (data: AnnotationFormData) => {
      if (!editingAnnotation) return
      updateAnnotation(editingAnnotation.id, data)
      setEditingAnnotation(undefined)
      setShowForm(false)
    },
    [editingAnnotation, updateAnnotation]
  )

  const handleEdit = useCallback((annotation: Annotation) => {
    setEditingAnnotation(annotation)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingAnnotation(undefined)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) return null

  const mergedMonthlyAscents = mergeAnnotationMonths(
    stats.monthlyAscents,
    annotations.map((a) => a.date)
  )

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Statistiques</h1>
          <p className="text-sm text-muted-foreground">
            Votre progression en bloc
          </p>
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
      )}
    </div>
  )
}

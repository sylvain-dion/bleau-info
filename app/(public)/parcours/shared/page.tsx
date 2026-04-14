'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { Route, Navigation, Plus, Check, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { decodeRouteFromUrl } from '@/lib/route-sharing'
import { computeRouteStats } from '@/lib/routes'
import { getBoulderById } from '@/lib/data/boulder-service'
import { formatGrade, formatGradeRange, type Grade } from '@/lib/grades'
import { formatDistance } from '@/lib/geo/distance'
import { useCustomRouteStore } from '@/stores/custom-route-store'
import { useGuidedModeStore } from '@/stores/guided-mode-store'

export default function SharedRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      }
    >
      <SharedRouteContent />
    </Suspense>
  )
}

function SharedRouteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const createRoute = useCustomRouteStore((s) => s.createRoute)
  const addBoulder = useCustomRouteStore((s) => s.addBoulder)
  const startGuide = useGuidedModeStore((s) => s.startGuide)
  const [imported, setImported] = useState(false)

  const routeData = decodeRouteFromUrl(searchParams)

  if (!routeData) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Route className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Lien de parcours invalide ou incomplet.
        </p>
        <Link
          href="/parcours"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Mes parcours
        </Link>
      </main>
    )
  }

  const stats = computeRouteStats(routeData.boulderIds)
  const boulders = routeData.boulderIds
    .map((id) => getBoulderById(id))
    .filter((b) => b !== null)

  function handleImport() {
    const id = createRoute(routeData!.name)
    for (const boulderId of routeData!.boulderIds) {
      addBoulder(id, boulderId)
    }
    setImported(true)
    toast.success('Parcours ajouté à ta collection')
  }

  function handleStartGuide() {
    if (routeData!.boulderIds.length === 0) return
    startGuide(
      `shared-${Date.now()}`,
      '#FF6B00',
      routeData!.boulderIds,
      0
    )
    router.push('/')
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Route className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Parcours partagé
          </p>
          <h1 className="truncate text-lg font-bold text-foreground">
            {routeData.name}
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          {stats.boulderCount} bloc{stats.boulderCount > 1 ? 's' : ''}
        </span>
        {stats.gradeMin && stats.gradeMax && (
          <span>
            {formatGradeRange(stats.gradeMin as Grade, stats.gradeMax as Grade)}
          </span>
        )}
        {stats.totalDistance > 0 && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {formatDistance(stats.totalDistance)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={handleImport}
          disabled={imported}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {imported ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              Ajouté
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Ajouter à mes parcours
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleStartGuide}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Navigation className="h-4 w-4" />
          Mode guidé
        </button>
      </div>

      {/* Boulder list preview */}
      {boulders.length > 0 && (
        <div className="space-y-1">
          {boulders.map((boulder, index) => (
            <Link
              key={boulder.id}
              href={`/blocs/${boulder.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {boulder.name}
              </p>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {formatGrade(boulder.grade)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {boulders.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun bloc reconnu dans ce parcours.
          </p>
        </div>
      )}
    </main>
  )
}

'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  GripVertical,
  MapPin,
  Navigation,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Download,
} from 'lucide-react'
import { useCustomRouteStore, type CustomRoute } from '@/stores/custom-route-store'
import { RouteShareButton } from './route-share-button'
import { useGuidedModeStore } from '@/stores/guided-mode-store'
import { useTickStore } from '@/stores/tick-store'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { getBoulderById } from '@/lib/data/boulder-service'
import { computeRouteStats, isRouteOffline } from '@/lib/routes'
import { formatDistance } from '@/lib/geo/distance'
import { formatGrade, formatGradeRange, type Grade } from '@/lib/grades'

interface RouteDetailProps {
  route: CustomRoute
}

/**
 * Route detail view with ordered boulder list and guided mode launch (Story 9.5).
 */
export function RouteDetail({ route }: RouteDetailProps) {
  const router = useRouter()
  const removeBoulder = useCustomRouteStore((s) => s.removeBoulder)
  const reorderBoulders = useCustomRouteStore((s) => s.reorderBoulders)
  const togglePublic = useCustomRouteStore((s) => s.togglePublic)
  const startGuide = useGuidedModeStore((s) => s.startGuide)
  const ticks = useTickStore((s) => s.ticks)
  const offlineSectors = useOfflineSectorStore((s) => s.sectors)

  const tickedIds = new Set(ticks.map((t) => t.boulderId))
  const stats = computeRouteStats(route.boulderIds)
  const isOffline = isRouteOffline(
    route.boulderIds,
    (name) => offlineSectors[name]?.status === 'downloaded'
  )

  const boulders = route.boulderIds
    .map((id) => getBoulderById(id))
    .filter((b) => b !== null)

  const moveBoulder = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= route.boulderIds.length) return
      const ids = [...route.boulderIds]
      ;[ids[index], ids[newIndex]] = [ids[newIndex], ids[index]]
      reorderBoulders(route.id, ids)
    },
    [route.id, route.boulderIds, reorderBoulders]
  )

  function handleStartGuide() {
    if (route.boulderIds.length === 0) return
    startGuide(route.id, '#FF6B00', route.boulderIds, 0)
    router.push('/')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/parcours"
          className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Retour aux parcours"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground">
            {route.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {stats.boulderCount} bloc{stats.boulderCount > 1 ? 's' : ''}
            </span>
            {stats.gradeMin && stats.gradeMax && (
              <>
                <span>·</span>
                <span>
                  {formatGradeRange(
                    stats.gradeMin as Grade,
                    stats.gradeMax as Grade
                  )}
                </span>
              </>
            )}
            {stats.totalDistance > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {formatDistance(stats.totalDistance)}
                </span>
              </>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Globe className="h-3 w-3" />
          Public
          <button
            type="button"
            role="switch"
            aria-checked={route.isPublic}
            aria-label="Rendre le parcours public"
            onClick={() => togglePublic(route.id)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              route.isPublic
                ? 'bg-primary'
                : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                route.isPublic ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Share + offline status */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <RouteShareButton route={route} />
        {isOffline && (
          <span
            className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            aria-label="Parcours disponible hors-ligne"
            title="Tous les secteurs de ce parcours sont téléchargés"
          >
            <Download className="h-3 w-3" />
            Hors-ligne
          </span>
        )}
      </div>

      {/* Launch guided mode */}
      {route.boulderIds.length > 0 && (
        <button
          type="button"
          onClick={handleStartGuide}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Navigation className="h-4 w-4" />
          Lancer le mode guidé
        </button>
      )}

      {/* Empty state */}
      {boulders.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun bloc dans ce parcours.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Ajoutez des blocs depuis la fiche d&apos;un bloc ou la liste d&apos;un secteur.
          </p>
        </div>
      )}

      {/* Boulder list */}
      {boulders.length > 0 && (
        <div className="space-y-1">
          {boulders.map((boulder, index) => {
            const isTicked = tickedIds.has(boulder.id)
            return (
              <div
                key={boulder.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
                  isTicked
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-border bg-card'
                }`}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <Link
                  href={`/blocs/${boulder.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {boulder.name}
                  </p>
                </Link>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {formatGrade(boulder.grade)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveBoulder(index, -1)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    aria-label="Monter"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBoulder(index, 1)}
                    disabled={index === boulders.length - 1}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBoulder(route.id, boulder.id)}
                    className="rounded p-0.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Retirer ${boulder.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

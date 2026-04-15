'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Route, MapPin, Trash2, Download } from 'lucide-react'
import { useCustomRouteStore } from '@/stores/custom-route-store'
import { useAuthStore } from '@/stores/auth-store'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { computeRouteStats, isRouteOffline } from '@/lib/routes'
import { formatDistance } from '@/lib/geo/distance'
import { formatGradeRange, type Grade } from '@/lib/grades'
import { RouteCreateDialog } from './route-create-dialog'

/**
 * List of user's custom routes with creation button (Story 9.5).
 */
export function RouteList() {
  const routes = useCustomRouteStore((s) => s.routes)
  const createRoute = useCustomRouteStore((s) => s.createRoute)
  const deleteRoute = useCustomRouteStore((s) => s.deleteRoute)
  const user = useAuthStore((s) => s.user)
  const offlineSectors = useOfflineSectorStore((s) => s.sectors)
  const [showCreate, setShowCreate] = useState(false)

  const isSectorOffline = (name: string): boolean =>
    offlineSectors[name]?.status === 'downloaded'

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Route className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour créer des parcours personnalisés.
        </p>
        <Link
          href="/login"
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Mes parcours</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Créer
        </button>
      </div>

      {routes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <Route className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Aucun parcours pour l&apos;instant.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Créez votre premier parcours et ajoutez-y des blocs.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map((route) => {
            const stats = computeRouteStats(route.boulderIds)
            const offline = isRouteOffline(route.boulderIds, isSectorOffline)
            return (
              <div
                key={route.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card transition-colors hover:bg-muted"
              >
                <Link
                  href={`/parcours/${route.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
                >
                  <Route className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {route.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>
                        {stats.boulderCount} bloc
                        {stats.boulderCount > 1 ? 's' : ''}
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
                  {offline && (
                    <span
                      className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      aria-label="Disponible hors-ligne"
                      title="Tous les blocs sont dans un pack téléchargé"
                    >
                      <Download className="h-2.5 w-2.5" />
                      Hors-ligne
                    </span>
                  )}
                  {route.isPublic && (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Public
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => deleteRoute(route.id)}
                  className="mr-3 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label={`Supprimer ${route.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <RouteCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createRoute}
      />
    </>
  )
}

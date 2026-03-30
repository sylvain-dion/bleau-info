'use client'

import { useState } from 'react'
import { Route, Plus, Check } from 'lucide-react'
import { useCustomRouteStore } from '@/stores/custom-route-store'
import { RouteCreateDialog } from './route-create-dialog'

interface AddToRouteMenuProps {
  boulderId: string
  onClose?: () => void
}

/**
 * Inline list to add/remove a boulder from custom routes (Story 9.5).
 *
 * Designed to render inside a Drawer. Shows existing routes with
 * toggle checkmarks and a "Nouveau parcours" option at the bottom.
 */
export function AddToRouteMenu({ boulderId, onClose }: AddToRouteMenuProps) {
  const routes = useCustomRouteStore((s) => s.routes)
  const addBoulder = useCustomRouteStore((s) => s.addBoulder)
  const removeBoulder = useCustomRouteStore((s) => s.removeBoulder)
  const createRoute = useCustomRouteStore((s) => s.createRoute)
  const [showCreate, setShowCreate] = useState(false)

  function handleCreate(name: string) {
    const id = createRoute(name)
    addBoulder(id, boulderId)
  }

  function handleToggle(routeId: string, isInRoute: boolean) {
    if (isInRoute) {
      removeBoulder(routeId, boulderId)
    } else {
      addBoulder(routeId, boulderId)
    }
  }

  return (
    <>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Route className="h-4 w-4 text-primary" />
        Ajouter à un parcours
      </h3>

      {routes.length === 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Aucun parcours. Créez-en un pour commencer.
        </p>
      ) : (
        <div className="mb-3 space-y-1">
          {routes.map((route) => {
            const isInRoute = route.boulderIds.includes(boulderId)
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => handleToggle(route.id, isInRoute)}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                {isInRoute ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded border border-muted-foreground/30" />
                )}
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${isInRoute ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  {route.name}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {route.boulderIds.length} bloc
                  {route.boulderIds.length > 1 ? 's' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
        Nouveau parcours
      </button>

      <RouteCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </>
  )
}

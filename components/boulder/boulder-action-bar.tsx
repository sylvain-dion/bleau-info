'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Drawer } from 'vaul'
import {
  CheckCircle2,
  Plus,
  Bookmark,
  BookmarkCheck,
  Pencil,
  MapPin,
  Route,
} from 'lucide-react'
import { useTickStore, formatTickStyle } from '@/stores/tick-store'
import { useListStore } from '@/stores/list-store'
import { useAuthStore } from '@/stores/auth-store'
import { TickForm } from '@/components/boulder/tick-form'
import { AddToListMenu } from '@/components/boulder/add-to-list-menu'
import { AddToRouteMenu } from '@/components/routes/add-to-route-menu'
import { useCustomRouteStore } from '@/stores/custom-route-store'
import { SuggestionDrawer } from '@/components/boulder/suggestion-drawer'
import type { BoulderProperties } from '@/lib/data/mock-boulders'

/** Serializable props for the action bar (safe across server/client boundary) */
export interface BoulderActionBarProps {
  boulderId: string
  boulderName: string
  grade: string
  style: string
  sector: string
  latitude: number
  longitude: number
  /** Full BoulderProperties for SuggestionDrawer (only available from map view) */
  properties?: BoulderProperties
  /** Coordinates tuple for SuggestionDrawer */
  coordinates?: [number, number]
}

/**
 * Shared action bar for boulder detail views.
 *
 * Fixed at the bottom of the viewport with 4 actions:
 * Tick (drawer), Lists (drawer), Suggest (drawer), Map (link).
 */
export function BoulderActionBar({
  boulderId,
  boulderName,
  grade,
  latitude,
  longitude,
  properties,
  coordinates,
}: BoulderActionBarProps) {
  const [showTickDrawer, setShowTickDrawer] = useState(false)
  const [showListDrawer, setShowListDrawer] = useState(false)
  const [showRouteDrawer, setShowRouteDrawer] = useState(false)
  const [showSuggestionDrawer, setShowSuggestionDrawer] = useState(false)

  const { user } = useAuthStore()
  const isBoulderCompleted = useTickStore((s) => s.isBoulderCompleted)
  const getTicksForBoulder = useTickStore((s) => s.getTicksForBoulder)
  const isBoulderInAnyList = useListStore((s) => s.isBoulderInAnyList)
  const routes = useCustomRouteStore((s) => s.routes)
  const isInAnyRoute = routes.some((r) => r.boulderIds.includes(boulderId))

  const isCompleted = isBoulderCompleted(boulderId)
  const boulderTicks = getTicksForBoulder(boulderId)
  const isBookmarked = isBoulderInAnyList(boulderId)
  const lastTick = boulderTicks[0]

  const buttonClass =
    'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted'

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-around">
          {/* Tick action */}
          <button
            type="button"
            onClick={() => setShowTickDrawer(true)}
            className={buttonClass}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            <span>
              {isCompleted && lastTick
                ? formatTickStyle(lastTick.tickStyle)
                : 'Croix'}
            </span>
          </button>

          {/* Bookmark action */}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setShowListDrawer(true)}
              className={buttonClass}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
              <span>Listes</span>
            </button>
          </div>

          {/* Add to route */}
          {user && (
            <button
              type="button"
              onClick={() => setShowRouteDrawer(true)}
              className={buttonClass}
            >
              <Route
                className={`h-5 w-5 ${isInAnyRoute ? 'text-primary' : ''}`}
              />
              <span>Parcours</span>
            </button>
          )}

          {/* Suggest modification */}
          <button
            type="button"
            onClick={() => setShowSuggestionDrawer(true)}
            disabled={!user}
            className={buttonClass}
          >
            <Pencil className="h-5 w-5" />
            <span>Modifier</span>
          </button>

          {/* View on map */}
          <Link
            href={`/?lat=${latitude}&lng=${longitude}&zoom=18`}
            className={buttonClass}
          >
            <MapPin className="h-5 w-5" />
            <span>Carte</span>
          </Link>
        </div>
      </div>

      {/* Tick form drawer */}
      <Drawer.Root open={showTickDrawer} onOpenChange={setShowTickDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background shadow-xl outline-none">
            <Drawer.Title className="sr-only">Logger une croix</Drawer.Title>
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-muted" />
            <div className="px-4 pb-8">
              <TickForm
                boulderId={boulderId}
                boulderName={boulderName}
                boulderGrade={grade}
                onClose={() => setShowTickDrawer(false)}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Lists drawer */}
      <Drawer.Root open={showListDrawer} onOpenChange={setShowListDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background shadow-xl outline-none">
            <Drawer.Title className="sr-only">Mes listes</Drawer.Title>
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-muted" />
            <div className="pb-8">
              <AddToListMenu
                boulderId={boulderId}
                boulderName={boulderName}
                boulderGrade={grade}
                isOpen={true}
                onClose={() => setShowListDrawer(false)}
                inline
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Route drawer */}
      <Drawer.Root open={showRouteDrawer} onOpenChange={setShowRouteDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background shadow-xl outline-none">
            <Drawer.Title className="sr-only">Mes parcours</Drawer.Title>
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-muted" />
            <div className="px-4 pb-8">
              <AddToRouteMenu
                boulderId={boulderId}
                onClose={() => setShowRouteDrawer(false)}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Suggestion drawer */}
      <SuggestionDrawer
        open={showSuggestionDrawer}
        onOpenChange={setShowSuggestionDrawer}
        suggestionFor={
          properties && coordinates
            ? { id: boulderId, properties, coordinates }
            : undefined
        }
      />
    </>
  )
}

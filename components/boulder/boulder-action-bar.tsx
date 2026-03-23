'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Plus,
  Bookmark,
  BookmarkCheck,
  Pencil,
  MapPin,
} from 'lucide-react'
import { useTickStore, formatTickStyle } from '@/stores/tick-store'
import { useListStore } from '@/stores/list-store'
import { useAuthStore } from '@/stores/auth-store'
import { TickForm } from '@/components/boulder/tick-form'
import { AddToListMenu } from '@/components/boulder/add-to-list-menu'
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
  /** Compact layout for inline use (map bottom sheet) */
  compact?: boolean
}

/**
 * Shared action bar for boulder detail views.
 *
 * Provides tick, bookmark, suggest, and map-link actions.
 * Works on both the static /blocs/[id] page and the map bottom sheet.
 */
export function BoulderActionBar({
  boulderId,
  boulderName,
  grade,
  style,
  sector,
  latitude,
  longitude,
  properties,
  coordinates,
  compact,
}: BoulderActionBarProps) {
  const [showTickForm, setShowTickForm] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showSuggestionDrawer, setShowSuggestionDrawer] = useState(false)

  const { user } = useAuthStore()
  const isBoulderCompleted = useTickStore((s) => s.isBoulderCompleted)
  const getTicksForBoulder = useTickStore((s) => s.getTicksForBoulder)
  const isBoulderInAnyList = useListStore((s) => s.isBoulderInAnyList)

  const isCompleted = isBoulderCompleted(boulderId)
  const boulderTicks = getTicksForBoulder(boulderId)
  const isBookmarked = isBoulderInAnyList(boulderId)
  const lastTick = boulderTicks[0]

  const wrapperClass = compact
    ? 'flex items-center gap-2'
    : 'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur px-4 py-3'

  const buttonClass = compact
    ? 'flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted'
    : 'flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted'

  return (
    <>
      <div className={wrapperClass}>
        {compact ? null : (
          <div className="flex items-center justify-around">
            {/* Tick action */}
            {showTickForm ? (
              <div className="w-full">
                <TickForm
                  boulderId={boulderId}
                  boulderName={boulderName}
                  boulderGrade={grade}
                  onClose={() => setShowTickForm(false)}
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowTickForm(true)}
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowListMenu(!showListMenu)}
                    className={buttonClass}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                    <span>Listes</span>
                  </button>
                  <AddToListMenu
                    boulderId={boulderId}
                    boulderName={boulderName}
                    boulderGrade={grade}
                    isOpen={showListMenu}
                    onClose={() => setShowListMenu(false)}
                  />
                </div>

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
              </>
            )}
          </div>
        )}

        {compact && (
          <>
            <button
              type="button"
              onClick={() => setShowTickForm(true)}
              className={buttonClass}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isCompleted && lastTick
                ? formatTickStyle(lastTick.tickStyle)
                : 'Croix'}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowListMenu(!showListMenu)}
                className={buttonClass}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                Listes
              </button>
              <AddToListMenu
                boulderId={boulderId}
                boulderName={boulderName}
                boulderGrade={grade}
                isOpen={showListMenu}
                onClose={() => setShowListMenu(false)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowSuggestionDrawer(true)}
              disabled={!user}
              className={buttonClass}
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </button>
          </>
        )}
      </div>

      {/* Tick form overlay (compact mode) */}
      {compact && showTickForm && (
        <div className="mt-2">
          <TickForm
            boulderId={boulderId}
            boulderName={boulderName}
            boulderGrade={grade}
            onClose={() => setShowTickForm(false)}
          />
        </div>
      )}

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

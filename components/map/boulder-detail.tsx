'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toSlug } from '@/lib/data/boulder-service'
import {
  Mountain,
  MapPin,
  Palette,
  Sun,
  Cloud,
  CloudSun,
  Baby,
  Hash,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  Pencil,
  Bookmark,
  BookmarkCheck,
  Route,
} from 'lucide-react'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type {
  BoulderProperties,
  CircuitColor,
  BoulderStyle,
  BoulderExposure,
} from '@/lib/data/mock-boulders'
import { getTopoData } from '@/lib/data/mock-topos'
import { formatGrade } from '@/lib/grades'
import { TopoViewer } from '@/components/topo/topo-viewer'
import { VideoCarousel } from '@/components/boulder/video-carousel'
import { TickForm } from '@/components/boulder/tick-form'
import { useTickStore, formatTickStyle } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import { useListStore } from '@/stores/list-store'
import { AddToListMenu } from '@/components/boulder/add-to-list-menu'
import { AddToRouteMenu } from '@/components/routes/add-to-route-menu'
import { useCustomRouteStore } from '@/stores/custom-route-store'
import { SuggestionDrawer } from '@/components/boulder/suggestion-drawer'
import { SectorDownloadButton } from '@/components/offline/sector-download-button'
import { CommentSection } from '@/components/boulder/comment-section'
import { ConditionSection } from '@/components/boulder/condition-section'
import { ConditionBadge } from '@/components/boulder/condition-badge'
import { ActivityCounter } from '@/components/boulder/activity-counter'

/** Labels for boulder styles in French */
const STYLE_LABELS: Record<BoulderStyle, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

/** Labels for exposure in French */
const EXPOSURE_LABELS: Record<BoulderExposure, string> = {
  ombre: 'À l\u2019ombre',
  soleil: 'Au soleil',
  'mi-ombre': 'Mi-ombre',
}

/** Icons for exposure types */
function ExposureIcon({ exposure, className }: { exposure: BoulderExposure; className?: string }) {
  switch (exposure) {
    case 'soleil':
      return <Sun className={className} />
    case 'ombre':
      return <Cloud className={className} />
    case 'mi-ombre':
      return <CloudSun className={className} />
  }
}

/** Circuit color chip with optional shape indicator */
function CircuitBadge({ circuit }: { circuit: CircuitColor }) {
  const color = CIRCUIT_COLORS[circuit]
  const label = circuit.charAt(0).toUpperCase() + circuit.slice(1)

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color: circuit === 'blanc' ? '#71717a' : color,
        border: circuit === 'blanc' ? '1px solid #d4d4d8' : 'none',
      }}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}

interface BoulderDetailProps {
  properties: BoulderProperties
  coordinates: [number, number]
  /** Whether the sheet is expanded beyond Peek state */
  isExpanded: boolean
}

export function BoulderDetail({ properties, coordinates, isExpanded }: BoulderDetailProps) {
  const { name, grade, sector, circuit, circuitNumber, style, exposure, strollerAccessible } =
    properties
  const [showTickForm, setShowTickForm] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showRouteMenu, setShowRouteMenu] = useState(false)
  const [showSuggestionDrawer, setShowSuggestionDrawer] = useState(false)
  const { user } = useAuthStore()
  const isBoulderCompleted = useTickStore((s) => s.isBoulderCompleted)
  const getTicksForBoulder = useTickStore((s) => s.getTicksForBoulder)
  const isBoulderInAnyList = useListStore((s) => s.isBoulderInAnyList)
  const routes = useCustomRouteStore((s) => s.routes)
  const isCompleted = isBoulderCompleted(properties.id)
  const boulderTicks = getTicksForBoulder(properties.id)
  const isBookmarked = isBoulderInAnyList(properties.id)
  const isInAnyRoute = routes.some((r) => r.boulderIds.includes(properties.id))

  return (
    <div className="space-y-4">
      {/* ── Peek content: always visible ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-foreground">{name}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <Link
              href={`/secteurs/${toSlug(sector)}`}
              className="hover:text-foreground hover:underline"
            >
              {sector}
            </Link>
          </div>
        </div>

        {/* Grade badge + bookmark */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowListMenu(!showListMenu)}
              disabled={!user}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors min-touch ${
                isBookmarked
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } disabled:opacity-50`}
              aria-label={isBookmarked ? 'Modifier les listes' : 'Ajouter à une liste'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
            <AddToListMenu
              boulderId={properties.id}
              boulderName={name}
              boulderGrade={grade}
              isOpen={showListMenu}
              onClose={() => setShowListMenu(false)}
            />
          </div>
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRouteMenu(!showRouteMenu)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors min-touch ${
                  isInAnyRoute
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                aria-label={isInAnyRoute ? 'Modifier les parcours' : 'Ajouter à un parcours'}
              >
                <Route className="h-5 w-5" />
              </button>
              {showRouteMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg">
                  <AddToRouteMenu
                    boulderId={properties.id}
                    onClose={() => setShowRouteMenu(false)}
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col items-center rounded-lg bg-primary/10 px-3 py-1.5">
            <span className="text-xl font-bold text-primary">{formatGrade(grade)}</span>
          </div>
        </div>
      </div>

      {/* Circuit + Style tags (always visible) */}
      <div className="flex flex-wrap items-center gap-2">
        {circuit && <CircuitBadge circuit={circuit} />}
        {circuitNumber && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Hash className="h-3 w-3" />
            {circuitNumber}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Mountain className="h-3 w-3" />
          {STYLE_LABELS[style]}
        </span>
        <ConditionBadge boulderId={properties.id} />
        <ActivityCounter boulderId={properties.id} compact />
      </div>

      {/* ── Half/Full content: shown when expanded ── */}
      {isExpanded && (
        <>
          {/* Divider */}
          <div className="border-t border-border" />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Exposure */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ExposureIcon exposure={exposure} className="h-4 w-4 text-muted-foreground" />
                {EXPOSURE_LABELS[exposure]}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Exposition</p>
            </div>

            {/* Stroller access */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Baby className="h-4 w-4 text-muted-foreground" />
                {strollerAccessible ? 'Oui' : 'Non'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Accès poussette</p>
            </div>

            {/* Style */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Palette className="h-4 w-4 text-muted-foreground" />
                {STYLE_LABELS[style]}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Style d&apos;escalade</p>
            </div>

            {/* Coordinates */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                {coordinates[1].toFixed(5)}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {coordinates[0].toFixed(5)}
              </p>
            </div>
          </div>

          {/* Activity counter (full) */}
          <ActivityCounter boulderId={properties.id} />

          {/* Topo viewer or placeholder */}
          <div className="border-t border-border pt-4">
            <TopoSection name={name} boulderId={properties.id} />
          </div>

          {/* Sector download (Story 6.1) */}
          <div className="border-t border-border pt-4">
            <SectorDownloadButton sectorName={sector} />
          </div>

          {/* Video carousel (Story 5.7+) */}
          <VideoCarousel
            boulderId={properties.id}
            mockVideos={properties.videos}
          />

          {/* Comments (Story 8.1) */}
          <div className="border-t border-border pt-4">
            <ConditionSection boulderId={properties.id} boulderName={name} />
            <CommentSection boulderId={properties.id} boulderName={name} />
          </div>

          {/* Tick logging section */}
          <div className="border-t border-border pt-4">
            {/* Existing ticks summary */}
            {isCompleted && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-500/10 p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Fait — {boulderTicks.length} croix
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/70">
                    {boulderTicks
                      .slice(0, 2)
                      .map((t) => `${formatTickStyle(t.tickStyle)} le ${new Date(t.tickDate).toLocaleDateString('fr-FR')}`)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            )}

            {/* Tick form or button */}
            {showTickForm ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <TickForm
                  boulderId={properties.id}
                  boulderName={name}
                  boulderGrade={grade}
                  onClose={() => setShowTickForm(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTickForm(true)}
                disabled={!user}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 min-touch"
              >
                {isCompleted ? (
                  <>
                    <Plus className="h-4 w-4" />
                    Logger une autre croix
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Logger une croix
                  </>
                )}
              </button>
            )}
            {!user && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Connectez-vous pour enregistrer vos croix
              </p>
            )}
          </div>

          {/* Suggest modification (Story 5.6) */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowSuggestionDrawer(true)}
              disabled={!user}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted min-touch"
            >
              <Pencil className="h-4 w-4" />
              Suggérer une modification
            </button>
            {!user && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Connectez-vous pour suggérer des modifications
              </p>
            )}
          </div>

          {/* Suggestion drawer (Story 5.6) */}
          <SuggestionDrawer
            open={showSuggestionDrawer}
            onOpenChange={setShowSuggestionDrawer}
            suggestionFor={{
              id: properties.id,
              properties,
              coordinates,
            }}
          />
        </>
      )}
    </div>
  )
}

/** Renders TopoViewer if topo data exists, otherwise a placeholder */
function TopoSection({ name, boulderId }: { name: string; boulderId: string }) {
  const topo = getTopoData(boulderId)

  if (!topo) {
    return (
      <>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Topo</h3>
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <div className="text-center">
            <Mountain className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p>Topo non disponible</p>
            <p className="text-xs">Aucun tracé pour ce bloc</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <TopoViewer
      boulderName={name}
      photoUrl={topo.photoUrl}
      circuitColor={topo.circuitColor}
      drawing={topo.drawing}
    />
  )
}

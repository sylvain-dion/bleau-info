'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Check, Zap, Eye, Dumbbell, Star, Target } from 'lucide-react'
import { useTickStore } from '@/stores/tick-store'
import { useListStore } from '@/stores/list-store'

/** Boulder data shape passed from the sector page (server → client) */
export interface BoulderListItem {
  id: string
  name: string
  grade: string
  style: string
  circuit: string | null
  circuitNumber: number | null
}

interface BoulderListCardProps {
  boulder: BoulderListItem
}

const STYLE_LABELS: Record<string, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

const CIRCUIT_COLORS: Record<string, string> = {
  jaune: 'bg-yellow-400',
  orange: 'bg-orange-400',
  bleu: 'bg-blue-500',
  rouge: 'bg-red-500',
  blanc: 'bg-white border border-zinc-300',
  noir: 'bg-zinc-900',
}

const TICK_STYLE_ICONS: Record<string, typeof Zap> = {
  flash: Zap,
  'à_vue': Eye,
  travaillé: Dumbbell,
}

/**
 * Single boulder card in the sector list view.
 *
 * Shows name, grade, style, circuit badge, and user status
 * (tick indicator + list badges). Taps navigate to boulder detail.
 *
 * IMPORTANT: Zustand selectors must return stable references.
 * We select raw arrays and derive values with useMemo.
 */
export function BoulderListCard({ boulder }: BoulderListCardProps) {
  // Stable selectors — select raw data, not derived
  const ticks = useTickStore((s) => s.ticks)
  const lists = useListStore((s) => s.lists)

  const { isTicked, tickStyle } = useMemo(() => {
    const tick = ticks.find((t) => t.boulderId === boulder.id)
    return { isTicked: !!tick, tickStyle: tick?.tickStyle ?? null }
  }, [ticks, boulder.id])

  const { isInProject, isInFavorite } = useMemo(() => {
    let project = false
    let favorite = false
    for (const list of lists) {
      if (list.items.some((item) => item.boulderId === boulder.id)) {
        if (list.emoji === '🎯') project = true
        if (list.emoji === '⭐') favorite = true
      }
    }
    return { isInProject: project, isInFavorite: favorite }
  }, [lists, boulder.id])

  const TickIcon = tickStyle ? TICK_STYLE_ICONS[tickStyle] ?? Check : null

  return (
    <Link
      href={`/blocs/${boulder.id}`}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted ${
        isTicked
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
          : 'border-border bg-card'
      }`}
    >
      {/* Circuit indicator */}
      {boulder.circuit ? (
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <div
            className={`h-5 w-5 rounded-full ${CIRCUIT_COLORS[boulder.circuit] ?? 'bg-muted'}`}
            title={`Circuit ${boulder.circuit}`}
          />
          {boulder.circuitNumber != null && (
            <span className="text-[9px] font-bold text-muted-foreground">
              {boulder.circuitNumber}
            </span>
          )}
        </div>
      ) : (
        <div className="w-5 shrink-0" />
      )}

      {/* Boulder info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {boulder.name}
          </p>
          {isInProject && (
            <Target className="h-3 w-3 shrink-0 text-amber-500" aria-label="Projet" />
          )}
          {isInFavorite && (
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Favori" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {STYLE_LABELS[boulder.style] ?? boulder.style}
        </p>
      </div>

      {/* Tick indicator */}
      {isTicked && (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-900/30">
          {TickIcon ? (
            <TickIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Fait
          </span>
        </div>
      )}

      {/* Grade badge */}
      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
        {boulder.grade}
      </span>
    </Link>
  )
}

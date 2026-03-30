'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, TrendingUp, ChevronDown } from 'lucide-react'
import { useTickStore } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import { getRecommendations, getPopularBoulders } from '@/lib/recommendations'
import { RecommendationCard } from './recommendation-card'
import type { BoulderListItem } from './boulder-list-card'

interface RecommendationSectionProps {
  boulders: BoulderListItem[]
}

/**
 * Personalized boulder recommendation accordion (Story 12.2).
 *
 * Collapsed by default. Shows count + subtitle in header.
 * Expands to reveal scored recommendation cards.
 *
 * Authenticated + 5 ticks: "Recommandé pour toi" with scored cards.
 * Authenticated + <5 ticks: "Populaires" fallback.
 * Not authenticated: renders nothing.
 */
export function RecommendationSection({
  boulders,
}: RecommendationSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ticks = useTickStore((s) => s.ticks)
  const user = useAuthStore((s) => s.user)

  const recommendations = useMemo(
    () => getRecommendations(boulders, ticks),
    [boulders, ticks]
  )

  const popularBoulders = useMemo(
    () => getPopularBoulders(boulders, ticks),
    [boulders, ticks]
  )

  if (!user) return null

  const hasEnoughTicks = ticks.length >= 5
  const showPersonalized = hasEnoughTicks && recommendations.length > 0
  const showPopular = !hasEnoughTicks && popularBoulders.length > 0

  if (!showPersonalized && !showPopular) return null

  const count = showPersonalized ? recommendations.length : popularBoulders.length
  const Icon = showPersonalized ? Sparkles : TrendingUp
  const title = showPersonalized
    ? 'Recommandé pour toi'
    : 'Populaires dans ce secteur'
  const subtitle = showPersonalized
    ? `${count} bloc${count > 1 ? 's' : ''} basé${count > 1 ? 's' : ''} sur tes dernières ascensions`
    : `${count} bloc${count > 1 ? 's' : ''} populaire${count > 1 ? 's' : ''} dans ce secteur`
  const ariaLabel = showPersonalized
    ? 'Recommandations personnalisées'
    : 'Blocs populaires'

  return (
    <section aria-label={ariaLabel} className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
        aria-expanded={isOpen}
      >
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {showPersonalized
            ? recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.boulder.id}
                  recommendation={rec}
                />
              ))
            : popularBoulders.map((boulder) => (
                <Link
                  key={boulder.id}
                  href={`/blocs/${boulder.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {boulder.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {boulder.grade}
                  </span>
                </Link>
              ))}
        </div>
      )}
    </section>
  )
}

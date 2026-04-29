'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ChevronRight, History } from 'lucide-react'
import { useTickStore } from '@/stores/tick-store'
import { recentTicks } from '@/lib/ascents-hub'
import { AscentsList } from '@/components/profile/ascents-list'

interface RecentAscentsSectionProps {
  /** How many ticks to show. Default 5. */
  limit?: number
}

/**
 * Profile home block — "Mes dernières ascensions".
 *
 * Surfaces the N most recent ticks with a "Voir tout" link to the
 * dedicated `/profil/mes-ascensions` hub. Hidden when the user has no
 * ticks: the empty state lives on the hub itself, no need to duplicate
 * it on the profile home.
 */
export function RecentAscentsSection({ limit = 5 }: RecentAscentsSectionProps) {
  const ticks = useTickStore((s) => s.ticks)
  const recent = useMemo(() => recentTicks(ticks, limit), [ticks, limit])

  if (recent.length === 0) return null

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-5"
      aria-labelledby="recent-ascents-heading"
      data-testid="recent-ascents-section"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2
            id="recent-ascents-heading"
            className="text-sm font-semibold text-foreground"
          >
            Mes dernières ascensions
          </h2>
        </div>
        <Link
          href="/profil/mes-ascensions"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          data-testid="recent-ascents-see-all"
        >
          Voir tout
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <AscentsList ticks={recent} />
    </section>
  )
}

'use client'

import Link from 'next/link'
import { RecommendationBadge } from './recommendation-badge'
import type { BoulderRecommendation } from '@/lib/recommendations'

const STYLE_LABELS: Record<string, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

interface RecommendationCardProps {
  recommendation: BoulderRecommendation
}

export function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const { boulder, primaryReason } = recommendation

  return (
    <Link
      href={`/blocs/${boulder.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {boulder.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {STYLE_LABELS[boulder.style] ?? boulder.style}
          </span>
          <RecommendationBadge reason={primaryReason} />
        </div>
      </div>

      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
        {boulder.grade}
      </span>
    </Link>
  )
}

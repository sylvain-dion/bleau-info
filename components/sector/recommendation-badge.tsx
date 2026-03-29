'use client'

import { Target, Heart, TrendingUp } from 'lucide-react'
import type { RecommendationReason } from '@/lib/recommendations'

const REASON_CONFIG: Record<
  RecommendationReason,
  { label: string; icon: typeof Target; className: string }
> = {
  grade: {
    label: 'À ton niveau',
    icon: Target,
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  style: {
    label: 'Style que tu aimes',
    icon: Heart,
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  popular: {
    label: 'Populaire',
    icon: TrendingUp,
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
}

interface RecommendationBadgeProps {
  reason: RecommendationReason
}

export function RecommendationBadge({ reason }: RecommendationBadgeProps) {
  const config = REASON_CONFIG[reason]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}
      aria-label={config.label}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {config.label}
    </span>
  )
}

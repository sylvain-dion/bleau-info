'use client'

import { useMemo, useState } from 'react'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useTickStore } from '@/stores/tick-store'
import {
  calculateSoftGrade,
  SOFT_GRADE_MIN_VOTES,
} from '@/lib/grades/soft-grade'
import { GRADE_SCALE } from '@/lib/grades'

interface CommunityGradeBadgeProps {
  boulderId: string
  officialGrade: string
  /** Show full detail with histogram */
  detailed?: boolean
}

/**
 * Shows the community-perceived grade next to the official one.
 *
 * If 5+ votes: "6a → 6a+ (communauté, 23 votes)" + optional histogram
 * If <5 votes: "Quelle cotation lui donnerais-tu ?"
 */
export function CommunityGradeBadge({
  boulderId,
  officialGrade,
  detailed = false,
}: CommunityGradeBadgeProps) {
  const ticks = useTickStore((s) => s.ticks)
  const [showHistogram, setShowHistogram] = useState(false)

  const softGrade = useMemo(() => {
    const boulderTicks = ticks.filter((t) => t.boulderId === boulderId)
    return calculateSoftGrade(boulderTicks, officialGrade)
  }, [ticks, boulderId, officialGrade])

  if (!detailed && !softGrade.hasConsensus) return null

  if (!softGrade.hasConsensus) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>
          {softGrade.voteCount}/{SOFT_GRADE_MIN_VOTES} votes — Quelle
          cotation lui donnerais-tu ?
        </span>
      </div>
    )
  }

  const deviationBadge = softGrade.deviation && (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        softGrade.deviation === 'sous-coté'
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      }`}
    >
      {softGrade.deviation === 'sous-coté' ? 'Sous-coté' : 'Sur-coté'}
    </span>
  )

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold text-foreground">{officialGrade}</span>
          {softGrade.grade !== officialGrade && (
            <>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold text-primary">{softGrade.grade}</span>
            </>
          )}
        </div>

        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="h-3 w-3" />
          {softGrade.voteCount} vote{softGrade.voteCount > 1 ? 's' : ''}
        </span>

        {deviationBadge}

        {detailed && Object.keys(softGrade.distribution).length > 1 && (
          <button
            type="button"
            onClick={() => setShowHistogram(!showHistogram)}
            className="ml-auto flex items-center gap-0.5 text-[10px] text-primary hover:underline"
          >
            {showHistogram ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Détail
          </button>
        )}
      </div>

      {/* Histogram */}
      {showHistogram && (
        <div className="mt-2 space-y-1">
          {GRADE_SCALE.filter((g) => softGrade.distribution[g]).map((grade) => {
            const count = softGrade.distribution[grade]
            const pct = Math.round(
              (count / softGrade.voteCount) * 100
            )
            return (
              <div key={grade} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-right font-mono text-muted-foreground">
                  {grade}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

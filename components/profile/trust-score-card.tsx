'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  getEffectiveRole,
  getNextLevel,
  getTrustProgress,
} from '@/lib/trust'

interface TrustScoreCardProps {
  /** Current trust_score value (default 0) */
  trustScore: number
  /** Explicit role override from user_metadata (e.g. "moderator") */
  role?: string | null
}

/**
 * Displays the user's community trust status:
 * - Role badge with icon and label
 * - Trust score number
 * - Progress bar toward next level (if applicable)
 * - Info tooltip with privilege description
 */
export function TrustScoreCard({ trustScore, role }: TrustScoreCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const currentRole = getEffectiveRole(trustScore, role)
  const nextLevel = getNextLevel(currentRole, trustScore)
  const progress = getTrustProgress(trustScore, currentRole)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Statut communautaire</h2>

        {/* Info button — toggles tooltip on mobile, hover on desktop */}
        <div className="relative">
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Informations sur les privilèges"
            onClick={() => setShowTooltip((prev) => !prev)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="h-4 w-4" />
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg"
              role="tooltip"
            >
              <p className="font-medium text-foreground">{currentRole.label}</p>
              <p className="mt-1">{currentRole.privilege}</p>
              {nextLevel && (
                <p className="mt-2 text-[11px]">
                  Encore <span className="font-semibold text-foreground">{nextLevel.pointsNeeded}</span>{' '}
                  points pour devenir{' '}
                  <span className="font-semibold">{nextLevel.role.label}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badge row */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-hidden="true">
          {currentRole.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-bold ${currentRole.color}`}>
              {currentRole.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {trustScore} pts
            </span>
          </div>

          {/* Progress bar — only shown when there's a next level */}
          {nextLevel ? (
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={trustScore}
                  aria-valuemin={0}
                  aria-valuemax={nextLevel.role.threshold ?? 100}
                  aria-label={`Progression vers ${nextLevel.role.label}`}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {trustScore} / {nextLevel.role.threshold} points
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">Niveau maximum atteint</p>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Trophy,
  Mountain,
  Map,
  Route,
  Award,
  Zap,
  Eye,
  Flame,
  CalendarDays,
  Star,
  Medal,
} from 'lucide-react'
import type { BadgeStatus, BadgeDefinition } from '@/lib/badges'
import { ShareButton } from '@/components/share/share-button'
import { buildBadgeShare } from '@/lib/social-share'

const ICONS: Record<BadgeDefinition['icon'], React.ComponentType<{ className?: string }>> = {
  Trophy,
  Mountain,
  Map,
  Route,
  Award,
  Zap,
  Eye,
  Flame,
  CalendarDays,
  Star,
}

interface BadgesSectionProps {
  badges: BadgeStatus[]
}

/**
 * Grid of earned/locked achievement badges (Story 14.1).
 *
 * Earned badges show in full color; locked badges are desaturated
 * and display a progress ring. Tapping a badge toggles its popover
 * with the description and exact value.
 */
export function BadgesSection({ badges }: BadgesSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (badges.length === 0) return null

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Medal className="h-4 w-4 text-muted-foreground" />
        Badges
        <span className="text-[10px] font-normal text-muted-foreground">
          {earnedCount} / {badges.length}
        </span>
      </h2>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {badges.map((badge) => (
          <BadgeTile
            key={badge.definition.id}
            badge={badge}
            isOpen={openId === badge.definition.id}
            onToggle={() =>
              setOpenId((current) =>
                current === badge.definition.id ? null : badge.definition.id,
              )
            }
          />
        ))}
      </div>
    </section>
  )
}

interface BadgeTileProps {
  badge: BadgeStatus
  isOpen: boolean
  onToggle: () => void
}

function BadgeTile({ badge, isOpen, onToggle }: BadgeTileProps) {
  const Icon = ICONS[badge.definition.icon]
  const earned = badge.earned
  const label = badge.definition.label

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${label} — ${earned ? 'obtenu' : 'non obtenu'}. ${badge.definition.description}`}
        className={`flex w-full flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
          earned
            ? 'border-border bg-card hover:bg-muted'
            : 'border-dashed border-border bg-card/40 hover:bg-muted/40'
        }`}
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          {!earned && <ProgressRing progress={badge.progress} />}
          <Icon
            className={`h-6 w-6 ${
              earned ? badge.definition.color : 'text-muted-foreground/40'
            }`}
          />
        </div>
        <span
          className={`line-clamp-1 text-center text-[10px] font-medium ${
            earned ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute left-1/2 top-full z-10 mt-1 w-44 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-center text-[11px] shadow-lg"
        >
          <p className="font-semibold text-foreground">{badge.definition.label}</p>
          <p className="mt-0.5 text-muted-foreground">
            {badge.definition.description}
          </p>
          {!badge.earned && (
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Progression : {Math.round(badge.progress * 100)}%
            </p>
          )}
          {badge.earned && (
            <div className="mt-2 flex justify-center border-t border-border pt-2">
              <ShareButton
                share={buildBadgeShare(badge)}
                variant="icon"
                ariaLabel={`Partager le badge ${badge.definition.label}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)))

  return (
    <svg
      className="absolute inset-0 h-full w-full -rotate-90"
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/20"
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary/60"
      />
    </svg>
  )
}

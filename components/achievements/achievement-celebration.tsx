'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { useAchievementsStore } from '@/stores/achievements-store'
import type { AchievementEvent } from '@/lib/achievements'
import { ShareButton } from '@/components/share/share-button'
import { buildAchievementShare } from '@/lib/social-share'

const ICONS = {
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
} as const

const HEADLINES: Record<AchievementEvent['kind'], string> = {
  badge: 'Badge débloqué !',
  streak: 'Streak atteint !',
  goal: 'Objectif atteint !',
}

const DISMISS_MS = 3500

/**
 * Mounts at the app root. Reads the achievements queue and shows
 * one celebration at a time. Auto-dismisses after ~3.5s, or earlier
 * on tap. Uses the same overlay shape as the circuit-completion
 * celebration so the visual language stays consistent.
 */
export function AchievementCelebration() {
  const queue = useAchievementsStore((s) => s.queue)
  const shiftQueue = useAchievementsStore((s) => s.shiftQueue)
  const [current, setCurrent] = useState<AchievementEvent | null>(null)

  // Pull the next event when the slot is free.
  useEffect(() => {
    if (current) return
    if (queue.length === 0) return
    setCurrent(shiftQueue())
  }, [current, queue.length, shiftQueue])

  // Auto-dismiss timer.
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => setCurrent(null), DISMISS_MS)
    return () => clearTimeout(t)
  }, [current])

  if (!current) return null

  const Icon = ICONS[current.icon] ?? Trophy

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setCurrent(null)}
      role="status"
      aria-live="polite"
      data-testid="achievement-celebration"
    >
      <div
        className="animate-bounce-in flex w-[min(90vw,360px)] flex-col items-center gap-4 rounded-2xl bg-card p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20">
          <Icon className={`h-10 w-10 ${current.color}`} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {HEADLINES[current.kind]}
          </p>
          <h2 className="mt-1 text-2xl font-black text-foreground">
            {current.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {current.subtitle}
          </p>
        </div>
        <ShareButton
          share={buildAchievementShare(current)}
          ariaLabel={`Partager : ${current.title}`}
        />
      </div>
    </div>
  )
}

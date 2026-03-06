'use client'

import { useMemo } from 'react'
import { useTickStore } from '@/stores/tick-store'
import { computeTickStats, type TickStats } from '@/lib/stats'

/** Derives aggregated statistics from the tick store with memoization */
export function useTickStats(): TickStats {
  const ticks = useTickStore((s) => s.ticks)
  return useMemo(() => computeTickStats(ticks), [ticks])
}

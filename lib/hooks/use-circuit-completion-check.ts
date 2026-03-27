'use client'

import { useEffect, useRef } from 'react'
import { useTickStore } from '@/stores/tick-store'
import { useCircuitCompletionStore } from '@/stores/circuit-completion-store'
import { useCelebrationStore } from '@/components/ui/circuit-completion-celebration'
import { getAllCircuits } from '@/lib/data/mock-circuits'
import { getCircuitProgress } from '@/lib/circuits/circuit-progress'
import { showCircuitCompletedToast } from '@/lib/feedback'

const CIRCUIT_LABELS: Record<string, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}

/**
 * Watches tick store changes and detects newly completed circuits.
 *
 * When a circuit goes from incomplete → complete, triggers the
 * celebration overlay and records the completion date.
 * Mount once in the app layout.
 */
export function useCircuitCompletionCheck(): void {
  const ticks = useTickStore((s) => s.ticks)
  const markComplete = useCircuitCompletionStore((s) => s.markComplete)
  const isCompleted = useCircuitCompletionStore((s) => s.isCompleted)
  const trigger = useCelebrationStore((s) => s.trigger)

  const prevTickCountRef = useRef(ticks.length)

  useEffect(() => {
    // Only check when a new tick is added (count increased)
    if (ticks.length <= prevTickCountRef.current) {
      prevTickCountRef.current = ticks.length
      return
    }
    prevTickCountRef.current = ticks.length

    const completedIds = new Set(ticks.map((t) => t.boulderId))
    const allCircuits = getAllCircuits()

    for (const circuit of allCircuits) {
      // Skip already-recorded completions
      if (isCompleted(circuit.id)) continue

      const progress = getCircuitProgress(circuit, completedIds)
      if (progress.isComplete) {
        const label = CIRCUIT_LABELS[circuit.color] ?? circuit.color
        const name = `Circuit ${label} — ${circuit.sector}`

        markComplete(circuit.id)
        trigger(name)
        showCircuitCompletedToast(name)
        break // One celebration at a time
      }
    }
  }, [ticks, markComplete, isCompleted, trigger])
}

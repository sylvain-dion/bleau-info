/**
 * Pure functions for computing circuit progression.
 *
 * Derives progress from a set of completed boulder IDs
 * and a circuit's ordered boulder list. No store dependency.
 */

import type { CircuitInfo } from '@/lib/data/mock-circuits'

export interface CircuitProgress {
  circuitId: string
  completed: number
  total: number
  percent: number
  isComplete: boolean
}

/** Compute progression for a single circuit */
export function getCircuitProgress(
  circuit: CircuitInfo,
  completedIds: Set<string>
): CircuitProgress {
  const total = circuit.boulderIds.length
  const completed = circuit.boulderIds.filter((id) => completedIds.has(id)).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    circuitId: circuit.id,
    completed,
    total,
    percent,
    isComplete: completed === total && total > 0,
  }
}

/** Get all circuits where the user has ≥1 tick, sorted by % desc */
export function getStartedCircuits(
  allCircuits: CircuitInfo[],
  completedIds: Set<string>
): (CircuitInfo & CircuitProgress)[] {
  return allCircuits
    .map((circuit) => ({
      ...circuit,
      ...getCircuitProgress(circuit, completedIds),
    }))
    .filter((c) => c.completed > 0)
    .sort((a, b) => b.percent - a.percent)
}

/** Get only fully completed circuits */
export function getCompletedCircuits(
  allCircuits: CircuitInfo[],
  completedIds: Set<string>
): (CircuitInfo & CircuitProgress)[] {
  return getStartedCircuits(allCircuits, completedIds).filter((c) => c.isComplete)
}

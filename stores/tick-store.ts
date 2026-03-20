import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tick, TickStyle } from '@/lib/validations/tick'
import type { SyncStatus } from '@/lib/sync/types'

interface TickState {
  /** All logged ticks, newest first */
  ticks: Tick[]

  /** Add a new tick to the store */
  addTick: (tick: Omit<Tick, 'id' | 'createdAt' | 'syncStatus'>) => string

  /** Remove a tick by ID (undo support) */
  removeTick: (tickId: string) => void

  /** Get all ticks for a specific boulder */
  getTicksForBoulder: (boulderId: string) => Tick[]

  /** Check if a boulder has been ticked at least once */
  isBoulderCompleted: (boulderId: string) => boolean

  /** Get the set of all completed boulder IDs (for map layer) */
  getCompletedBoulderIds: () => Set<string>

  /** Update sync status for a tick */
  setSyncStatus: (tickId: string, status: SyncStatus) => void

  /** Get all ticks that need syncing */
  getUnsyncedTicks: () => Tick[]
}

/** Generate a simple unique ID (no crypto needed for local storage) */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useTickStore = create<TickState>()(
  persist(
    (set, get) => ({
      ticks: [],

      addTick: (tickData) => {
        const id = generateId()
        const tick: Tick = {
          ...tickData,
          id,
          syncStatus: 'local',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ ticks: [tick, ...state.ticks] }))
        return id
      },

      removeTick: (tickId) => {
        set((state) => ({
          ticks: state.ticks.filter((t) => t.id !== tickId),
        }))
      },

      getTicksForBoulder: (boulderId) => {
        return get().ticks.filter((t) => t.boulderId === boulderId)
      },

      isBoulderCompleted: (boulderId) => {
        return get().ticks.some((t) => t.boulderId === boulderId)
      },

      getCompletedBoulderIds: () => {
        return new Set(get().ticks.map((t) => t.boulderId))
      },

      setSyncStatus: (tickId, status) => {
        set((state) => ({
          ticks: state.ticks.map((t) =>
            t.id === tickId ? { ...t, syncStatus: status } : t
          ),
        }))
      },

      getUnsyncedTicks: () => {
        return get().ticks.filter(
          (t) => t.syncStatus === 'local' || t.syncStatus === 'error'
        )
      },
    }),
    {
      name: 'bleau-ticks',
    }
  )
)

/** Helper: format a tick style key to its French label */
export function formatTickStyle(style: TickStyle): string {
  const labels: Record<TickStyle, string> = {
    flash: 'Flash',
    a_vue: 'À vue',
    travaille: 'Travaillé',
  }
  return labels[style]
}

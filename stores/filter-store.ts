import { create } from 'zustand'
import type { CircuitColor, BoulderStyle, BoulderExposure, BoulderProperties } from '@/lib/data/mock-boulders'
import type { Grade } from '@/lib/grades'
import { isGradeInRange } from '@/lib/grades'

export interface FilterState {
  /** Selected circuit colors (empty = all) */
  circuits: CircuitColor[]
  /** Selected climbing styles (empty = all) */
  styles: BoulderStyle[]
  /** Minimum grade (null = no minimum) */
  gradeMin: Grade | null
  /** Maximum grade (null = no maximum) */
  gradeMax: Grade | null
  /** Selected exposure types (empty = all) */
  exposures: BoulderExposure[]
  /** Filter for stroller-accessible boulders only */
  strollerOnly: boolean

  // Actions
  toggleCircuit: (circuit: CircuitColor) => void
  toggleStyle: (style: BoulderStyle) => void
  toggleExposure: (exposure: BoulderExposure) => void
  setGradeRange: (min: Grade | null, max: Grade | null) => void
  setStrollerOnly: (value: boolean) => void
  resetFilters: () => void
}

const initialState = {
  circuits: [] as CircuitColor[],
  styles: [] as BoulderStyle[],
  gradeMin: null as Grade | null,
  gradeMax: null as Grade | null,
  exposures: [] as BoulderExposure[],
  strollerOnly: false,
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  toggleCircuit: (circuit) =>
    set((state) => ({
      circuits: state.circuits.includes(circuit)
        ? state.circuits.filter((c) => c !== circuit)
        : [...state.circuits, circuit],
    })),

  toggleStyle: (style) =>
    set((state) => ({
      styles: state.styles.includes(style)
        ? state.styles.filter((s) => s !== style)
        : [...state.styles, style],
    })),

  toggleExposure: (exposure) =>
    set((state) => ({
      exposures: state.exposures.includes(exposure)
        ? state.exposures.filter((e) => e !== exposure)
        : [...state.exposures, exposure],
    })),

  setGradeRange: (min, max) =>
    set({ gradeMin: min, gradeMax: max }),

  setStrollerOnly: (value) =>
    set({ strollerOnly: value }),

  resetFilters: () => set(initialState),
}))

/** Count the number of active filters */
export function countActiveFilters(state: FilterState): number {
  let count = 0
  if (state.circuits.length > 0) count++
  if (state.styles.length > 0) count++
  if (state.gradeMin !== null || state.gradeMax !== null) count++
  if (state.exposures.length > 0) count++
  if (state.strollerOnly) count++
  return count
}

/** Check if a boulder matches the current filters */
export function matchesFilters(props: BoulderProperties, state: FilterState): boolean {
  // Circuit filter
  if (state.circuits.length > 0) {
    if (!props.circuit || !state.circuits.includes(props.circuit)) return false
  }

  // Style filter
  if (state.styles.length > 0) {
    if (!state.styles.includes(props.style)) return false
  }

  // Grade range filter
  if (state.gradeMin !== null || state.gradeMax !== null) {
    if (!isGradeInRange(props.grade, state.gradeMin, state.gradeMax)) return false
  }

  // Exposure filter
  if (state.exposures.length > 0) {
    if (!state.exposures.includes(props.exposure)) return false
  }

  // Stroller accessibility filter
  if (state.strollerOnly) {
    if (!props.strollerAccessible) return false
  }

  return true
}

import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore, countActiveFilters, matchesFilters } from '@/stores/filter-store'
import type { FilterState } from '@/stores/filter-store'
import type { BoulderProperties } from '@/lib/data/mock-boulders'

const defaultBoulder: BoulderProperties = {
  id: 'test-1',
  name: 'Test Boulder',
  grade: '6a',
  sector: 'Test Sector',
  circuit: 'rouge',
  circuitNumber: 1,
  style: 'dalle',
  exposure: 'soleil',
  strollerAccessible: false,
}

function makeBoulder(overrides: Partial<BoulderProperties>): BoulderProperties {
  return { ...defaultBoulder, ...overrides }
}

describe('Filter store', () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters()
  })

  it('should initialize with empty filters', () => {
    const state = useFilterStore.getState()
    expect(state.circuits).toEqual([])
    expect(state.styles).toEqual([])
    expect(state.gradeMin).toBeNull()
    expect(state.gradeMax).toBeNull()
    expect(state.exposures).toEqual([])
    expect(state.strollerOnly).toBe(false)
  })

  describe('toggleCircuit', () => {
    it('should add a circuit when not selected', () => {
      useFilterStore.getState().toggleCircuit('rouge')
      expect(useFilterStore.getState().circuits).toEqual(['rouge'])
    })

    it('should remove a circuit when already selected', () => {
      useFilterStore.getState().toggleCircuit('rouge')
      useFilterStore.getState().toggleCircuit('rouge')
      expect(useFilterStore.getState().circuits).toEqual([])
    })

    it('should support multiple selections', () => {
      useFilterStore.getState().toggleCircuit('rouge')
      useFilterStore.getState().toggleCircuit('bleu')
      expect(useFilterStore.getState().circuits).toEqual(['rouge', 'bleu'])
    })
  })

  describe('toggleStyle', () => {
    it('should toggle styles', () => {
      useFilterStore.getState().toggleStyle('dalle')
      expect(useFilterStore.getState().styles).toEqual(['dalle'])

      useFilterStore.getState().toggleStyle('dalle')
      expect(useFilterStore.getState().styles).toEqual([])
    })
  })

  describe('toggleExposure', () => {
    it('should toggle exposures', () => {
      useFilterStore.getState().toggleExposure('ombre')
      expect(useFilterStore.getState().exposures).toEqual(['ombre'])

      useFilterStore.getState().toggleExposure('ombre')
      expect(useFilterStore.getState().exposures).toEqual([])
    })
  })

  describe('setGradeRange', () => {
    it('should set grade min and max', () => {
      useFilterStore.getState().setGradeRange('5a', '7a')
      const state = useFilterStore.getState()
      expect(state.gradeMin).toBe('5a')
      expect(state.gradeMax).toBe('7a')
    })

    it('should allow null values', () => {
      useFilterStore.getState().setGradeRange('6a', null)
      expect(useFilterStore.getState().gradeMin).toBe('6a')
      expect(useFilterStore.getState().gradeMax).toBeNull()
    })
  })

  describe('setStrollerOnly', () => {
    it('should set stroller filter', () => {
      useFilterStore.getState().setStrollerOnly(true)
      expect(useFilterStore.getState().strollerOnly).toBe(true)
    })
  })

  describe('resetFilters', () => {
    it('should reset all filters to initial state', () => {
      useFilterStore.getState().toggleCircuit('rouge')
      useFilterStore.getState().toggleStyle('dalle')
      useFilterStore.getState().setGradeRange('5a', '7a')
      useFilterStore.getState().toggleExposure('ombre')
      useFilterStore.getState().setStrollerOnly(true)

      useFilterStore.getState().resetFilters()

      const state = useFilterStore.getState()
      expect(state.circuits).toEqual([])
      expect(state.styles).toEqual([])
      expect(state.gradeMin).toBeNull()
      expect(state.gradeMax).toBeNull()
      expect(state.exposures).toEqual([])
      expect(state.strollerOnly).toBe(false)
    })
  })
})

describe('countActiveFilters', () => {
  it('should return 0 for no active filters', () => {
    const state: FilterState = {
      circuits: [],
      styles: [],
      gradeMin: null,
      gradeMax: null,
      exposures: [],
      strollerOnly: false,
      toggleCircuit: vi.fn(),
      toggleStyle: vi.fn(),
      toggleExposure: vi.fn(),
      setGradeRange: vi.fn(),
      setStrollerOnly: vi.fn(),
      resetFilters: vi.fn(),
    }
    expect(countActiveFilters(state)).toBe(0)
  })

  it('should count each active filter category as 1', () => {
    const state: FilterState = {
      circuits: ['rouge', 'bleu'], // counts as 1
      styles: ['dalle'],           // counts as 1
      gradeMin: '5a',
      gradeMax: null,              // counts as 1 (grade range active)
      exposures: [],
      strollerOnly: true,          // counts as 1
      toggleCircuit: vi.fn(),
      toggleStyle: vi.fn(),
      toggleExposure: vi.fn(),
      setGradeRange: vi.fn(),
      setStrollerOnly: vi.fn(),
      resetFilters: vi.fn(),
    }
    expect(countActiveFilters(state)).toBe(4)
  })
})

describe('matchesFilters', () => {
  const emptyFilters: FilterState = {
    circuits: [],
    styles: [],
    gradeMin: null,
    gradeMax: null,
    exposures: [],
    strollerOnly: false,
    toggleCircuit: vi.fn(),
    toggleStyle: vi.fn(),
    toggleExposure: vi.fn(),
    setGradeRange: vi.fn(),
    setStrollerOnly: vi.fn(),
    resetFilters: vi.fn(),
  }

  it('should match all boulders with empty filters', () => {
    expect(matchesFilters(defaultBoulder, emptyFilters)).toBe(true)
  })

  describe('circuit filter', () => {
    it('should match when circuit is in selected circuits', () => {
      const filters = { ...emptyFilters, circuits: ['rouge' as const] }
      expect(matchesFilters(makeBoulder({ circuit: 'rouge' }), filters)).toBe(true)
    })

    it('should not match when circuit is not in selected circuits', () => {
      const filters = { ...emptyFilters, circuits: ['bleu' as const] }
      expect(matchesFilters(makeBoulder({ circuit: 'rouge' }), filters)).toBe(false)
    })

    it('should not match boulders without a circuit when circuit filter is active', () => {
      const filters = { ...emptyFilters, circuits: ['rouge' as const] }
      expect(matchesFilters(makeBoulder({ circuit: null }), filters)).toBe(false)
    })
  })

  describe('style filter', () => {
    it('should match when style is in selected styles', () => {
      const filters = { ...emptyFilters, styles: ['dalle' as const] }
      expect(matchesFilters(makeBoulder({ style: 'dalle' }), filters)).toBe(true)
    })

    it('should not match when style is not in selected styles', () => {
      const filters = { ...emptyFilters, styles: ['toit' as const] }
      expect(matchesFilters(makeBoulder({ style: 'dalle' }), filters)).toBe(false)
    })
  })

  describe('grade filter', () => {
    it('should match when grade is within range', () => {
      const filters = { ...emptyFilters, gradeMin: '5a' as const, gradeMax: '7a' as const }
      expect(matchesFilters(makeBoulder({ grade: '6a' }), filters)).toBe(true)
    })

    it('should not match when grade is below min', () => {
      const filters = { ...emptyFilters, gradeMin: '5a' as const, gradeMax: '7a' as const }
      expect(matchesFilters(makeBoulder({ grade: '3a' }), filters)).toBe(false)
    })

    it('should not match when grade is above max', () => {
      const filters = { ...emptyFilters, gradeMin: '5a' as const, gradeMax: '7a' as const }
      expect(matchesFilters(makeBoulder({ grade: '8a' }), filters)).toBe(false)
    })
  })

  describe('exposure filter', () => {
    it('should match when exposure is in selected exposures', () => {
      const filters = { ...emptyFilters, exposures: ['ombre' as const] }
      expect(matchesFilters(makeBoulder({ exposure: 'ombre' }), filters)).toBe(true)
    })

    it('should not match when exposure is not in selected exposures', () => {
      const filters = { ...emptyFilters, exposures: ['soleil' as const] }
      expect(matchesFilters(makeBoulder({ exposure: 'ombre' }), filters)).toBe(false)
    })
  })

  describe('stroller filter', () => {
    it('should match stroller-accessible boulders when enabled', () => {
      const filters = { ...emptyFilters, strollerOnly: true }
      expect(matchesFilters(makeBoulder({ strollerAccessible: true }), filters)).toBe(true)
    })

    it('should not match non-accessible boulders when enabled', () => {
      const filters = { ...emptyFilters, strollerOnly: true }
      expect(matchesFilters(makeBoulder({ strollerAccessible: false }), filters)).toBe(false)
    })
  })

  describe('combined filters', () => {
    it('should apply all filters together (AND logic)', () => {
      const filters = {
        ...emptyFilters,
        circuits: ['rouge' as const],
        styles: ['dalle' as const],
        gradeMin: '5a' as const,
        gradeMax: '7a' as const,
      }

      // Matches all criteria
      expect(
        matchesFilters(
          makeBoulder({ circuit: 'rouge', style: 'dalle', grade: '6a' }),
          filters
        )
      ).toBe(true)

      // Wrong circuit
      expect(
        matchesFilters(
          makeBoulder({ circuit: 'bleu', style: 'dalle', grade: '6a' }),
          filters
        )
      ).toBe(false)

      // Wrong style
      expect(
        matchesFilters(
          makeBoulder({ circuit: 'rouge', style: 'toit', grade: '6a' }),
          filters
        )
      ).toBe(false)

      // Grade out of range
      expect(
        matchesFilters(
          makeBoulder({ circuit: 'rouge', style: 'dalle', grade: '3a' }),
          filters
        )
      ).toBe(false)
    })
  })
})

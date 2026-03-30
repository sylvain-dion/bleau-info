import { describe, it, expect } from 'vitest'
import {
  calculateSoftGrade,
  RELIABILITY_MIN_VOTES,
  VERIFIED_MAX_STD_DEV,
  DISPUTED_MIN_STD_DEV,
} from '@/lib/grades/soft-grade'
import type { Tick } from '@/lib/validations/tick'

let tickId = 0
function makeTick(perceivedGrade: string): Tick {
  tickId++
  return {
    id: `t-${tickId}`,
    userId: 'user-1',
    boulderId: 'b-1',
    boulderName: 'Test',
    boulderGrade: '5b',
    tickStyle: 'flash',
    tickDate: '2026-03-15',
    personalNote: '',
    perceivedGrade,
    syncStatus: 'local',
    createdAt: new Date().toISOString(),
  }
}

describe('soft-grade reliability (Story 12.5)', () => {
  describe('stdDev computation', () => {
    it('returns 0 stdDev when no consensus', () => {
      const ticks = [makeTick('5b')]
      const result = calculateSoftGrade(ticks, '5b')
      expect(result.stdDev).toBe(0)
    })

    it('returns 0 stdDev when all votes are the same', () => {
      const ticks = Array.from({ length: 10 }, () => makeTick('5b'))
      const result = calculateSoftGrade(ticks, '5b')
      expect(result.stdDev).toBe(0)
    })

    it('returns positive stdDev when votes are spread', () => {
      // Mix of 5a (index 6) and 5c (index 8) — 2 grade steps apart
      const ticks = [
        ...Array.from({ length: 3 }, () => makeTick('5a')),
        ...Array.from({ length: 3 }, () => makeTick('5c')),
      ]
      const result = calculateSoftGrade(ticks, '5b')
      expect(result.stdDev).toBeGreaterThan(0)
    })

    it('computes correct stdDev value', () => {
      // All same grade: stdDev = 0
      const ticks = Array.from({ length: 5 }, () => makeTick('6a'))
      const result = calculateSoftGrade(ticks, '6a')
      expect(result.stdDev).toBeCloseTo(0)
    })
  })

  describe('reliability classification', () => {
    it('returns null reliability when no consensus', () => {
      const ticks = [makeTick('5b'), makeTick('5c')]
      const result = calculateSoftGrade(ticks, '5b')
      expect(result.reliability).toBeNull()
    })

    it('returns "verified" for 10+ tight votes', () => {
      // 10 votes all on the same grade → stdDev = 0 < 0.5
      const ticks = Array.from({ length: RELIABILITY_MIN_VOTES }, () =>
        makeTick('5b')
      )
      const result = calculateSoftGrade(ticks, '5b')
      expect(result.reliability).toBe('verified')
      expect(result.stdDev).toBeLessThan(VERIFIED_MAX_STD_DEV)
    })

    it('does not return "verified" with only 5 votes (below 10)', () => {
      const ticks = Array.from({ length: 5 }, () => makeTick('5b'))
      const result = calculateSoftGrade(ticks, '5b')
      // Has consensus (5 >= 5) but not verified (5 < 10)
      expect(result.hasConsensus).toBe(true)
      expect(result.reliability).not.toBe('verified')
    })

    it('returns "disputed" for highly spread votes', () => {
      // Spread across 3a (index 0) to 6a (index 9) — very high stdDev
      const ticks = [
        ...Array.from({ length: 3 }, () => makeTick('3a')),
        ...Array.from({ length: 2 }, () => makeTick('6a')),
      ]
      const result = calculateSoftGrade(ticks, '5a')
      expect(result.reliability).toBe('disputed')
      expect(result.stdDev).toBeGreaterThan(DISPUTED_MIN_STD_DEV)
    })

    it('returns null reliability for moderate spread', () => {
      // Spread 5a-5c (indices 6-8) — moderate stdDev between 0.5 and 1.0
      const ticks = [
        ...Array.from({ length: 3 }, () => makeTick('5a')),
        ...Array.from({ length: 2 }, () => makeTick('5c')),
      ]
      const result = calculateSoftGrade(ticks, '5b')
      // Should not be verified (stdDev > 0.5) and not disputed (stdDev < 1.0)
      expect(result.reliability).toBeNull()
    })

    it('exports threshold constants', () => {
      expect(RELIABILITY_MIN_VOTES).toBe(10)
      expect(VERIFIED_MAX_STD_DEV).toBe(0.5)
      expect(DISPUTED_MIN_STD_DEV).toBe(1.0)
    })
  })
})

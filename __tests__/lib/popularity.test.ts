import { describe, it, expect } from 'vitest'
import { hashCode, getMockPopularity } from '@/lib/popularity'

describe('hashCode', () => {
  it('returns same value for same input', () => {
    expect(hashCode('boulder-1')).toBe(hashCode('boulder-1'))
  })

  it('returns different values for different inputs', () => {
    expect(hashCode('boulder-1')).not.toBe(hashCode('boulder-2'))
  })

  it('returns sum of char codes', () => {
    expect(hashCode('AB')).toBe(65 + 66)
  })

  it('returns 0 for empty string', () => {
    expect(hashCode('')).toBe(0)
  })
})

describe('getMockPopularity', () => {
  it('returns a number between 0 and 4', () => {
    const ids = ['a', 'boulder-xyz', 'cul-de-chien-01', 'test-123']
    for (const id of ids) {
      const result = getMockPopularity(id)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(4)
    }
  })

  it('is deterministic for the same ID', () => {
    expect(getMockPopularity('bloc-42')).toBe(getMockPopularity('bloc-42'))
  })

  it('matches the original activity-counter hash logic', () => {
    // Original: boulderId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5
    const id = 'cuvier-rempart-08'
    const expected =
      id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5
    expect(getMockPopularity(id)).toBe(expected)
  })
})

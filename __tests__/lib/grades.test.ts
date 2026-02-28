import { describe, it, expect } from 'vitest'
import {
  GRADE_SCALE,
  getGradeIndex,
  isGradeInRange,
  formatGrade,
  formatGradeRange,
} from '@/lib/grades'

describe('Grade utilities', () => {
  describe('GRADE_SCALE', () => {
    it('should contain all standard French bouldering grades', () => {
      expect(GRADE_SCALE).toContain('3a')
      expect(GRADE_SCALE).toContain('6a+')
      expect(GRADE_SCALE).toContain('7b+')
      expect(GRADE_SCALE).toContain('8c')
    })

    it('should be in ascending order', () => {
      for (let i = 1; i < GRADE_SCALE.length; i++) {
        expect(getGradeIndex(GRADE_SCALE[i])).toBeGreaterThan(
          getGradeIndex(GRADE_SCALE[i - 1])
        )
      }
    })
  })

  describe('getGradeIndex', () => {
    it('should return correct index for known grades', () => {
      expect(getGradeIndex('3a')).toBe(0)
      expect(getGradeIndex('6a')).toBe(9)
      expect(getGradeIndex('8c')).toBe(GRADE_SCALE.length - 1)
    })

    it('should return -1 for unknown grades', () => {
      expect(getGradeIndex('unknown')).toBe(-1)
      expect(getGradeIndex('9a')).toBe(-1)
    })

    it('should be case-insensitive', () => {
      expect(getGradeIndex('6A')).toBe(getGradeIndex('6a'))
      expect(getGradeIndex('6A+')).toBe(getGradeIndex('6a+'))
    })
  })

  describe('isGradeInRange', () => {
    it('should return true when grade is within range', () => {
      expect(isGradeInRange('5a', '4a', '6a')).toBe(true)
      expect(isGradeInRange('6a', '6a', '6a')).toBe(true) // inclusive
    })

    it('should return false when grade is below min', () => {
      expect(isGradeInRange('3a', '5a', '7a')).toBe(false)
    })

    it('should return false when grade is above max', () => {
      expect(isGradeInRange('8a', '5a', '7a')).toBe(false)
    })

    it('should handle null min (no lower bound)', () => {
      expect(isGradeInRange('3a', null, '6a')).toBe(true)
      expect(isGradeInRange('7a', null, '6a')).toBe(false)
    })

    it('should handle null max (no upper bound)', () => {
      expect(isGradeInRange('8a', '5a', null)).toBe(true)
      expect(isGradeInRange('3a', '5a', null)).toBe(false)
    })

    it('should handle both null (all grades)', () => {
      expect(isGradeInRange('3a', null, null)).toBe(true)
      expect(isGradeInRange('8c', null, null)).toBe(true)
    })

    it('should always show unknown grades', () => {
      expect(isGradeInRange('unknown', '5a', '7a')).toBe(true)
    })
  })

  describe('formatGrade', () => {
    it('should uppercase the grade', () => {
      expect(formatGrade('6a+')).toBe('6A+')
      expect(formatGrade('3a')).toBe('3A')
    })
  })

  describe('formatGradeRange', () => {
    it('should format a full range', () => {
      expect(formatGradeRange('5a', '7a')).toBe('5A – 7A')
    })

    it('should format min-only range', () => {
      expect(formatGradeRange('6a', null)).toBe('6A+')
    })

    it('should format max-only range', () => {
      expect(formatGradeRange(null, '6c')).toBe('≤ 6C')
    })

    it('should return default label when no range set', () => {
      expect(formatGradeRange(null, null)).toBe('Tous niveaux')
    })
  })
})

import { describe, it, expect } from 'vitest'
import { annotationFormSchema } from '@/lib/validations/annotation'

describe('annotation validation', () => {
  describe('annotationFormSchema', () => {
    it('should accept valid data', () => {
      const result = annotationFormSchema.safeParse({
        date: '2026-03-01',
        text: 'Blessure épaule',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty date', () => {
      const result = annotationFormSchema.safeParse({
        date: '',
        text: 'Note',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid date string', () => {
      const result = annotationFormSchema.safeParse({
        date: 'pas-une-date',
        text: 'Note',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty text', () => {
      const result = annotationFormSchema.safeParse({
        date: '2026-03-01',
        text: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject text exceeding 100 characters', () => {
      const result = annotationFormSchema.safeParse({
        date: '2026-03-01',
        text: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('should accept text at exactly 100 characters', () => {
      const result = annotationFormSchema.safeParse({
        date: '2026-03-01',
        text: 'a'.repeat(100),
      })
      expect(result.success).toBe(true)
    })

    it('should accept a 1-character text', () => {
      const result = annotationFormSchema.safeParse({
        date: '2026-01-15',
        text: 'X',
      })
      expect(result.success).toBe(true)
    })
  })
})

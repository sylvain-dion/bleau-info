import { describe, it, expect } from 'vitest'
import { tickFormSchema, TICK_STYLES, TICK_STYLE_OPTIONS, todayISO } from '@/lib/validations/tick'

describe('tick validation', () => {
  describe('TICK_STYLES', () => {
    it('should have 3 styles', () => {
      expect(TICK_STYLES).toHaveLength(3)
      expect(TICK_STYLES).toContain('flash')
      expect(TICK_STYLES).toContain('a_vue')
      expect(TICK_STYLES).toContain('travaille')
    })
  })

  describe('TICK_STYLE_OPTIONS', () => {
    it('should have French labels', () => {
      const labels = TICK_STYLE_OPTIONS.map((s) => s.label)
      expect(labels).toEqual(['Flash', 'À vue', 'Travaillé'])
    })

    it('should have icons for each style', () => {
      TICK_STYLE_OPTIONS.forEach((style) => {
        expect(style.icon).toBeTruthy()
        expect(style.color).toBeTruthy()
        expect(style.bgTint).toBeTruthy()
        expect(style.borderColor).toBeTruthy()
      })
    })
  })

  describe('tickFormSchema', () => {
    it('should accept valid data', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'flash',
        tickDate: '2026-03-01',
        personalNote: 'Great climb!',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty personal note', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'a_vue',
        tickDate: '2026-03-01',
        personalNote: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept undefined personal note', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'travaille',
        tickDate: '2026-03-01',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid tick style', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'unknown',
        tickDate: '2026-03-01',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty tick style', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: '',
        tickDate: '2026-03-01',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty date', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'flash',
        tickDate: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid date string', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'flash',
        tickDate: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })

    it('should reject note exceeding 500 characters', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'flash',
        tickDate: '2026-03-01',
        personalNote: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('should accept note at exactly 500 characters', () => {
      const result = tickFormSchema.safeParse({
        tickStyle: 'flash',
        tickDate: '2026-03-01',
        personalNote: 'a'.repeat(500),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('todayISO', () => {
    it('should return a YYYY-MM-DD string', () => {
      const today = todayISO()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return today\'s date', () => {
      const today = todayISO()
      const expected = new Date().toISOString().slice(0, 10)
      expect(today).toBe(expected)
    })
  })
})

import { describe, it, expect } from 'vitest'
import {
  boulderFormSchema,
  BOULDER_STYLES,
  BOULDER_EXPOSURES,
  STYLE_LABELS,
  EXPOSURE_LABELS,
  STYLE_CHIP_OPTIONS,
  extractSectors,
} from '@/lib/validations/boulder'

/** Minimal valid form data for reuse across tests */
const validData = {
  name: 'La Marie-Rose',
  grade: '6a',
  style: 'dalle' as const,
}

describe('boulder validation', () => {
  describe('BOULDER_STYLES', () => {
    it('should have 6 climbing styles', () => {
      expect(BOULDER_STYLES).toHaveLength(6)
      expect(BOULDER_STYLES).toContain('dalle')
      expect(BOULDER_STYLES).toContain('devers')
      expect(BOULDER_STYLES).toContain('toit')
      expect(BOULDER_STYLES).toContain('arete')
      expect(BOULDER_STYLES).toContain('traverse')
      expect(BOULDER_STYLES).toContain('bloc')
    })
  })

  describe('BOULDER_EXPOSURES', () => {
    it('should have 3 exposure types', () => {
      expect(BOULDER_EXPOSURES).toHaveLength(3)
      expect(BOULDER_EXPOSURES).toContain('ombre')
      expect(BOULDER_EXPOSURES).toContain('soleil')
      expect(BOULDER_EXPOSURES).toContain('mi-ombre')
    })
  })

  describe('STYLE_LABELS', () => {
    it('should have French labels for all styles', () => {
      expect(STYLE_LABELS.dalle).toBe('Dalle')
      expect(STYLE_LABELS.devers).toBe('Dévers')
      expect(STYLE_LABELS.toit).toBe('Toit')
      expect(STYLE_LABELS.arete).toBe('Arête')
      expect(STYLE_LABELS.traverse).toBe('Traversée')
      expect(STYLE_LABELS.bloc).toBe('Bloc')
    })
  })

  describe('EXPOSURE_LABELS', () => {
    it('should have French labels for all exposures', () => {
      expect(EXPOSURE_LABELS.ombre).toBe('À l\'ombre')
      expect(EXPOSURE_LABELS.soleil).toBe('Au soleil')
      expect(EXPOSURE_LABELS['mi-ombre']).toBe('Mi-ombre')
    })
  })

  describe('STYLE_CHIP_OPTIONS', () => {
    it('should have visual config for all 6 styles', () => {
      expect(STYLE_CHIP_OPTIONS).toHaveLength(6)
      STYLE_CHIP_OPTIONS.forEach((chip) => {
        expect(chip.key).toBeTruthy()
        expect(chip.label).toBeTruthy()
        expect(chip.icon).toBeTruthy()
        expect(chip.color).toBeTruthy()
        expect(chip.bgTint).toBeTruthy()
        expect(chip.borderColor).toBeTruthy()
      })
    })

    it('should cover all BOULDER_STYLES', () => {
      const keys = STYLE_CHIP_OPTIONS.map((c) => c.key)
      BOULDER_STYLES.forEach((style) => {
        expect(keys).toContain(style)
      })
    })
  })

  describe('boulderFormSchema', () => {
    // ── Required fields ──

    it('should accept valid required-only data', () => {
      const result = boulderFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept valid data with all optional fields', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        sector: 'Bas Cuvier',
        description: 'Un classique absolu de Bleau',
        height: '3.5',
        exposure: 'soleil',
        strollerAccessible: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.height).toBe(3.5)
        expect(result.data.exposure).toBe('soleil')
        expect(result.data.strollerAccessible).toBe(true)
      }
    })

    // ── Name validation ──

    it('should reject empty name', () => {
      const result = boulderFormSchema.safeParse({ ...validData, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name shorter than 2 chars', () => {
      const result = boulderFormSchema.safeParse({ ...validData, name: 'A' })
      expect(result.success).toBe(false)
    })

    it('should accept name at exactly 2 chars', () => {
      const result = boulderFormSchema.safeParse({ ...validData, name: 'Ab' })
      expect(result.success).toBe(true)
    })

    it('should reject name exceeding 100 chars', () => {
      const result = boulderFormSchema.safeParse({ ...validData, name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('should accept name at exactly 100 chars', () => {
      const result = boulderFormSchema.safeParse({ ...validData, name: 'a'.repeat(100) })
      expect(result.success).toBe(true)
    })

    // ── Grade validation ──

    it('should reject empty grade', () => {
      const result = boulderFormSchema.safeParse({ ...validData, grade: '' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid grade', () => {
      const result = boulderFormSchema.safeParse({ ...validData, grade: '2a' })
      expect(result.success).toBe(false)
    })

    it('should accept lowest grade (3a)', () => {
      const result = boulderFormSchema.safeParse({ ...validData, grade: '3a' })
      expect(result.success).toBe(true)
    })

    it('should accept highest grade (8c)', () => {
      const result = boulderFormSchema.safeParse({ ...validData, grade: '8c' })
      expect(result.success).toBe(true)
    })

    it('should accept plus grades (6a+)', () => {
      const result = boulderFormSchema.safeParse({ ...validData, grade: '6a+' })
      expect(result.success).toBe(true)
    })

    // ── Style validation ──

    it('should reject empty style', () => {
      const result = boulderFormSchema.safeParse({ ...validData, style: '' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid style', () => {
      const result = boulderFormSchema.safeParse({ ...validData, style: 'crack' })
      expect(result.success).toBe(false)
    })

    it('should accept all valid styles', () => {
      BOULDER_STYLES.forEach((style) => {
        const result = boulderFormSchema.safeParse({ ...validData, style })
        expect(result.success).toBe(true)
      })
    })

    // ── Optional field defaults ──

    it('should default strollerAccessible to false', () => {
      const result = boulderFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.strollerAccessible).toBe(false)
      }
    })

    it('should accept empty optional strings', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        sector: '',
        description: '',
        height: '',
        exposure: '',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.height).toBeUndefined()
        expect(result.data.exposure).toBeUndefined()
      }
    })

    // ── Height validation ──

    it('should reject height below 0.5m', () => {
      const result = boulderFormSchema.safeParse({ ...validData, height: '0.2' })
      expect(result.success).toBe(false)
    })

    it('should reject height above 15m', () => {
      const result = boulderFormSchema.safeParse({ ...validData, height: '16' })
      expect(result.success).toBe(false)
    })

    it('should accept height at 0.5m', () => {
      const result = boulderFormSchema.safeParse({ ...validData, height: '0.5' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.height).toBe(0.5)
    })

    it('should accept height at 15m', () => {
      const result = boulderFormSchema.safeParse({ ...validData, height: '15' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.height).toBe(15)
    })

    it('should transform valid height string to number', () => {
      const result = boulderFormSchema.safeParse({ ...validData, height: '4.2' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.height).toBe(4.2)
    })

    it('should handle non-numeric height string gracefully', () => {
      const result = boulderFormSchema.safeParse({ ...validData, height: 'abc' })
      // parseFloat('abc') → NaN → undefined → passes optional
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.height).toBeUndefined()
    })

    // ── Description validation ──

    it('should reject description exceeding 500 chars', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        description: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('should accept description at exactly 500 chars', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        description: 'a'.repeat(500),
      })
      expect(result.success).toBe(true)
    })

    // ── Exposure validation ──

    it('should accept all valid exposures', () => {
      BOULDER_EXPOSURES.forEach((exp) => {
        const result = boulderFormSchema.safeParse({ ...validData, exposure: exp })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.exposure).toBe(exp)
      })
    })

    it('should reject invalid exposure', () => {
      const result = boulderFormSchema.safeParse({ ...validData, exposure: 'plein-sud' })
      expect(result.success).toBe(false)
    })

    // ── Photo metadata validation (Story 5.2) ──

    it('should accept valid photo metadata', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        photoBlurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
        photoWidth: 1200,
        photoHeight: 800,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.photoBlurHash).toBe('LEHV6nWB2yk8pyo0adR*.7kCMdnj')
        expect(result.data.photoWidth).toBe(1200)
        expect(result.data.photoHeight).toBe(800)
      }
    })

    it('should accept data without photo metadata', () => {
      const result = boulderFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.photoBlurHash).toBeUndefined()
        expect(result.data.photoWidth).toBeUndefined()
        expect(result.data.photoHeight).toBeUndefined()
      }
    })

    it('should reject non-integer photo dimensions', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        photoWidth: 1200.5,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative photo dimensions', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        photoWidth: -100,
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero photo dimensions', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        photoHeight: 0,
      })
      expect(result.success).toBe(false)
    })

    // ── GPS coordinate validation (Story 5.3) ──

    it('should accept valid GPS coordinates', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        latitude: 48.382619,
        longitude: 2.634521,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.latitude).toBe(48.382619)
        expect(result.data.longitude).toBe(2.634521)
      }
    })

    it('should accept data without GPS coordinates', () => {
      const result = boulderFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.latitude).toBeUndefined()
        expect(result.data.longitude).toBeUndefined()
      }
    })

    it('should reject latitude below -90', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        latitude: -91,
      })
      expect(result.success).toBe(false)
    })

    it('should reject latitude above 90', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        latitude: 91,
      })
      expect(result.success).toBe(false)
    })

    it('should reject longitude below -180', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        longitude: -181,
      })
      expect(result.success).toBe(false)
    })

    it('should reject longitude above 180', () => {
      const result = boulderFormSchema.safeParse({
        ...validData,
        longitude: 181,
      })
      expect(result.success).toBe(false)
    })

    it('should accept boundary latitude values', () => {
      expect(boulderFormSchema.safeParse({ ...validData, latitude: -90 }).success).toBe(true)
      expect(boulderFormSchema.safeParse({ ...validData, latitude: 90 }).success).toBe(true)
      expect(boulderFormSchema.safeParse({ ...validData, latitude: 0 }).success).toBe(true)
    })

    it('should accept boundary longitude values', () => {
      expect(boulderFormSchema.safeParse({ ...validData, longitude: -180 }).success).toBe(true)
      expect(boulderFormSchema.safeParse({ ...validData, longitude: 180 }).success).toBe(true)
      expect(boulderFormSchema.safeParse({ ...validData, longitude: 0 }).success).toBe(true)
    })
  })

  describe('extractSectors', () => {
    it('should extract unique sorted sectors', () => {
      const features = [
        { properties: { sector: 'Cuvier' } },
        { properties: { sector: 'Apremont' } },
        { properties: { sector: 'Cuvier' } },
        { properties: { sector: 'Bas Cuvier' } },
      ]
      expect(extractSectors(features)).toEqual(['Apremont', 'Bas Cuvier', 'Cuvier'])
    })

    it('should return empty array for no features', () => {
      expect(extractSectors([])).toEqual([])
    })
  })
})

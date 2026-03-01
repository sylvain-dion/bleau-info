import { describe, it, expect } from 'vitest'
import { profileSchema, AVATAR_PRESETS, getAvatarPreset } from '@/lib/validations/profile'

describe('profileSchema', () => {
  it('should accept valid profile data', () => {
    const result = profileSchema.safeParse({
      displayName: 'Jean-Pierre',
      maxGrade: '6a+',
      avatarPreset: 'climber',
    })
    expect(result.success).toBe(true)
  })

  it('should accept empty maxGrade and avatarPreset', () => {
    const result = profileSchema.safeParse({
      displayName: 'Marie',
      maxGrade: '',
      avatarPreset: '',
    })
    expect(result.success).toBe(true)
  })

  it('should reject displayName shorter than 2 chars', () => {
    const result = profileSchema.safeParse({
      displayName: 'A',
      maxGrade: '',
      avatarPreset: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject displayName longer than 30 chars', () => {
    const result = profileSchema.safeParse({
      displayName: 'A'.repeat(31),
      maxGrade: '',
      avatarPreset: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject displayName with special characters', () => {
    const result = profileSchema.safeParse({
      displayName: 'User<script>',
      maxGrade: '',
      avatarPreset: '',
    })
    expect(result.success).toBe(false)
  })

  it('should accept displayName with accented characters', () => {
    const result = profileSchema.safeParse({
      displayName: 'François-Éric',
      maxGrade: '',
      avatarPreset: '',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid grade', () => {
    const result = profileSchema.safeParse({
      displayName: 'Test',
      maxGrade: '9z',
      avatarPreset: '',
    })
    expect(result.success).toBe(false)
  })

  it('should accept all valid grades from GRADE_SCALE', () => {
    const result = profileSchema.safeParse({
      displayName: 'Test',
      maxGrade: '7a+',
      avatarPreset: '',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid avatar preset', () => {
    const result = profileSchema.safeParse({
      displayName: 'Test',
      maxGrade: '',
      avatarPreset: 'invalid-avatar',
    })
    expect(result.success).toBe(false)
  })

  it('should accept all valid avatar presets', () => {
    for (const preset of AVATAR_PRESETS) {
      const result = profileSchema.safeParse({
        displayName: 'Test',
        maxGrade: '',
        avatarPreset: preset.key,
      })
      expect(result.success).toBe(true)
    }
  })
})

describe('AVATAR_PRESETS', () => {
  it('should have 8 presets', () => {
    expect(AVATAR_PRESETS).toHaveLength(8)
  })

  it('should have unique keys', () => {
    const keys = AVATAR_PRESETS.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('each preset should have key, emoji, and label', () => {
    for (const preset of AVATAR_PRESETS) {
      expect(preset.key).toBeTruthy()
      expect(preset.emoji).toBeTruthy()
      expect(preset.label).toBeTruthy()
    }
  })
})

describe('getAvatarPreset', () => {
  it('should return preset for valid key', () => {
    const preset = getAvatarPreset('climber')
    expect(preset).not.toBeNull()
    expect(preset?.emoji).toBe('🧗')
  })

  it('should return null for invalid key', () => {
    expect(getAvatarPreset('nonexistent')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(getAvatarPreset('')).toBeNull()
  })
})

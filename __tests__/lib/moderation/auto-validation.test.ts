import { describe, it, expect } from 'vitest'
import {
  shouldAutoValidate,
  checkAutoValidation,
  AUTO_VALIDATION_REASON,
} from '@/lib/moderation/auto-validation'

describe('shouldAutoValidate', () => {
  it('returns false for regular user (score 0)', () => {
    expect(shouldAutoValidate(0, null, false)).toBe(false)
  })

  it('returns false for contributor (score 50)', () => {
    expect(shouldAutoValidate(50, null, false)).toBe(false)
  })

  it('returns true for trusted user (score 100)', () => {
    expect(shouldAutoValidate(100, null, false)).toBe(true)
  })

  it('returns true for score above threshold (score 200)', () => {
    expect(shouldAutoValidate(200, null, false)).toBe(true)
  })

  it('returns true for moderator role regardless of score', () => {
    expect(shouldAutoValidate(0, 'moderator', false)).toBe(true)
  })

  it('returns true for admin role regardless of score', () => {
    expect(shouldAutoValidate(0, 'admin', false)).toBe(true)
  })

  it('returns false when potentialDuplicate is true even for trusted user', () => {
    expect(shouldAutoValidate(100, null, true)).toBe(false)
  })

  it('returns false when potentialDuplicate is true even for moderator', () => {
    expect(shouldAutoValidate(0, 'moderator', true)).toBe(false)
  })
})

describe('checkAutoValidation', () => {
  it('returns autoValidated true with reason for trusted user', () => {
    const result = checkAutoValidation(100, null, false)
    expect(result.autoValidated).toBe(true)
    expect(result.reason).toBe(AUTO_VALIDATION_REASON)
    expect(result.trustScore).toBe(100)
    expect(result.effectiveRole).toBe('trusted')
  })

  it('returns autoValidated false with null reason for regular user', () => {
    const result = checkAutoValidation(50, null, false)
    expect(result.autoValidated).toBe(false)
    expect(result.reason).toBeNull()
    expect(result.effectiveRole).toBe('contributor')
  })

  it('returns autoValidated false for duplicate even if trusted', () => {
    const result = checkAutoValidation(100, null, true)
    expect(result.autoValidated).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('returns moderator role for explicit moderator', () => {
    const result = checkAutoValidation(0, 'moderator', false)
    expect(result.autoValidated).toBe(true)
    expect(result.effectiveRole).toBe('moderator')
  })
})

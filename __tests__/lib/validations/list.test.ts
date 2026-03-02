import { describe, it, expect } from 'vitest'
import { listFormSchema, LIST_EMOJI_PRESETS, DEFAULT_LIST_EMOJI } from '@/lib/validations/list'

describe('listFormSchema', () => {
  it('accepts a valid name and emoji', () => {
    const result = listFormSchema.safeParse({ name: 'Projets', emoji: '🎯' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = listFormSchema.safeParse({ name: '', emoji: '📋' })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 50 characters', () => {
    const longName = 'a'.repeat(51)
    const result = listFormSchema.safeParse({ name: longName, emoji: '📋' })
    expect(result.success).toBe(false)
  })

  it('accepts name with accented characters', () => {
    const result = listFormSchema.safeParse({ name: 'Mes Favoris été', emoji: '⭐' })
    expect(result.success).toBe(true)
  })

  it('accepts name with hyphens and underscores', () => {
    const result = listFormSchema.safeParse({ name: 'Mon_projet-2026', emoji: '📋' })
    expect(result.success).toBe(true)
  })

  it('rejects name with special characters', () => {
    const result = listFormSchema.safeParse({ name: 'Test<script>', emoji: '📋' })
    expect(result.success).toBe(false)
  })

  it('rejects empty emoji', () => {
    const result = listFormSchema.safeParse({ name: 'Valid', emoji: '' })
    expect(result.success).toBe(false)
  })
})

describe('LIST_EMOJI_PRESETS', () => {
  it('contains at least 4 presets', () => {
    expect(LIST_EMOJI_PRESETS.length).toBeGreaterThanOrEqual(4)
  })

  it('includes the default emoji', () => {
    expect(LIST_EMOJI_PRESETS).toContain(DEFAULT_LIST_EMOJI)
  })
})

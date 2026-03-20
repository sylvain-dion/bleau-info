import { describe, it, expect } from 'vitest'
import { djb2Hash, computeSectorHash } from '@/lib/offline/version-hash'

describe('djb2Hash', () => {
  it('returns consistent hash for same input', () => {
    const hash1 = djb2Hash('hello world')
    const hash2 = djb2Hash('hello world')
    expect(hash1).toBe(hash2)
  })

  it('returns different hashes for different inputs', () => {
    const hash1 = djb2Hash('hello')
    const hash2 = djb2Hash('world')
    expect(hash1).not.toBe(hash2)
  })

  it('returns 8-character hex string', () => {
    const hash = djb2Hash('test')
    expect(hash).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('computeSectorHash', () => {
  it('returns consistent hash for same sector', () => {
    const hash1 = computeSectorHash('Cul de Chien')
    const hash2 = computeSectorHash('Cul de Chien')
    expect(hash1).toBe(hash2)
  })

  it('returns different hashes for different sectors', () => {
    const hash1 = computeSectorHash('Cul de Chien')
    const hash2 = computeSectorHash('Bas Cuvier')
    expect(hash1).not.toBe(hash2)
  })

  it('returns 8-character hex string', () => {
    const hash = computeSectorHash('Apremont')
    expect(hash).toMatch(/^[0-9a-f]{8}$/)
  })
})

import { describe, it, expect } from 'vitest'
import { calculateResizedDimensions } from '@/lib/image-processing'

describe('calculateResizedDimensions', () => {
  it('returns original dimensions when both are within max', () => {
    expect(calculateResizedDimensions(800, 600, 1200)).toEqual({
      width: 800,
      height: 600,
    })
  })

  it('returns original dimensions when exactly at max', () => {
    expect(calculateResizedDimensions(1200, 900, 1200)).toEqual({
      width: 1200,
      height: 900,
    })
  })

  it('scales down landscape image preserving aspect ratio', () => {
    const result = calculateResizedDimensions(2400, 1600, 1200)
    expect(result.width).toBe(1200)
    expect(result.height).toBe(800)
  })

  it('scales down portrait image preserving aspect ratio', () => {
    const result = calculateResizedDimensions(1600, 2400, 1200)
    expect(result.width).toBe(800)
    expect(result.height).toBe(1200)
  })

  it('scales down square image', () => {
    const result = calculateResizedDimensions(3000, 3000, 1200)
    expect(result.width).toBe(1200)
    expect(result.height).toBe(1200)
  })

  it('handles very small images without upscaling', () => {
    expect(calculateResizedDimensions(100, 50, 1200)).toEqual({
      width: 100,
      height: 50,
    })
  })

  it('handles width at max but height under', () => {
    expect(calculateResizedDimensions(1200, 400, 1200)).toEqual({
      width: 1200,
      height: 400,
    })
  })

  it('handles height at max but width under', () => {
    expect(calculateResizedDimensions(400, 1200, 1200)).toEqual({
      width: 400,
      height: 1200,
    })
  })

  it('uses default maxDim of 1200 when not specified', () => {
    const result = calculateResizedDimensions(2400, 1800)
    expect(result.width).toBe(1200)
    expect(result.height).toBe(900)
  })

  it('handles non-standard aspect ratios', () => {
    // Panoramic: 4000×500, max 1200
    const result = calculateResizedDimensions(4000, 500, 1200)
    expect(result.width).toBe(1200)
    expect(result.height).toBe(150)
  })

  it('rounds dimensions to whole numbers', () => {
    // 1999×1333 → ratio 0.6003, → 1199.4×799.8 → 1199×800
    const result = calculateResizedDimensions(1999, 1333, 1200)
    expect(Number.isInteger(result.width)).toBe(true)
    expect(Number.isInteger(result.height)).toBe(true)
    expect(result.width).toBeLessThanOrEqual(1200)
    expect(result.height).toBeLessThanOrEqual(1200)
  })

  it('handles 1×1 pixel image', () => {
    expect(calculateResizedDimensions(1, 1, 1200)).toEqual({
      width: 1,
      height: 1,
    })
  })
})

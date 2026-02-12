import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('should override conflicting Tailwind classes', () => {
    // twMerge should keep the last conflicting class
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('should handle undefined and null values', () => {
    const result = cn('text-red-500', undefined, null, 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })
})

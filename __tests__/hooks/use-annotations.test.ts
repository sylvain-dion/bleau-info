import { describe, it, expect } from 'vitest'
import { groupAnnotationsByMonth } from '@/hooks/use-annotations'
import type { Annotation } from '@/lib/validations/annotation'

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    date: '2026-03-01',
    text: 'Test',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

describe('groupAnnotationsByMonth', () => {
  it('should return empty map for empty input', () => {
    const result = groupAnnotationsByMonth([])
    expect(result.size).toBe(0)
  })

  it('should group annotations by YYYY-MM', () => {
    const annotations = [
      makeAnnotation({ id: '1', date: '2026-03-01', text: 'A' }),
      makeAnnotation({ id: '2', date: '2026-03-15', text: 'B' }),
      makeAnnotation({ id: '3', date: '2026-04-01', text: 'C' }),
    ]

    const result = groupAnnotationsByMonth(annotations)
    expect(result.size).toBe(2)
    expect(result.get('2026-03')).toHaveLength(2)
    expect(result.get('2026-04')).toHaveLength(1)
  })

  it('should handle single annotation', () => {
    const annotations = [makeAnnotation({ id: '1', date: '2026-01-10' })]

    const result = groupAnnotationsByMonth(annotations)
    expect(result.size).toBe(1)
    expect(result.get('2026-01')).toHaveLength(1)
  })

  it('should preserve annotation data in groups', () => {
    const annotations = [
      makeAnnotation({ id: 'x', date: '2026-06-15', text: 'Stage Bleau' }),
    ]

    const result = groupAnnotationsByMonth(annotations)
    const group = result.get('2026-06')!
    expect(group[0].id).toBe('x')
    expect(group[0].text).toBe('Stage Bleau')
  })
})

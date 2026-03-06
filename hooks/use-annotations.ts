'use client'

import { useMemo } from 'react'
import { useAnnotationStore } from '@/stores/annotation-store'
import type { Annotation } from '@/lib/validations/annotation'

/** Group annotations by month (YYYY-MM) */
export function groupAnnotationsByMonth(
  annotations: Annotation[]
): Map<string, Annotation[]> {
  const map = new Map<string, Annotation[]>()
  for (const a of annotations) {
    const month = a.date.slice(0, 7)
    const existing = map.get(month) ?? []
    map.set(month, [...existing, a])
  }
  return map
}

/** Hook: read annotations from store, grouped by month */
export function useAnnotations() {
  const annotations = useAnnotationStore((s) => s.annotations)

  const annotationsByMonth = useMemo(
    () => groupAnnotationsByMonth(annotations),
    [annotations]
  )

  return { annotations, annotationsByMonth }
}

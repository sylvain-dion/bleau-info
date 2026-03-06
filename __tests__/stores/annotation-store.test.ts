import { describe, it, expect, beforeEach } from 'vitest'
import { useAnnotationStore } from '@/stores/annotation-store'

describe('annotation-store', () => {
  beforeEach(() => {
    useAnnotationStore.setState({ annotations: [] })
  })

  it('should start with empty annotations', () => {
    expect(useAnnotationStore.getState().annotations).toHaveLength(0)
  })

  it('should add an annotation and return its id', () => {
    const id = useAnnotationStore.getState().addAnnotation({
      date: '2026-03-01',
      text: 'Blessure épaule',
    })

    expect(id).toBeTruthy()
    const annotations = useAnnotationStore.getState().annotations
    expect(annotations).toHaveLength(1)
    expect(annotations[0].date).toBe('2026-03-01')
    expect(annotations[0].text).toBe('Blessure épaule')
    expect(annotations[0].createdAt).toBeTruthy()
    expect(annotations[0].updatedAt).toBeTruthy()
  })

  it('should prepend new annotations (newest first)', () => {
    useAnnotationStore.getState().addAnnotation({
      date: '2026-01-15',
      text: 'Stage',
    })
    useAnnotationStore.getState().addAnnotation({
      date: '2026-03-01',
      text: 'Reprise',
    })

    const annotations = useAnnotationStore.getState().annotations
    expect(annotations).toHaveLength(2)
    expect(annotations[0].text).toBe('Reprise')
    expect(annotations[1].text).toBe('Stage')
  })

  it('should update an annotation text', () => {
    const id = useAnnotationStore.getState().addAnnotation({
      date: '2026-03-01',
      text: 'Blessure',
    })

    useAnnotationStore.getState().updateAnnotation(id, { text: 'Blessure épaule droite' })

    const updated = useAnnotationStore.getState().annotations[0]
    expect(updated.text).toBe('Blessure épaule droite')
    expect(updated.date).toBe('2026-03-01')
    expect(updated.updatedAt).toBeTruthy()
  })

  it('should update an annotation date', () => {
    const id = useAnnotationStore.getState().addAnnotation({
      date: '2026-03-01',
      text: 'Stage',
    })

    useAnnotationStore.getState().updateAnnotation(id, { date: '2026-04-15' })

    const updated = useAnnotationStore.getState().annotations[0]
    expect(updated.date).toBe('2026-04-15')
    expect(updated.text).toBe('Stage')
  })

  it('should remove an annotation by id', () => {
    const id = useAnnotationStore.getState().addAnnotation({
      date: '2026-03-01',
      text: 'Note',
    })

    useAnnotationStore.getState().removeAnnotation(id)
    expect(useAnnotationStore.getState().annotations).toHaveLength(0)
  })

  it('should not fail when removing non-existent annotation', () => {
    useAnnotationStore.getState().removeAnnotation('non-existent')
    expect(useAnnotationStore.getState().annotations).toHaveLength(0)
  })

  it('should get annotations for a specific month', () => {
    useAnnotationStore.getState().addAnnotation({
      date: '2026-03-01',
      text: 'Mars note 1',
    })
    useAnnotationStore.getState().addAnnotation({
      date: '2026-03-15',
      text: 'Mars note 2',
    })
    useAnnotationStore.getState().addAnnotation({
      date: '2026-04-01',
      text: 'Avril note',
    })

    const marchAnnotations = useAnnotationStore.getState().getAnnotationsForMonth('2026-03')
    expect(marchAnnotations).toHaveLength(2)

    const aprilAnnotations = useAnnotationStore.getState().getAnnotationsForMonth('2026-04')
    expect(aprilAnnotations).toHaveLength(1)
    expect(aprilAnnotations[0].text).toBe('Avril note')
  })

  it('should return empty array for month with no annotations', () => {
    const annotations = useAnnotationStore.getState().getAnnotationsForMonth('2026-12')
    expect(annotations).toHaveLength(0)
  })
})

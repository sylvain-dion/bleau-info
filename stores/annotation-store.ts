import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Annotation } from '@/lib/validations/annotation'

interface AnnotationState {
  /** All annotations, newest first */
  annotations: Annotation[]

  /** Add a new annotation */
  addAnnotation: (data: Pick<Annotation, 'date' | 'text'>) => string

  /** Update an existing annotation */
  updateAnnotation: (id: string, data: Partial<Pick<Annotation, 'date' | 'text'>>) => void

  /** Remove an annotation by ID */
  removeAnnotation: (id: string) => void

  /** Get all annotations for a given month (YYYY-MM) */
  getAnnotationsForMonth: (month: string) => Annotation[]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      annotations: [],

      addAnnotation: (data) => {
        const id = generateId()
        const now = new Date().toISOString()
        const annotation: Annotation = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          annotations: [annotation, ...state.annotations],
        }))
        return id
      },

      updateAnnotation: (id, data) => {
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id
              ? { ...a, ...data, updatedAt: new Date().toISOString() }
              : a
          ),
        }))
      },

      removeAnnotation: (id) => {
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
        }))
      },

      getAnnotationsForMonth: (month) => {
        return get().annotations.filter(
          (a) => a.date.slice(0, 7) === month
        )
      },
    }),
    {
      name: 'bleau-annotations',
    }
  )
)

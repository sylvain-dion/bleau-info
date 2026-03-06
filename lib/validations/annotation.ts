import { z } from 'zod'

/** Zod schema for the annotation form. */
export const annotationFormSchema = z.object({
  date: z
    .string()
    .min(1, 'La date est requise')
    .refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  text: z
    .string()
    .min(1, 'Le texte est requis')
    .max(100, "L'annotation ne peut pas dépasser 100 caractères"),
})

export type AnnotationFormData = z.infer<typeof annotationFormSchema>

/** Full stored annotation object. */
export interface Annotation {
  id: string
  date: string
  text: string
  createdAt: string
  updatedAt: string
}

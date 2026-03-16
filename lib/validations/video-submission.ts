import { z } from 'zod'
import { parseVideoUrl } from '@/lib/video'

/**
 * Zod schema for the video submission form.
 *
 * - videoUrl: required, must be a valid YouTube or Vimeo URL
 * - climberName: optional, the climber featured in the video
 * - videographerName: optional, the person who filmed/edited the video
 */
export const videoSubmissionSchema = z.object({
  videoUrl: z
    .string()
    .min(1, "L'URL de la video est requise")
    .refine(
      (val) => parseVideoUrl(val) !== null,
      'URL YouTube ou Vimeo invalide'
    ),

  climberName: z
    .string()
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  videographerName: z
    .string()
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
})

/** Input type — what the form fields provide. */
export type VideoSubmissionFormInput = z.input<typeof videoSubmissionSchema>

/** Output type — after Zod transforms. */
export type VideoSubmissionFormData = z.output<typeof videoSubmissionSchema>

import { z } from 'zod'

/** Emoji presets for list visual identification */
export const LIST_EMOJI_PRESETS = ['📋', '⭐', '🎯', '❤️', '🏔️', '💪'] as const

/** Default emoji for new lists */
export const DEFAULT_LIST_EMOJI = '📋'

/** Zod schema for list creation / rename */
export const listFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(
      /^[a-zA-ZÀ-ÿ0-9\s\-_'().!]+$/,
      'Le nom contient des caractères non autorisés'
    ),
  emoji: z.string().min(1, 'L\'emoji est requis'),
})

export type ListFormData = z.infer<typeof listFormSchema>

/** A boulder reference stored in a list */
export interface BoulderListItem {
  boulderId: string
  boulderName: string
  boulderGrade: string
  addedAt: string
}

/** A user-created boulder list */
export interface BoulderList {
  id: string
  name: string
  emoji: string
  items: BoulderListItem[]
  createdAt: string
  updatedAt: string
}

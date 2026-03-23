import { z } from 'zod/v4'
import type { SyncStatus } from '@/lib/sync/types'

/** Zod schema for the comment form */
export const commentFormSchema = z.object({
  text: z
    .string()
    .min(1, 'Le commentaire ne peut pas être vide')
    .max(500, '500 caractères maximum'),
})

export type CommentFormData = z.infer<typeof commentFormSchema>

/** A locally-stored boulder comment */
export interface BoulderComment {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  boulderId: string
  boulderName: string
  text: string
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

import { z } from 'zod/v4'
import type { SyncStatus } from '@/lib/sync/types'

/** Zod schema for the comment form */
export const commentFormSchema = z.object({
  text: z
    .string()
    .min(1, 'Le commentaire ne peut pas être vide')
    .max(500, '500 caractères maximum'),
  /**
   * Story 15.1 — author flags the comment as containing climbing beta
   * (handhold sequence, crux, …) so other users see it veiled until
   * they explicitly choose to reveal.
   */
  containsBeta: z.boolean().optional().default(false),
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
  /** Story 15.1 — author tagged this comment as a spoiler. */
  containsBeta?: boolean
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

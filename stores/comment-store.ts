import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoulderComment } from '@/lib/validations/comment'
import type { SyncStatus } from '@/lib/sync/types'

/** Input for creating a comment (id, status, timestamps auto-generated) */
type CommentInput = Omit<
  BoulderComment,
  'id' | 'syncStatus' | 'createdAt' | 'updatedAt'
>

interface CommentState {
  comments: BoulderComment[]

  /** Add a new comment. Returns the generated ID. */
  addComment: (data: CommentInput) => string

  /** Remove a comment by ID. */
  removeComment: (id: string) => void

  /** Get all comments for a boulder, newest first. */
  getCommentsForBoulder: (boulderId: string) => BoulderComment[]

  /** Update sync status for a comment. */
  setSyncStatus: (id: string, status: SyncStatus) => void

  /** Get all comments that need syncing. */
  getUnsyncedComments: () => BoulderComment[]
}

function generateId(): string {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useCommentStore = create<CommentState>()(
  persist(
    (set, get) => ({
      comments: [],

      addComment: (data) => {
        const id = generateId()
        const now = new Date().toISOString()
        const comment: BoulderComment = {
          ...data,
          id,
          syncStatus: 'local',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          comments: [comment, ...state.comments],
        }))
        return id
      },

      removeComment: (id) => {
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== id),
        }))
      },

      getCommentsForBoulder: (boulderId) => {
        return get()
          .comments.filter((c) => c.boulderId === boulderId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      },

      setSyncStatus: (id, status) => {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === id ? { ...c, syncStatus: status } : c
          ),
        }))
      },

      getUnsyncedComments: () => {
        return get().comments.filter(
          (c) => c.syncStatus === 'local' || c.syncStatus === 'error'
        )
      },
    }),
    { name: 'bleau-comments' }
  )
)

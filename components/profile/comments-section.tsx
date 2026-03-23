'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MessageSquare, Trash2, Clock } from 'lucide-react'
import { useCommentStore } from '@/stores/comment-store'
import { useAuthStore } from '@/stores/auth-store'
import { SyncStatusPill } from '@/components/ui/sync-status-pill'
import { toSlug } from '@/lib/data/boulder-service'
import type { BoulderComment } from '@/lib/validations/comment'

/**
 * Profile section showing all comments by the current user.
 *
 * Grouped by sector, then by boulder, sorted newest first.
 */
export function CommentsSection() {
  const { user } = useAuthStore()
  const allComments = useCommentStore((s) => s.comments)
  const removeComment = useCommentStore((s) => s.removeComment)

  const userComments = useMemo(() => {
    if (!user) return []
    return allComments
      .filter((c) => c.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [allComments, user])

  const grouped = useMemo(() => {
    const map = new Map<string, BoulderComment[]>()
    for (const c of userComments) {
      const key = c.boulderName
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return Array.from(map.entries())
  }, [userComments])

  if (userComments.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Aucun commentaire pour l&apos;instant
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {userComments.length} commentaire{userComments.length > 1 ? 's' : ''}
      </p>

      {grouped.map(([boulderName, comments]) => (
        <div key={boulderName}>
          <Link
            href={`/blocs/${comments[0].boulderId}`}
            className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <MessageSquare className="h-3 w-3" />
            {boulderName}
          </Link>

          <div className="space-y-2">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-foreground">
                    {comment.text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    <SyncStatusPill syncStatus={comment.syncStatus} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeComment(comment.id)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Supprimer le commentaire"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

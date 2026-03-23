'use client'

import { useMemo } from 'react'
import { MessageSquare, Clock, Wifi } from 'lucide-react'
import { useCommentStore } from '@/stores/comment-store'
import { SyncStatusPill } from '@/components/ui/sync-status-pill'
import { CommentForm } from './comment-form'

interface CommentSectionProps {
  boulderId: string
  boulderName: string
}

/**
 * Comment section for a boulder detail page.
 *
 * Shows the comment form + list of existing comments
 * with sync status indicators for offline support.
 */
export function CommentSection({ boulderId, boulderName }: CommentSectionProps) {
  const allComments = useCommentStore((s) => s.comments)
  const comments = useMemo(
    () =>
      allComments
        .filter((c) => c.boulderId === boulderId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allComments, boulderId]
  )

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Commentaires{comments.length > 0 ? ` (${comments.length})` : ''}
        </h2>
      </div>

      {/* Comment form */}
      <CommentForm boulderId={boulderId} boulderName={boulderName} />

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              {/* Author + sync status */}
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {comment.userName}
                  </span>
                </div>
                <SyncStatusPill syncStatus={comment.syncStatus} />
              </div>

              {/* Comment text */}
              <p className="text-sm leading-relaxed text-foreground">
                {comment.text}
              </p>

              {/* Timestamp */}
              <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {formatRelativeDate(comment.createdAt)}
                {comment.syncStatus === 'local' && (
                  <span className="ml-1 flex items-center gap-0.5">
                    <Wifi className="h-2.5 w-2.5" />
                    En attente de sync
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Aucun commentaire pour l&apos;instant
        </p>
      )}
    </section>
  )
}

/** Format a date as relative time in French */
function formatRelativeDate(isoDate: string): string {
  const now = Date.now()
  const date = new Date(isoDate).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`

  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

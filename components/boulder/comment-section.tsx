'use client'

import { useMemo, useState } from 'react'
import { MessageSquare, Clock, Wifi, ChevronDown } from 'lucide-react'
import { useCommentStore } from '@/stores/comment-store'
import { useNetworkStore } from '@/stores/network-store'
import { SyncStatusPill } from '@/components/ui/sync-status-pill'
import { CommentForm } from './comment-form'

const PAGE_SIZE = 10

interface CommentSectionProps {
  boulderId: string
  boulderName: string
}

/**
 * Comment section for a boulder detail page.
 *
 * Shows the comment form + paginated list of existing comments
 * (10 per page with "Voir plus" button) + offline sync indicator.
 */
export function CommentSection({ boulderId, boulderName }: CommentSectionProps) {
  const allComments = useCommentStore((s) => s.comments)
  const isOnline = useNetworkStore((s) => s.isOnline)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const comments = useMemo(
    () =>
      allComments
        .filter((c) => c.boulderId === boulderId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allComments, boulderId]
  )

  const visibleComments = comments.slice(0, visibleCount)
  const hasMore = visibleCount < comments.length

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Commentaires{comments.length > 0 ? ` (${comments.length})` : ''}
        </h2>
      </div>

      {/* Offline sync indicator */}
      {!isOnline && comments.length > 0 && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          <Wifi className="h-3 w-3 shrink-0" />
          Hors-ligne — commentaires issus du dernier sync
        </div>
      )}

      {/* Comment form */}
      <CommentForm boulderId={boulderId} boulderName={boulderName} />

      {/* Comment list */}
      {visibleComments.length > 0 && (
        <div className="mt-4 space-y-3">
          {visibleComments.map((comment) => (
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

          {/* Load more */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Voir plus ({comments.length - visibleCount} restant
              {comments.length - visibleCount > 1 ? 's' : ''})
            </button>
          )}
        </div>
      )}

      {comments.length === 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center">
          <MessageSquare className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Soyez le premier à commenter ce bloc
          </p>
        </div>
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

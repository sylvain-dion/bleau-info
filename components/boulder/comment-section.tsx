'use client'

import { useMemo, useState } from 'react'
import { MessageSquare, ChevronDown, EyeOff, Eye, Wifi } from 'lucide-react'
import { useCommentStore } from '@/stores/comment-store'
import { useNetworkStore } from '@/stores/network-store'
import { useCommentReportStore } from '@/stores/comment-report-store'
import { useSpoilerPreferenceStore } from '@/stores/spoiler-preference-store'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'

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
  const reportStoreReports = useCommentReportStore((s) => s.reports)
  const isRevealAllForBoulder = useSpoilerPreferenceStore(
    (s) => s.isRevealAllForBoulder,
  )
  const setRevealAll = useSpoilerPreferenceStore((s) => s.setRevealAll)
  const hideAllForBoulder = useSpoilerPreferenceStore(
    (s) => s.hideAllForBoulder,
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const revealAllOn = isRevealAllForBoulder(boulderId)

  const hiddenIds = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of reportStoreReports) {
      counts.set(r.commentId, (counts.get(r.commentId) ?? 0) + 1)
    }
    const hidden = new Set<string>()
    for (const [id, count] of counts) {
      if (count >= 3) hidden.add(id)
    }
    return hidden
  }, [reportStoreReports])

  const comments = useMemo(
    () =>
      allComments
        .filter((c) => c.boulderId === boulderId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allComments, boulderId]
  )

  const visibleComments = comments.slice(0, visibleCount)
  const hasMore = visibleCount < comments.length
  const hasBetaComments = comments.some((c) => c.containsBeta)

  function handleRevealAll() {
    setRevealAll(boulderId, true)
  }

  function handleHideAll() {
    hideAllForBoulder(boulderId, {
      commentIds: comments.filter((c) => c.containsBeta).map((c) => c.id),
      videoKeys: [],
    })
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Commentaires{comments.length > 0 ? ` (${comments.length})` : ''}
          </h2>
        </div>

        {hasBetaComments && (
          <button
            type="button"
            onClick={revealAllOn ? handleHideAll : handleRevealAll}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            data-testid="comment-section-reveal-all-toggle"
            aria-pressed={revealAllOn}
          >
            {revealAllOn ? (
              <>
                <EyeOff className="h-3 w-3" />
                Tout masquer
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Tout afficher la bêta
              </>
            )}
          </button>
        )}
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
          {visibleComments.map((comment) => {
            if (hiddenIds.has(comment.id)) {
              return (
                <div
                  key={comment.id}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground"
                >
                  <EyeOff className="h-3.5 w-3.5 shrink-0" />
                  Commentaire masqué suite à des signalements
                </div>
              )
            }

            return <CommentItem key={comment.id} comment={comment} />
          })}

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

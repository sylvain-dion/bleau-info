'use client'

import { useState } from 'react'
import { Clock, Wifi, Pencil, Trash2, Check, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCommentStore } from '@/stores/comment-store'
import { SyncStatusPill } from '@/components/ui/sync-status-pill'
import { ReportCommentButton } from './report-comment-button'
import type { BoulderComment } from '@/lib/validations/comment'

interface CommentItemProps {
  comment: BoulderComment
}

/**
 * Single comment card with edit/delete for own comments.
 *
 * - Edit: inline text input replacing the comment text
 * - Delete: confirmation step before removal
 * - Report button for other users' comments
 */
export function CommentItem({ comment }: CommentItemProps) {
  const { user } = useAuthStore()
  const updateComment = useCommentStore((s) => s.updateComment)
  const removeComment = useCommentStore((s) => s.removeComment)

  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const [editText, setEditText] = useState(comment.text)

  const isOwn = user?.id === comment.userId
  const wasEdited = comment.updatedAt !== comment.createdAt

  function handleSaveEdit() {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === comment.text) {
      setMode('view')
      return
    }
    updateComment(comment.id, trimmed)
    setMode('view')
  }

  function handleDelete() {
    removeComment(comment.id)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* Author + sync status */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-foreground">
            {comment.userName}
          </span>
          {wasEdited && (
            <span className="text-[10px] italic text-muted-foreground">
              modifié
            </span>
          )}
        </div>
        <SyncStatusPill syncStatus={comment.syncStatus} />
      </div>

      {/* Edit mode */}
      {mode === 'edit' ? (
        <div className="mt-1">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="mt-1.5 flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => { setMode('view'); setEditText(comment.text) }}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!editText.trim()}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Enregistrer
            </button>
          </div>
        </div>
      ) : mode === 'confirm-delete' ? (
        /* Delete confirmation */
        <div className="mt-1 rounded-lg bg-destructive/10 p-2.5">
          <p className="mb-2 text-xs text-destructive">
            Supprimer ce commentaire ? Cette action est irréversible.
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode('view')}
              className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-md bg-destructive px-2 py-1.5 text-xs text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <p className="text-sm leading-relaxed text-foreground">
          {comment.text}
        </p>
      )}

      {/* Footer: timestamp + actions */}
      {mode === 'view' && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatRelativeDate(comment.createdAt)}
            {comment.syncStatus === 'local' && (
              <span className="ml-1 flex items-center gap-0.5">
                <Wifi className="h-2.5 w-2.5" />
                En attente de sync
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isOwn ? (
              <>
                <button
                  type="button"
                  onClick={() => { setMode('edit'); setEditText(comment.text) }}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-2.5 w-2.5" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setMode('confirm-delete')}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Supprimer
                </button>
              </>
            ) : (
              <ReportCommentButton commentId={comment.id} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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

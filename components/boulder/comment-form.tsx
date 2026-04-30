'use client'

import { useState } from 'react'
import { Send, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCommentStore } from '@/stores/comment-store'
import { showCommentPostedToast } from '@/lib/feedback'
import { commentFormSchema } from '@/lib/validations/comment'

interface CommentFormProps {
  boulderId: string
  boulderName: string
  onSuccess?: () => void
}

/**
 * Inline comment form for a boulder.
 *
 * Shows a textarea + submit button. Validates with Zod (1-500 chars).
 * Requires authentication — shows a message if not logged in.
 */
export function CommentForm({
  boulderId,
  boulderName,
  onSuccess,
}: CommentFormProps) {
  const { user } = useAuthStore()
  const addComment = useCommentStore((s) => s.addComment)
  const [text, setText] = useState('')
  const [containsBeta, setContainsBeta] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = commentFormSchema.safeParse({
      text: text.trim(),
      containsBeta,
    })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    addComment({
      userId: user?.id ?? 'anonymous',
      userName: user?.user_metadata?.display_name ?? user?.email ?? 'Anonyme',
      userAvatar: user?.user_metadata?.avatar_preset ?? null,
      boulderId,
      boulderName,
      text: result.data.text,
      containsBeta: result.data.containsBeta,
    })

    setText('')
    setContainsBeta(false)
    setError(null)
    showCommentPostedToast()
    onSuccess?.()
  }

  if (!user) {
    return (
      <p className="py-3 text-center text-xs text-muted-foreground">
        Connectez-vous pour commenter
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="min-w-0 flex-1">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          placeholder="Un conseil, une méthode, un retour..."
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        <div className="mt-1 flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={containsBeta}
              onChange={(e) => setContainsBeta(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/50"
              data-testid="comment-form-beta-checkbox"
            />
            <EyeOff className="h-3 w-3" />
            <span>Contient de la bêta (méthode, séquence)</span>
          </label>
          <span className="text-[10px] text-muted-foreground">
            {text.length}/500
          </span>
        </div>
      </div>
      <button
        type="submit"
        disabled={!text.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        aria-label="Envoyer le commentaire"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  )
}

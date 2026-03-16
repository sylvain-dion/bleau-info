'use client'

import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { useSuggestionStore } from '@/stores/suggestion-store'
import type { BoulderSuggestion } from '@/stores/suggestion-store'
import { deletePhoto } from '@/lib/db/draft-photo-store'
import { formatGrade } from '@/lib/grades'

/**
 * Displays the user's pending boulder modification suggestions on the profile page.
 *
 * Each suggestion shows proposed name, grade, original boulder reference, and moderation status.
 * Suggestions can be deleted individually. Renders nothing when empty.
 */
export function SuggestionsSection() {
  const suggestions = useSuggestionStore((s) => s.suggestions)
  const removeSuggestion = useSuggestionStore((s) => s.removeSuggestion)

  /** Remove suggestion from store + clean up photo from IndexedDB */
  function handleDelete(suggestionId: string) {
    removeSuggestion(suggestionId)
    deletePhoto(suggestionId).catch(() => {
      // Best-effort cleanup — IndexedDB may not be available
    })
  }

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquarePlus className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Mes suggestions
        </h2>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {suggestions.length}
        </span>
      </div>

      <ul className="space-y-2" role="list">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            {/* Grade badge */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {formatGrade(suggestion.grade)}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {suggestion.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Modification de {suggestion.originalSnapshot.name}
                {' · '}
                {formatDate(suggestion.createdAt)}
              </p>
            </div>

            {/* Moderation status pill */}
            <ModerationStatusPill status={suggestion.moderationStatus} />

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleDelete(suggestion.id)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Supprimer la suggestion ${suggestion.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Les suggestions sont en attente de modération par la communauté.
      </p>
    </div>
  )
}

/** Visual config for each moderation status */
const MODERATION_STATUS_CONFIG: Record<
  BoulderSuggestion['moderationStatus'],
  { label: string; className: string }
> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  approved: {
    label: 'Approuvée',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  rejected: {
    label: 'Rejetée',
    className: 'bg-destructive/10 text-destructive',
  },
}

function ModerationStatusPill({
  status,
}: {
  status: BoulderSuggestion['moderationStatus']
}) {
  const config = MODERATION_STATUS_CONFIG[status]
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}
      data-testid="moderation-status-pill"
    >
      {config.label}
    </span>
  )
}

/** Format ISO date to short French locale (e.g. "13 mars 2026") */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

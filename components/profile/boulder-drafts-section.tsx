'use client'

import { useState } from 'react'
import { Mountain, Pencil, Trash2 } from 'lucide-react'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { STYLE_LABELS } from '@/lib/validations/boulder'
import { formatGrade } from '@/lib/grades'
import { BoulderCreationDrawer } from '@/components/boulder/boulder-creation-drawer'

/**
 * Displays the user's local boulder drafts on the profile page.
 *
 * Each draft shows name, grade, style, and creation date.
 * Drafts can be edited (pen icon) or deleted individually.
 * Renders nothing when empty.
 */
export function BoulderDraftsSection() {
  const drafts = useBoulderDraftStore((s) => s.drafts)
  const removeDraft = useBoulderDraftStore((s) => s.removeDraft)
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)

  if (drafts.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Mountain className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Mes brouillons de blocs
        </h2>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {drafts.length}
        </span>
      </div>

      <ul className="space-y-2" role="list">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            {/* Grade badge */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              {formatGrade(draft.grade)}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {draft.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {STYLE_LABELS[draft.style]}
                {draft.sector ? ` · ${draft.sector}` : ''}
                {' · '}
                {formatDate(draft.createdAt)}
              </p>
            </div>

            {/* Status pill */}
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                draft.status === 'pending'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {draft.status === 'pending' ? 'En attente' : 'Brouillon'}
            </span>

            {/* Edit */}
            <button
              type="button"
              onClick={() => setEditingDraftId(draft.id)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              aria-label={`Modifier le brouillon ${draft.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeDraft(draft.id)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Supprimer le brouillon ${draft.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Les brouillons sont sauvegardés localement. Ils seront synchronisés avec le serveur lors d&apos;une prochaine mise à jour.
      </p>

      {/* Edit drawer */}
      <BoulderCreationDrawer
        open={!!editingDraftId}
        onOpenChange={(open) => { if (!open) setEditingDraftId(null) }}
        editDraftId={editingDraftId ?? undefined}
      />
    </div>
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

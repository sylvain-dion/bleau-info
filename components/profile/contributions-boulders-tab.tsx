'use client'

import { useMemo, useState } from 'react'
import { Mountain, Pencil, Trash2, Search, ChevronDown, Plus } from 'lucide-react'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { deletePhoto } from '@/lib/db/draft-photo-store'
import {
  filterAndSortBoulderDrafts,
  getDraftStatus,
  statusBadge,
  type BoulderFilters,
  type BoulderSortKey,
  type ContributionStatus,
} from '@/lib/contributions-hub'
import { STYLE_LABELS } from '@/lib/validations/boulder'
import { formatGrade } from '@/lib/grades'
import { BoulderCreationDrawer } from '@/components/boulder/boulder-creation-drawer'
import { ContributionStatusPill } from '@/components/profile/contribution-status-pill'
import {
  ContributionDeleteDialog,
  type ContributionDeleteTarget,
} from '@/components/profile/contribution-delete-dialog'
import { SyncStatusPill } from '@/components/ui/sync-status-pill'

const STATUS_OPTIONS: Array<{ value: ContributionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'online', label: statusBadge('online').label },
  { value: 'draft', label: statusBadge('draft').label },
  { value: 'pending', label: statusBadge('pending').label },
  { value: 'rejected', label: statusBadge('rejected').label },
  { value: 'pending_deletion', label: statusBadge('pending_deletion').label },
]

const SORT_OPTIONS: Array<{ value: BoulderSortKey; label: string }> = [
  { value: 'date-desc', label: 'Plus récents' },
  { value: 'date-asc', label: 'Plus anciens' },
  { value: 'name-asc', label: 'Nom (A→Z)' },
]

/** Show search input only when the list is dense enough to benefit. */
const SEARCH_THRESHOLD = 15

/**
 * Tab "Blocs" of the contributions hub (Story 5.8).
 *
 * Lists local boulder drafts with status pills, status / sort toolbar,
 * and Edit (drawer) + Delete (soft-delete) actions.
 */
export function ContributionsBouldersTab() {
  const drafts = useBoulderDraftStore((s) => s.drafts)
  const requestDeletion = useBoulderDraftStore((s) => s.requestDeletion)

  const [filters, setFilters] = useState<BoulderFilters>({})
  const [sortKey, setSortKey] = useState<BoulderSortKey>('date-desc')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    target: ContributionDeleteTarget
  } | null>(null)

  const filtered = useMemo(
    () => filterAndSortBoulderDrafts(drafts, filters, sortKey),
    [drafts, filters, sortKey],
  )

  const showSearch = drafts.length >= SEARCH_THRESHOLD

  function handleConfirmDelete(): 'removed' | 'pending' | 'noop' {
    if (!pendingDelete) return 'noop'
    const result = requestDeletion(pendingDelete.id)
    if (result === 'removed') {
      // Best-effort cleanup of the photo blob
      deletePhoto(pendingDelete.id).catch(() => {
        /* IndexedDB unavailable — ignore */
      })
    }
    return result
  }

  if (drafts.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center"
        data-testid="boulders-empty"
      >
        <Mountain className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">
          Aucune création de bloc
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vos créations et brouillons apparaîtront ici.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          data-testid="create-boulder-cta"
        >
          <Plus className="h-3.5 w-3.5" />
          Créer un bloc
        </button>
        <BoulderCreationDrawer
          open={creating}
          onOpenChange={setCreating}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        {showSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={filters.search ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Rechercher un bloc, un secteur…"
              aria-label="Rechercher dans mes blocs"
              className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Statut"
            value={filters.status ?? 'all'}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                status: v as ContributionStatus | 'all',
              }))
            }
            options={STATUS_OPTIONS}
          />
          <FilterSelect<BoulderSortKey>
            label="Tri"
            value={sortKey}
            onChange={setSortKey}
            options={SORT_OPTIONS}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {filtered.length} sur {drafts.length} bloc
            {drafts.length > 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            data-testid="create-boulder-cta"
          >
            <Plus className="h-3 w-3" />
            Nouveau bloc
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground"
          data-testid="boulders-empty-filtered"
        >
          Aucun bloc ne correspond à ces filtres.
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {filtered.map((draft) => {
            const status = getDraftStatus(draft)
            const statusKey: ContributionStatus = status
            return (
              <li
                key={draft.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                data-testid={`boulder-row-${draft.id}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {formatGrade(draft.grade)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {draft.name || '(sans nom)'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {STYLE_LABELS[draft.style]}
                    {draft.sector ? ` · ${draft.sector}` : ''}
                    {' · '}
                    {formatDate(draft.createdAt)}
                  </p>
                </div>
                <ContributionStatusPill status={statusKey} />
                {draft.syncStatus !== 'synced' && (
                  <SyncStatusPill syncStatus={draft.syncStatus} />
                )}
                <button
                  type="button"
                  onClick={() => setEditingId(draft.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={`Modifier le bloc ${draft.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPendingDelete({
                      id: draft.id,
                      target: {
                        title: draft.name || '(sans nom)',
                        status,
                      },
                    })
                  }
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Supprimer le bloc ${draft.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Edit drawer */}
      <BoulderCreationDrawer
        open={!!editingId || creating}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
            setCreating(false)
          }
        }}
        editDraftId={editingId ?? undefined}
      />

      {/* Soft-delete dialog */}
      <ContributionDeleteDialog
        open={!!pendingDelete}
        target={pendingDelete?.target ?? null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}) {
  return (
    <label className="relative flex flex-1 items-center text-xs">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-1.5 pr-7 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground"
        aria-hidden="true"
      />
    </label>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

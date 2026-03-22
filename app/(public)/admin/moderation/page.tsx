'use client'

import { useMemo, useState } from 'react'
import { Shield, Inbox } from 'lucide-react'
import {
  collectQueueItems,
  filterQueueItems,
  extractQueueSectors,
  type QueueFilters,
  type QueueItem,
} from '@/lib/moderation/queue-service'
import { QueueItemCard } from '@/components/moderation/queue-item'
import { QueueFiltersBar } from '@/components/moderation/queue-filters'

/**
 * Moderation queue page — `/admin/moderation`
 *
 * Lists all pending submissions (drafts + suggestions) sorted
 * by priority: duplicates > creations > modifications.
 * Accessible to moderators (role check stubbed for mock phase).
 */
export default function ModerationPage() {
  const [filters, setFilters] = useState<QueueFilters>({
    type: 'all',
    sector: null,
  })
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)

  const allItems = useMemo(() => collectQueueItems(), [])
  const filteredItems = useMemo(
    () => filterQueueItems(allItems, filters),
    [allItems, filters]
  )
  const sectors = useMemo(() => extractQueueSectors(allItems), [allItems])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Modération</h1>
            <p className="text-xs text-muted-foreground">
              File d&apos;attente des soumissions
            </p>
          </div>
          {allItems.length > 0 && (
            <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {allItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      {allItems.length > 0 && (
        <div className="mb-4">
          <QueueFiltersBar
            filters={filters}
            onChange={setFilters}
            sectors={sectors}
            totalCount={allItems.length}
            filteredCount={filteredItems.length}
          />
        </div>
      )}

      {/* Queue list */}
      {filteredItems.length > 0 ? (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onSelect={setSelectedItem}
            />
          ))}
        </div>
      ) : allItems.length > 0 ? (
        <EmptyFilterState onReset={() => setFilters({ type: 'all', sector: null })} />
      ) : (
        <EmptyQueueState />
      )}

      {/* Selected item detail placeholder (Story 7.3 will add side-by-side) */}
      {selectedItem && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            {selectedItem.name} sélectionné
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            La comparaison side-by-side sera disponible dans la Story 7.3.
          </p>
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

function EmptyQueueState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">
        Aucune soumission en attente
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Les nouvelles soumissions apparaîtront ici.
      </p>
    </div>
  )
}

function EmptyFilterState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <p className="text-sm text-muted-foreground">
        Aucun résultat pour ces filtres.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 text-xs text-primary hover:underline"
      >
        Réinitialiser les filtres
      </button>
    </div>
  )
}

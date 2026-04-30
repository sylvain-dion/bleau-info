'use client'

import { useMemo, useState } from 'react'
import { Megaphone, Plus, Sparkles, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { CallCard } from './call-card'
import { CallForm } from './call-form'

const PAGE_SIZE = 8

interface CallsFeedProps {
  /**
   * Filter calls down to a single sector. When set, the form is
   * pre-filled with that sector and only matching calls render.
   */
  sectorSlug?: string
  sectorName?: string
  /** Optional title shown above the feed. */
  title?: string
}

/**
 * Story 15.3 — broadcast feed.
 *
 * Lists active "Grimpons ensemble" calls (today or later) ordered by
 * planned date. Provides a "Lancer un appel" affordance that swaps the
 * list for an inline form.
 */
export function CallsFeed({
  sectorSlug,
  sectorName,
  title = 'Grimpons ensemble',
}: CallsFeedProps) {
  const { user } = useAuthStore()
  const calls = useClimbingCallStore((s) => s.calls)
  const responses = useClimbingCallStore((s) => s.responses)
  const [showForm, setShowForm] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const activeCalls = useMemo(() => {
    const now = new Date()
    const cutoff = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return calls
      .filter((c) => c.plannedDate >= cutoff)
      .filter((c) => (sectorSlug ? c.sectorSlug === sectorSlug : true))
      .sort((a, b) => {
        if (a.plannedDate !== b.plannedDate) {
          return a.plannedDate < b.plannedDate ? -1 : 1
        }
        return a.createdAt < b.createdAt ? -1 : 1
      })
  }, [calls, sectorSlug])

  // Track responses just to opt this component into reactivity when
  // someone RSVPs — the actual count is derived inside CallCard.
  void responses

  const visibleCalls = activeCalls.slice(0, visibleCount)
  const hasMore = visibleCount < activeCalls.length

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            {title}
            {activeCalls.length > 0 && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                ({activeCalls.length})
              </span>
            )}
          </h2>
        </div>

        {!showForm && user && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            data-testid="calls-feed-open-form"
            className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Lancer un appel
          </button>
        )}
      </header>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4">
          <CallForm
            defaultSectorSlug={sectorSlug}
            defaultSectorName={sectorName}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {visibleCalls.length > 0 ? (
        <div className="space-y-3">
          {visibleCalls.map((call) => (
            <CallCard key={call.id} call={call} hideSector={!!sectorSlug} />
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Voir plus ({activeCalls.length - visibleCount} restant
              {activeCalls.length - visibleCount > 1 ? 's' : ''})
            </button>
          )}
        </div>
      ) : (
        !showForm && (
          <div
            className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center"
            data-testid="calls-feed-empty"
          >
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {sectorSlug
                ? "Aucun appel prévu sur ce secteur pour l'instant."
                : "Aucun appel en cours. Sois le premier à en lancer un !"}
            </p>
            {user && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3 w-3" />
                Lancer un appel
              </button>
            )}
          </div>
        )
      )}
    </section>
  )
}

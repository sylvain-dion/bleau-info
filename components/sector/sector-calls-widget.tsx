'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Megaphone, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { CallsFeed } from '@/components/calls/calls-feed'

interface SectorCallsWidgetProps {
  sectorSlug: string
  sectorName: string
}

/**
 * Story 15.3 — sector page widget surfacing active "Grimpons ensemble"
 * calls. Renders nothing when there are no calls AND the sheet is
 * collapsed, to keep the page short. Tapping the header expands the
 * inline feed (which also exposes the "Lancer un appel" button).
 */
export function SectorCallsWidget({
  sectorSlug,
  sectorName,
}: SectorCallsWidgetProps) {
  const calls = useClimbingCallStore((s) => s.calls)
  const [expanded, setExpanded] = useState(false)

  const activeCount = useMemo(() => {
    const now = new Date()
    const cutoff = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return calls.filter(
      (c) => c.sectorSlug === sectorSlug && c.plannedDate >= cutoff,
    ).length
  }, [calls, sectorSlug])

  // Always render the toggle so users can launch an appel even on a
  // sector that has none yet — keeps the affordance discoverable.
  return (
    <section
      className="mb-3 rounded-lg border border-border bg-card"
      data-testid="sector-calls-widget"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Grimpons ensemble
          </span>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {activeCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <CallsFeed
            sectorSlug={sectorSlug}
            sectorName={sectorName}
            title="Appels sur ce secteur"
          />
          <Link
            href="/grimpons"
            className="flex items-center justify-center gap-1 rounded-md border border-border bg-background py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Voir tous les appels
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </section>
  )
}

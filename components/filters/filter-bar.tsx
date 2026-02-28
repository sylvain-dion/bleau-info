'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useFilterStore, countActiveFilters } from '@/stores/filter-store'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type { CircuitColor } from '@/lib/data/mock-boulders'
import { FilterChip } from './filter-chip'
import { FilterDrawer } from './filter-drawer'

/** Labels for circuit colors in French */
const CIRCUIT_LABELS: Record<CircuitColor, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}

interface FilterBarProps {
  /** Number of boulders currently visible on the map */
  visibleCount: number
  /** Total number of boulders */
  totalCount: number
}

export function FilterBar({ visibleCount, totalCount }: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { circuits, strollerOnly, toggleCircuit, resetFilters } = useFilterStore()
  const activeCount = countActiveFilters(useFilterStore.getState())
  const hasFilters = activeCount > 0

  return (
    <>
      <div className="absolute left-0 right-0 top-0 z-10 bg-background/90 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-none">
          {/* Filter button with active count badge */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
              hasFilters
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-background text-foreground hover:bg-accent'
            }`}
            aria-label={`Filtres${hasFilters ? ` (${activeCount} actifs)` : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtres</span>
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
                {activeCount}
              </span>
            )}
          </button>

          {/* Quick circuit color chips */}
          {(Object.keys(CIRCUIT_LABELS) as CircuitColor[]).map((color) => (
            <FilterChip
              key={color}
              label={CIRCUIT_LABELS[color]}
              active={circuits.includes(color)}
              onClick={() => toggleCircuit(color)}
              colorDot={CIRCUIT_COLORS[color]}
            />
          ))}

          {/* Quick stroller toggle */}
          <FilterChip
            label="Poussette"
            active={strollerOnly}
            onClick={() => useFilterStore.getState().setStrollerOnly(!strollerOnly)}
          />
        </div>

        {/* Result count + reset */}
        {hasFilters && (
          <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {visibleCount} / {totalCount} blocs
            </span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <X className="h-3 w-3" />
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      <FilterDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}

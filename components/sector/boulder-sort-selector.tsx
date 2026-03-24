'use client'

import { ArrowUpDown } from 'lucide-react'

export type SortOption =
  | 'grade-asc'
  | 'grade-desc'
  | 'name-asc'
  | 'name-desc'
  | 'unticked-first'
  | 'projects-first'

interface SortOptionConfig {
  value: SortOption
  label: string
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'grade-asc', label: 'Cotation ↑' },
  { value: 'grade-desc', label: 'Cotation ↓' },
  { value: 'name-asc', label: 'Nom A→Z' },
  { value: 'name-desc', label: 'Nom Z→A' },
  { value: 'unticked-first', label: 'Non réalisés' },
  { value: 'projects-first', label: 'Mes projets' },
]

interface BoulderSortSelectorProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

/**
 * Horizontal pill selector for boulder list sort order.
 */
export function BoulderSortSelector({ value, onChange }: BoulderSortSelectorProps) {
  return (
    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="flex gap-1">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              value === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

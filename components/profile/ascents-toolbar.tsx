'use client'

import { Search, ArrowDownUp } from 'lucide-react'
import { GRADE_SCALE, formatGrade } from '@/lib/grades'
import { TICK_STYLE_OPTIONS, type TickStyle } from '@/lib/validations/tick'
import type { AscentSortKey, AscentFilters } from '@/lib/ascents-hub'

interface AscentsToolbarProps {
  filters: AscentFilters
  sortKey: AscentSortKey
  onFiltersChange: (filters: AscentFilters) => void
  onSortChange: (key: AscentSortKey) => void
  /** Total tick count (for "X résultats" pill). */
  totalCount: number
  /** Filtered count after toolbar applies its filters. */
  filteredCount: number
}

const SORT_OPTIONS: ReadonlyArray<{ key: AscentSortKey; label: string }> = [
  { key: 'date-desc', label: 'Date ↓' },
  { key: 'date-asc', label: 'Date ↑' },
  { key: 'grade-desc', label: 'Niveau ↓' },
  { key: 'grade-asc', label: 'Niveau ↑' },
  { key: 'name-asc', label: 'A → Z' },
]

export function AscentsToolbar({
  filters,
  sortKey,
  onFiltersChange,
  onSortChange,
  totalCount,
  filteredCount,
}: AscentsToolbarProps) {
  const styles = filters.styles ?? []

  function toggleStyle(style: TickStyle) {
    const set = new Set(styles)
    if (set.has(style)) set.delete(style)
    else set.add(style)
    onFiltersChange({ ...filters, styles: Array.from(set) })
  }

  function updateSearch(value: string) {
    onFiltersChange({ ...filters, search: value })
  }

  function updateGrade(field: 'minGrade' | 'maxGrade', value: string) {
    onFiltersChange({ ...filters, [field]: value || null })
  }

  return (
    <div className="space-y-3" data-testid="ascents-toolbar">
      {/* Search */}
      <label className="relative block">
        <span className="sr-only">Rechercher un bloc</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher un bloc…"
          value={filters.search ?? ''}
          onChange={(e) => updateSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          data-testid="ascents-search"
        />
      </label>

      {/* Style toggles */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrer par style"
      >
        {TICK_STYLE_OPTIONS.map((opt) => {
          const active = styles.includes(opt.key)
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => toggleStyle(opt.key)}
              aria-pressed={active}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? `${opt.borderColor} ${opt.bgTint} ${opt.color}`
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
              data-testid={`style-toggle-${opt.key}`}
            >
              <span aria-hidden="true">{opt.icon}</span>
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Grade range + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          De
          <select
            value={filters.minGrade ?? ''}
            onChange={(e) => updateGrade('minGrade', e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="min-grade-select"
            aria-label="Cotation minimum"
          >
            <option value="">—</option>
            {GRADE_SCALE.map((g) => (
              <option key={g} value={g}>
                {formatGrade(g)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          à
          <select
            value={filters.maxGrade ?? ''}
            onChange={(e) => updateGrade('maxGrade', e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="max-grade-select"
            aria-label="Cotation maximum"
          >
            <option value="">—</option>
            {GRADE_SCALE.map((g) => (
              <option key={g} value={g}>
                {formatGrade(g)}
              </option>
            ))}
          </select>
        </label>

        <label className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowDownUp className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Trier par</span>
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as AscentSortKey)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="sort-select"
            aria-label="Trier les ascensions"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount} ascension${totalCount > 1 ? 's' : ''}`
          : `${filteredCount} sur ${totalCount} ascension${totalCount > 1 ? 's' : ''}`}
      </p>
    </div>
  )
}

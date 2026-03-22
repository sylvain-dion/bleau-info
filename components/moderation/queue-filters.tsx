'use client'

import { Filter } from 'lucide-react'
import type { QueueFilters, SubmissionType } from '@/lib/moderation/queue-service'

interface QueueFiltersBarProps {
  filters: QueueFilters
  onChange: (filters: QueueFilters) => void
  sectors: string[]
  totalCount: number
  filteredCount: number
}

/**
 * Filter bar for the moderation queue.
 *
 * Allows filtering by submission type and sector.
 */
export function QueueFiltersBar({
  filters,
  onChange,
  sectors,
  totalCount,
  filteredCount,
}: QueueFiltersBarProps) {
  return (
    <div className="space-y-3">
      {/* Type filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <TypeChip
          label="Tout"
          active={filters.type === 'all'}
          onClick={() => onChange({ ...filters, type: 'all' })}
        />
        <TypeChip
          label="Créations"
          active={filters.type === 'creation'}
          onClick={() => onChange({ ...filters, type: 'creation' })}
        />
        <TypeChip
          label="Modifications"
          active={filters.type === 'modification'}
          onClick={() => onChange({ ...filters, type: 'modification' })}
        />
      </div>

      {/* Sector dropdown */}
      {sectors.length > 1 && (
        <select
          value={filters.sector ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              sector: e.target.value || null,
            })
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          aria-label="Filtrer par secteur"
        >
          <option value="">Tous les secteurs</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount} soumission${totalCount !== 1 ? 's' : ''} en attente`
          : `${filteredCount} sur ${totalCount} soumission${totalCount !== 1 ? 's' : ''}`}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  )
}

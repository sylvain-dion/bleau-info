'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Map } from 'lucide-react'
import { CIRCUIT_COLORS, type CircuitColor } from '@/lib/data/mock-boulders'

export type SortOption =
  | 'grade-asc'
  | 'grade-desc'
  | 'circuits'
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
  { value: 'circuits', label: 'Circuits' },
  { value: 'name-asc', label: 'Nom A→Z' },
  { value: 'name-desc', label: 'Nom Z→A' },
  { value: 'unticked-first', label: 'Non réalisés' },
  { value: 'projects-first', label: 'Mes projets' },
]

const CIRCUIT_PILL_COLORS: { value: CircuitColor | 'none'; label: string; hex: string }[] = [
  { value: 'jaune', label: 'Jaune', hex: CIRCUIT_COLORS.jaune },
  { value: 'bleu', label: 'Bleu', hex: CIRCUIT_COLORS.bleu },
  { value: 'rouge', label: 'Rouge', hex: CIRCUIT_COLORS.rouge },
  { value: 'orange', label: 'Orange', hex: CIRCUIT_COLORS.orange },
  { value: 'blanc', label: 'Blanc', hex: CIRCUIT_COLORS.blanc },
  { value: 'noir', label: 'Noir', hex: CIRCUIT_COLORS.noir },
  { value: 'none', label: 'Hors circuit', hex: '#a1a1aa' },
]

interface BoulderSortSelectorProps {
  value: SortOption
  onChange: (sort: SortOption) => void
  /** Active circuit color filters (only used when sort === 'circuits') */
  circuitFilters: (CircuitColor | 'none')[]
  onCircuitFilterToggle: (color: CircuitColor | 'none') => void
  sectorSlug?: string
}

/**
 * Horizontal pill selector for boulder list sort order.
 *
 * When "Circuits" is selected, a sub-row of circuit color pills appears.
 */
export function BoulderSortSelector({
  value,
  onChange,
  circuitFilters,
  onCircuitFilterToggle,
  sectorSlug,
}: BoulderSortSelectorProps) {
  return (
    <div className="mb-3 space-y-2">
      {/* Sort pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

      {/* Circuit color sub-pills (visible only when "Circuits" sort is active) */}
      {value === 'circuits' && (
        <div className="flex flex-wrap gap-1.5">
          {CIRCUIT_PILL_COLORS.map((pill) => {
            const isActive = circuitFilters.length === 0 || circuitFilters.includes(pill.value)
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => onCircuitFilterToggle(pill.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'ring-2 ring-primary/30'
                    : 'opacity-40'
                }`}
                style={{
                  backgroundColor: pill.hex + '20',
                  color: pill.value === 'blanc' ? '#71717a' : pill.hex,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: pill.hex,
                    border: pill.value === 'blanc' ? '1px solid #d4d4d8' : undefined,
                  }}
                />
                {pill.label}
                {circuitFilters.includes(pill.value) && circuitFilters.length > 0 && (
                  <span className="text-[9px]">×</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

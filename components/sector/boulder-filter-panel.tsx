'use client'

import { SlidersHorizontal, X, RotateCcw } from 'lucide-react'
import type { BoulderListItem } from './boulder-list-card'

// ---------------------------------------------------------------------------
// Filter state type
// ---------------------------------------------------------------------------

export interface BoulderFilters {
  gradeMin: string
  gradeMax: string
  circuits: string[]
  styles: string[]
  exposures: string[]
  status: 'all' | 'ticked' | 'unticked' | 'project' | 'favorite'
}

export const EMPTY_FILTERS: BoulderFilters = {
  gradeMin: '',
  gradeMax: '',
  circuits: [],
  styles: [],
  exposures: [],
  status: 'all',
}

export function hasActiveFilters(f: BoulderFilters): boolean {
  return countActiveFilters(f) > 0
}

/** Count the number of active filter categories */
export function countActiveFilters(f: BoulderFilters): number {
  let count = 0
  if (f.gradeMin !== '' || f.gradeMax !== '') count++
  if (f.circuits.length > 0) count++
  if (f.styles.length > 0) count++
  if (f.exposures.length > 0) count++
  if (f.status !== 'all') count++
  return count
}

// ---------------------------------------------------------------------------
// Available options (extracted from data)
// ---------------------------------------------------------------------------

const GRADE_OPTIONS = ['3a','3b','3c','4a','4b','4c','5a','5b','5c','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+','8b']

const CIRCUIT_OPTIONS = [
  { value: 'jaune', label: 'Jaune', className: 'bg-yellow-400' },
  { value: 'orange', label: 'Orange', className: 'bg-orange-400' },
  { value: 'bleu', label: 'Bleu', className: 'bg-blue-500' },
  { value: 'rouge', label: 'Rouge', className: 'bg-red-500' },
  { value: 'blanc', label: 'Blanc', className: 'bg-white border border-zinc-300' },
  { value: 'noir', label: 'Noir', className: 'bg-zinc-900' },
  { value: '__none__', label: 'Hors circuit', className: 'bg-muted' },
]

const STYLE_OPTIONS = [
  { value: 'dalle', label: 'Dalle' },
  { value: 'devers', label: 'Dévers' },
  { value: 'toit', label: 'Toit' },
  { value: 'arete', label: 'Arête' },
  { value: 'traverse', label: 'Traversée' },
  { value: 'bloc', label: 'Bloc' },
]

const EXPOSURE_OPTIONS = [
  { value: 'soleil', label: 'Soleil' },
  { value: 'ombre', label: 'Ombre' },
  { value: 'mi-ombre', label: 'Mi-ombre' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'ticked', label: 'Fait' },
  { value: 'unticked', label: 'Non fait' },
  { value: 'project', label: 'Projet' },
  { value: 'favorite', label: 'Favori' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BoulderFilterPanelProps {
  filters: BoulderFilters
  onChange: (filters: BoulderFilters) => void
  totalCount: number
  filteredCount: number
}

export function BoulderFilterPanel({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: BoulderFilterPanelProps) {
  const active = hasActiveFilters(filters)

  function toggle(field: 'circuits' | 'styles' | 'exposures', value: string) {
    const current = filters[field]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [field]: next })
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {active && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {filteredCount}/{totalCount}
            </span>
          )}
        </div>
        {active && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 pb-4">
        {/* Grade range slider */}
        <FilterSection label="Cotation">
          <GradeRangeSlider
            gradeMin={filters.gradeMin}
            gradeMax={filters.gradeMax}
            onChange={(min, max) => onChange({ ...filters, gradeMin: min, gradeMax: max })}
          />
        </FilterSection>

        {/* Circuit */}
        <FilterSection label="Circuit">
          <div className="flex flex-wrap gap-1.5">
            {CIRCUIT_OPTIONS.map((c) => {
              const isActive = filters.circuits.includes(c.value)
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggle('circuits', c.value)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {c.value !== '__none__' && (
                    <div className={`h-2.5 w-2.5 rounded-full ${c.className}`} />
                  )}
                  {c.label}
                  {isActive && <X className="h-2.5 w-2.5" />}
                </button>
              )
            })}
          </div>
        </FilterSection>

        {/* Style */}
        <FilterSection label="Style">
          <div className="flex flex-wrap gap-1.5">
            {STYLE_OPTIONS.map((s) => (
              <PillToggle
                key={s.value}
                label={s.label}
                active={filters.styles.includes(s.value)}
                onClick={() => toggle('styles', s.value)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Exposure */}
        <FilterSection label="Exposition">
          <div className="flex flex-wrap gap-1.5">
            {EXPOSURE_OPTIONS.map((e) => (
              <PillToggle
                key={e.value}
                label={e.label}
                active={filters.exposures.includes(e.value)}
                onClick={() => toggle('exposures', e.value)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Status */}
        <FilterSection label="Statut">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <PillToggle
                key={s.value}
                label={s.label}
                active={filters.status === s.value}
                onClick={() => onChange({ ...filters, status: s.value })}
              />
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter logic (pure function)
// ---------------------------------------------------------------------------

export function applyFilters(
  boulders: BoulderListItem[],
  filters: BoulderFilters,
  tickedIds: Set<string>,
  projectIds: Set<string>,
  favoriteIds: Set<string>
): BoulderListItem[] {
  if (!hasActiveFilters(filters)) return boulders

  return boulders.filter((b) => {
    // Grade range
    if (filters.gradeMin && b.grade.localeCompare(filters.gradeMin) < 0) return false
    if (filters.gradeMax && b.grade.localeCompare(filters.gradeMax) > 0) return false

    // Circuit
    if (filters.circuits.length > 0) {
      const boulderCircuit = b.circuit ?? '__none__'
      if (!filters.circuits.includes(boulderCircuit)) return false
    }

    // Style
    if (filters.styles.length > 0 && !filters.styles.includes(b.style)) return false

    // Exposure
    if (filters.exposures.length > 0 && b.exposure && !filters.exposures.includes(b.exposure)) return false

    // Status
    switch (filters.status) {
      case 'ticked':
        if (!tickedIds.has(b.id)) return false
        break
      case 'unticked':
        if (tickedIds.has(b.id)) return false
        break
      case 'project':
        if (!projectIds.has(b.id)) return false
        break
      case 'favorite':
        if (!favoriteIds.has(b.id)) return false
        break
    }

    return true
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function PillToggle({
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
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * Dual-handle grade range slider.
 *
 * Uses two native range inputs overlaid on a shared track.
 * Maps grade strings to/from indices in GRADE_OPTIONS.
 */
function GradeRangeSlider({
  gradeMin,
  gradeMax,
  onChange,
}: {
  gradeMin: string
  gradeMax: string
  onChange: (min: string, max: string) => void
}) {
  const minIdx = gradeMin ? GRADE_OPTIONS.indexOf(gradeMin) : 0
  const maxIdx = gradeMax ? GRADE_OPTIONS.indexOf(gradeMax) : GRADE_OPTIONS.length - 1
  const safeMin = minIdx >= 0 ? minIdx : 0
  const safeMax = maxIdx >= 0 ? maxIdx : GRADE_OPTIONS.length - 1
  const last = GRADE_OPTIONS.length - 1

  const isDefault = safeMin === 0 && safeMax === last

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    const clamped = Math.min(val, safeMax)
    const newMin = clamped === 0 ? '' : GRADE_OPTIONS[clamped]
    const newMax = safeMax === last ? '' : GRADE_OPTIONS[safeMax]
    onChange(newMin, newMax)
  }

  function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value)
    const clamped = Math.max(val, safeMin)
    const newMin = safeMin === 0 ? '' : GRADE_OPTIONS[safeMin]
    const newMax = clamped === last ? '' : GRADE_OPTIONS[clamped]
    onChange(newMin, newMax)
  }

  // Percentage positions for the active range highlight
  const leftPct = (safeMin / last) * 100
  const rightPct = 100 - (safeMax / last) * 100

  return (
    <div>
      {/* Labels */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          {GRADE_OPTIONS[safeMin]}
        </span>
        {!isDefault && (
          <span className="text-[10px] text-muted-foreground">
            {GRADE_OPTIONS[safeMin]} → {GRADE_OPTIONS[safeMax]}
          </span>
        )}
        <span className="text-xs font-medium text-foreground">
          {GRADE_OPTIONS[safeMax]}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-6">
        {/* Background track */}
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted" />

        {/* Active range highlight */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        {/* Min handle */}
        <input
          type="range"
          min={0}
          max={last}
          value={safeMin}
          onChange={handleMinChange}
          className="pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm"
          style={{ zIndex: safeMin > last - 5 ? 5 : 3 }}
        />

        {/* Max handle */}
        <input
          type="range"
          min={0}
          max={last}
          value={safeMax}
          onChange={handleMaxChange}
          className="pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  )
}

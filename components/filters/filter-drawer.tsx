'use client'

import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { useFilterStore } from '@/stores/filter-store'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type { CircuitColor, BoulderStyle, BoulderExposure } from '@/lib/data/mock-boulders'
import { formatGrade } from '@/lib/grades'
import type { Grade } from '@/lib/grades'
import { FilterChip } from './filter-chip'

const CIRCUIT_LABELS: Record<CircuitColor, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}

const STYLE_LABELS: Record<BoulderStyle, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

const EXPOSURE_LABELS: Record<BoulderExposure, string> = {
  ombre: 'À l\'ombre',
  soleil: 'Au soleil',
  'mi-ombre': 'Mi-ombre',
}

/** Subset of grades for the grade picker (not every sub-grade) */
const GRADE_PRESETS: Grade[] = ['3a', '4a', '5a', '5c', '6a', '6b', '6c', '7a', '7b', '8a']

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilterDrawer({ open, onOpenChange }: FilterDrawerProps) {
  const {
    circuits,
    styles,
    gradeMin,
    gradeMax,
    exposures,
    strollerOnly,
    toggleCircuit,
    toggleStyle,
    toggleExposure,
    setGradeRange,
    setStrollerOnly,
    resetFilters,
  } = useFilterStore()

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-2xl bg-background">
          {/* Drag handle */}
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted-foreground/30" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Drawer.Title className="text-lg font-bold text-foreground">
              Filtres
            </Drawer.Title>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fermer les filtres"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable filter sections */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {/* Circuit */}
            <FilterSection title="Circuit">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CIRCUIT_LABELS) as CircuitColor[]).map((color) => (
                  <FilterChip
                    key={color}
                    label={CIRCUIT_LABELS[color]}
                    active={circuits.includes(color)}
                    onClick={() => toggleCircuit(color)}
                    colorDot={CIRCUIT_COLORS[color]}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Grade range */}
            <FilterSection title="Niveau">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-10 text-sm text-muted-foreground">Min</label>
                  <select
                    value={gradeMin ?? ''}
                    onChange={(e) =>
                      setGradeRange(
                        (e.target.value || null) as Grade | null,
                        gradeMax
                      )
                    }
                    className="min-touch flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Aucun</option>
                    {GRADE_PRESETS.map((g) => (
                      <option key={g} value={g}>
                        {formatGrade(g)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-10 text-sm text-muted-foreground">Max</label>
                  <select
                    value={gradeMax ?? ''}
                    onChange={(e) =>
                      setGradeRange(
                        gradeMin,
                        (e.target.value || null) as Grade | null
                      )
                    }
                    className="min-touch flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Aucun</option>
                    {GRADE_PRESETS.map((g) => (
                      <option key={g} value={g}>
                        {formatGrade(g)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FilterSection>

            {/* Style */}
            <FilterSection title="Style">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STYLE_LABELS) as BoulderStyle[]).map((style) => (
                  <FilterChip
                    key={style}
                    label={STYLE_LABELS[style]}
                    active={styles.includes(style)}
                    onClick={() => toggleStyle(style)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Exposure */}
            <FilterSection title="Exposition">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EXPOSURE_LABELS) as BoulderExposure[]).map((exp) => (
                  <FilterChip
                    key={exp}
                    label={EXPOSURE_LABELS[exp]}
                    active={exposures.includes(exp)}
                    onClick={() => toggleExposure(exp)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Stroller */}
            <FilterSection title="Accessibilité">
              <button
                onClick={() => setStrollerOnly(!strollerOnly)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  strollerOnly
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
                role="switch"
                aria-checked={strollerOnly}
              >
                <span aria-hidden="true">👶</span>
                Accessible poussette
              </button>
            </FilterSection>
          </div>

          {/* Footer with reset */}
          <div className="border-t border-border px-5 py-4">
            <button
              onClick={() => {
                resetFilters()
                onOpenChange(false)
              }}
              className="w-full rounded-lg border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/50 py-4 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  )
}

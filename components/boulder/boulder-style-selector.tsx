'use client'

import { STYLE_CHIP_OPTIONS, type BoulderStyleValue } from '@/lib/validations/boulder'

interface BoulderStyleSelectorProps {
  value: BoulderStyleValue | ''
  onChange: (style: BoulderStyleValue) => void
  error?: string
}

/**
 * Visual chip selector for boulder climbing style (FR-20).
 *
 * 6 chips in 2 rows of 3. Uses radiogroup pattern for accessibility.
 */
export function BoulderStyleSelector({ value, onChange, error }: BoulderStyleSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        Style de grimpe <span className="text-destructive">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Style de grimpe">
        {STYLE_CHIP_OPTIONS.map((chip) => {
          const isSelected = value === chip.key
          return (
            <button
              key={chip.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(chip.key)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2.5 transition-colors min-touch ${
                isSelected
                  ? `${chip.borderColor} ${chip.bgTint}`
                  : 'border-transparent bg-muted/50 hover:border-border hover:bg-muted'
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {chip.icon}
              </span>
              <span
                className={`text-xs font-medium ${
                  isSelected ? chip.color : 'text-muted-foreground'
                }`}
              >
                {chip.label}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

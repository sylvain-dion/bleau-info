'use client'

import { TICK_STYLE_OPTIONS, type TickStyle } from '@/lib/validations/tick'

interface TickStyleSelectorProps {
  value: TickStyle | ''
  onChange: (style: TickStyle) => void
  error?: string
}

/**
 * Visual selector for tick (ascension) style.
 *
 * Three buttons: ⚡ Flash, 👁️ À vue, 💪 Travaillé
 * Uses radiogroup pattern for accessibility.
 */
export function TickStyleSelector({ value, onChange, error }: TickStyleSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        Style d&apos;ascension
      </label>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Style d'ascension">
        {TICK_STYLE_OPTIONS.map((style) => {
          const isSelected = value === style.key
          return (
            <button
              key={style.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(style.key)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors min-touch ${
                isSelected
                  ? `${style.borderColor} ${style.bgTint}`
                  : 'border-transparent bg-muted/50 hover:border-border hover:bg-muted'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {style.icon}
              </span>
              <span
                className={`text-xs font-medium ${
                  isSelected ? style.color : 'text-muted-foreground'
                }`}
              >
                {style.label}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

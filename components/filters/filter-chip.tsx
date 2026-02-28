'use client'

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
  /** Optional color dot displayed before the label */
  colorDot?: string
}

export function FilterChip({ label, active, onClick, colorDot }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      }`}
      role="checkbox"
      aria-checked={active}
    >
      {colorDot && (
        <span
          className="h-2.5 w-2.5 rounded-full border border-black/10"
          style={{ backgroundColor: colorDot }}
          aria-hidden="true"
        />
      )}
      {label}
    </button>
  )
}

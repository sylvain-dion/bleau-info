interface DiffBadgeProps {
  /** The original value to compare against. */
  original: string
  /** The current (proposed) value. */
  current: string
  /** Optional display formatter (e.g. formatGrade). */
  formatValue?: (value: string) => string
}

/**
 * Inline badge showing the original value when a field has been modified.
 *
 * Renders nothing when `original === current` (no change).
 * Displays "Modifié · Avant : {original}" in amber when different.
 */
export function DiffBadge({ original, current, formatValue }: DiffBadgeProps) {
  if (original === current) return null

  const display = formatValue ? formatValue(original) : original

  return (
    <span
      className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
      data-testid="diff-badge"
    >
      Modifié · Avant : {display}
    </span>
  )
}

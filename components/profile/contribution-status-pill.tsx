import { statusBadge, type ContributionStatus } from '@/lib/contributions-hub'

/**
 * Visual badge for a contribution's hub status — used by both the
 * Médias and Blocs tabs (Story 5.8).
 */
export function ContributionStatusPill({
  status,
  className = '',
}: {
  status: ContributionStatus
  className?: string
}) {
  const badge = statusBadge(status)
  return (
    <span
      data-testid={`status-pill-${status}`}
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  )
}

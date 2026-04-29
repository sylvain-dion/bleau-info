import Link from 'next/link'
import { CheckCircle2, Award, CalendarDays, ChevronRight } from 'lucide-react'

interface ProfileStatsProps {
  /** ISO date string of when the user created their account */
  memberSince: string
  /** Number of completed ascents (ticks). */
  tickCount: number
  /** Contribution points. Mock 0 until Epic 4. */
  contributionPoints: number
}

/**
 * Read-only stat cards displayed on the profile page.
 *
 * The "Croix" card now navigates to the dedicated hub
 * `/profil/mes-ascensions` (Story 4.6) where the user can drill into
 * their carnet, circuits and statistics.
 */
export function ProfileStats({ memberSince, tickCount, contributionPoints }: ProfileStatsProps) {
  const formattedDate = new Date(memberSince).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="grid grid-cols-3 gap-3">
      <Link
        href="/profil/mes-ascensions"
        aria-label={`Voir mes ascensions (${tickCount} croix)`}
        className="group flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        data-testid="profile-stats-croix-link"
      >
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <p className="text-lg font-bold text-foreground">{tickCount}</p>
        <p className="flex items-center gap-0.5 text-xs text-muted-foreground">
          Croix
          <ChevronRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </p>
      </Link>
      <StatCard
        icon={<Award className="h-5 w-5 text-primary" />}
        value={contributionPoints}
        label="Points"
      />
      <StatCard
        icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
        value={formattedDate}
        label="Membre depuis"
      />
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 text-center">
      {icon}
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

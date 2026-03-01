import { CheckCircle2, Award, CalendarDays } from 'lucide-react'

interface ProfileStatsProps {
  /** ISO date string of when the user created their account */
  memberSince: string
  /** Number of completed ascents (ticks). Mock 0 until Epic 4. */
  tickCount: number
  /** Contribution points. Mock 0 until Epic 4. */
  contributionPoints: number
}

/**
 * Read-only stat cards displayed on the profile page.
 *
 * Shows placeholder zeroes for ticks and contribution points —
 * real data will come from the database in Epic 4 (Carnet de Croix).
 */
export function ProfileStats({ memberSince, tickCount, contributionPoints }: ProfileStatsProps) {
  const formattedDate = new Date(memberSince).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
        value={tickCount}
        label="Croix"
      />
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

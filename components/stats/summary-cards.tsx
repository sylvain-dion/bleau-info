import { Mountain, TrendingUp } from 'lucide-react'

interface SummaryCardsProps {
  uniqueBoulders: number
  totalTicks: number
}

export function SummaryCards({ uniqueBoulders, totalTicks }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-5 text-center">
        <Mountain className="h-6 w-6 text-primary" />
        <p className="text-3xl font-black text-foreground">{uniqueBoulders}</p>
        <p className="text-xs text-muted-foreground">Blocs uniques</p>
      </div>
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-5 text-center">
        <TrendingUp className="h-6 w-6 text-green-500" />
        <p className="text-3xl font-black text-foreground">{totalTicks}</p>
        <p className="text-xs text-muted-foreground">Croix totales</p>
      </div>
    </div>
  )
}

import { BarChart3 } from 'lucide-react'

export function StatsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">Aucune statistique</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Loguez vos premières croix pour voir vos statistiques de progression
      </p>
    </div>
  )
}

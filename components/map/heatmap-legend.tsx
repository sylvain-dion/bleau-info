'use client'

import { useMapStore } from '@/stores/map-store'

/**
 * Compact floating legend for the activity heatmap layer.
 *
 * Only visible when the heatmap is active. Positioned bottom-left
 * to avoid overlapping map controls (bottom-right).
 */
export function HeatmapLegend() {
  const showHeatmap = useMapStore((s) => s.showHeatmap)

  if (!showHeatmap) return null

  return (
    <div
      className="absolute bottom-6 left-4 z-10 rounded-lg bg-background/90 px-3 py-2 shadow-md backdrop-blur"
      role="img"
      aria-label="Légende : Peu fréquenté (bleu) à Très fréquenté (rouge)"
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Fréquentation
      </p>
      <div
        className="h-2 w-40 rounded-full"
        style={{
          background:
            'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #f97316, #ef4444)',
        }}
      />
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
        <span>Peu fréquenté</span>
        <span>Très fréquenté</span>
      </div>
    </div>
  )
}

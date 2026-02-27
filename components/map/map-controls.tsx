'use client'

import { Locate, Minus, Plus } from 'lucide-react'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onLocate: () => void
}

export function MapControls({ onZoomIn, onZoomOut, onLocate }: MapControlsProps) {
  return (
    <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label="Zoomer"
        title="Zoomer"
      >
        <Plus className="h-5 w-5" />
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label="Dézoomer"
        title="Dézoomer"
      >
        <Minus className="h-5 w-5" />
      </button>
      <button
        onClick={onLocate}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-md transition-colors hover:bg-primary/90"
        aria-label="Me localiser"
        title="Me localiser"
      >
        <Locate className="h-5 w-5" />
      </button>
    </div>
  )
}

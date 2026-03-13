'use client'

import { Locate, Minus, Plus as PlusIcon, PlusCircle } from 'lucide-react'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onLocate: () => void
  /** FAB for boulder creation — only shown when authenticated */
  onAdd?: () => void
}

export function MapControls({ onZoomIn, onZoomOut, onLocate, onAdd }: MapControlsProps) {
  return (
    <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary/90"
          aria-label="Ajouter un bloc"
          title="Ajouter un bloc"
        >
          <PlusCircle className="h-6 w-6" />
        </button>
      )}
      <button
        onClick={onZoomIn}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label="Zoomer"
        title="Zoomer"
      >
        <PlusIcon className="h-5 w-5" />
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

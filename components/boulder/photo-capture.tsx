'use client'

import { useRef } from 'react'
import { Camera, Loader2, X } from 'lucide-react'

interface PhotoCaptureProps {
  /** Data URL of the processed photo, or null if no photo */
  previewUrl: string | null
  /** Whether the photo is currently being processed */
  isProcessing: boolean
  /** Error message to display, if any */
  error: string | null
  /** Called when user selects a file via camera or gallery */
  onFileSelected: (file: File) => void
  /** Called when user removes the current photo */
  onRemove: () => void
}

/**
 * Photo capture UI for boulder creation (Story 5.2).
 *
 * Shows either:
 * - Empty state with camera trigger (dashed border)
 * - Processing spinner
 * - Photo preview with delete button
 */
export function PhotoCapture({
  previewUrl,
  isProcessing,
  error,
  onFileSelected,
  onRemove,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
    }
    // Reset input so re-selecting the same file triggers change
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function handleTriggerClick() {
    inputRef.current?.click()
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">
        Photo <span className="font-normal text-muted-foreground">(optionnel)</span>
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        aria-label="Ajouter une photo"
        data-testid="photo-input"
      />

      {/* Processing state */}
      {isProcessing && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-input bg-muted/30">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Traitement en cours...</span>
          </div>
        </div>
      )}

      {/* Preview state */}
      {!isProcessing && previewUrl && (
        <div className="relative overflow-hidden rounded-lg border border-input">
          <img
            src={previewUrl}
            alt="Aperçu de la photo du bloc"
            className="block max-h-[200px] w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="Supprimer la photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Empty state — trigger */}
      {!isProcessing && !previewUrl && (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/20 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 hover:text-foreground"
        >
          <Camera className="h-5 w-5" />
          <span>Prendre une photo</span>
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

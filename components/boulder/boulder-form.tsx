'use client'

import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, CheckCircle, MapPin, Pencil, X } from 'lucide-react'
import {
  boulderFormSchema,
  BOULDER_EXPOSURES,
  EXPOSURE_LABELS,
  extractSectors,
  type BoulderFormInput,
  type BoulderFormData,
  type BoulderStyleValue,
} from '@/lib/validations/boulder'
import { GRADE_SCALE, formatGrade } from '@/lib/grades'
import { mockBoulders } from '@/lib/data/mock-boulders'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { triggerTickFeedback } from '@/lib/feedback'
import { processPhoto, type ProcessedPhoto } from '@/lib/image-processing'
import { useTheme } from '@/lib/hooks/use-theme'
import { formatLatitude, formatLongitude } from '@/lib/coordinates'
import type { TopoDrawing } from '@/lib/data/mock-topos'
import { BoulderStyleSelector } from './boulder-style-selector'
import { PhotoCapture } from './photo-capture'

/** Lazy-loaded — maplibre-gl is heavy (~200 kB), only load when picker opens */
const LocationPicker = lazy(() =>
  import('./location-picker').then((m) => ({ default: m.LocationPicker }))
)

/** Lazy-loaded — konva is heavy (~80 kB), only load when editor opens */
const TopoTraceEditor = lazy(() =>
  import('../topo/topo-trace-editor').then((m) => ({ default: m.TopoTraceEditor }))
)

/** Default stroke color when no circuit is selected (orange / AD) */
const DEFAULT_STROKE_COLOR = '#FF6B00'

interface BoulderFormProps {
  onClose: () => void
  onSuccess?: () => void
  /** When provided, the form edits an existing draft instead of creating one. */
  editDraftId?: string
}

/**
 * Boulder creation/edit form with Zod + React Hook Form.
 *
 * Required: name, grade, climbing style.
 * Optional: sector, description, height, exposure, stroller access.
 *
 * When `editDraftId` is provided, pre-fills from the existing draft
 * and calls `updateDraft` on submit instead of `addDraft`.
 */
export function BoulderForm({ onClose, onSuccess, editDraftId }: BoulderFormProps) {
  const addDraft = useBoulderDraftStore((s) => s.addDraft)
  const updateDraft = useBoulderDraftStore((s) => s.updateDraft)
  const getDraft = useBoulderDraftStore((s) => s.getDraft)
  const sectors = useMemo(() => extractSectors(mockBoulders.features), [])

  const existingDraft = editDraftId ? getDraft(editDraftId) : undefined
  const isEditMode = !!existingDraft

  const { resolvedTheme } = useTheme()

  // Photo state — data URL lives only in component state, not persisted
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Location state (Story 5.3)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    existingDraft?.latitude != null && existingDraft?.longitude != null
      ? { latitude: existingDraft.latitude, longitude: existingDraft.longitude }
      : null
  )
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Topo trace state (Story 5.4)
  const [topoDrawing, setTopoDrawing] = useState<TopoDrawing | null>(
    existingDraft?.topoDrawing ?? null
  )
  const [showTraceEditor, setShowTraceEditor] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BoulderFormInput, unknown, BoulderFormData>({
    resolver: zodResolver(boulderFormSchema),
    defaultValues: {
      name: existingDraft?.name ?? '',
      grade: existingDraft?.grade ?? '',
      style: existingDraft?.style ?? ('' as BoulderStyleValue),
      sector: existingDraft?.sector ?? '',
      description: existingDraft?.description ?? '',
      height: existingDraft?.height != null ? String(existingDraft.height) : '',
      exposure: existingDraft?.exposure ?? '',
      strollerAccessible: existingDraft?.strollerAccessible ?? false,
    },
  })

  const handleFileSelected = useCallback(async (file: File) => {
    setPhotoError(null)
    setPhotoProcessing(true)
    try {
      const result = await processPhoto(file)
      setPhoto(result)
    } catch {
      setPhotoError('Impossible de traiter l\'image')
    } finally {
      setPhotoProcessing(false)
    }
  }, [])

  const handlePhotoRemove = useCallback(() => {
    setPhoto(null)
    setPhotoError(null)
  }, [])

  function onSubmit(data: BoulderFormData) {
    const draftData = {
      name: data.name,
      grade: data.grade,
      style: data.style,
      sector: data.sector ?? '',
      description: data.description ?? '',
      height: data.height ?? null,
      exposure: data.exposure ?? null,
      strollerAccessible: data.strollerAccessible,
      photoBlurHash: photo?.blurHash ?? null,
      photoWidth: photo?.width ?? null,
      photoHeight: photo?.height ?? null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      topoDrawing: topoDrawing ?? null,
    }

    if (isEditMode && editDraftId) {
      updateDraft(editDraftId, draftData)
    } else {
      addDraft(draftData)
    }

    triggerTickFeedback()
    onSuccess?.()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          {isEditMode ? 'Modifier le brouillon' : 'Nouveau bloc'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Name (required) */}
      <div>
        <label htmlFor="boulder-name" className="mb-1.5 block text-sm font-medium text-foreground">
          Nom <span className="text-destructive">*</span>
        </label>
        <input
          id="boulder-name"
          type="text"
          placeholder="Ex: La Marie-Rose"
          autoComplete="off"
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.name ? 'border-destructive' : 'border-input'
          }`}
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Grade (required) */}
      <div>
        <label htmlFor="boulder-grade" className="mb-1.5 block text-sm font-medium text-foreground">
          Cotation <span className="text-destructive">*</span>
        </label>
        <select
          id="boulder-grade"
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.grade ? 'border-destructive' : 'border-input'
          }`}
          {...register('grade')}
        >
          <option value="">Sélectionner une cotation</option>
          {GRADE_SCALE.map((g) => (
            <option key={g} value={g}>
              {formatGrade(g)}
            </option>
          ))}
        </select>
        {errors.grade && (
          <p className="mt-1 text-xs text-destructive">{errors.grade.message}</p>
        )}
      </div>

      {/* Style (required — chip selector) */}
      <Controller
        name="style"
        control={control}
        render={({ field }) => (
          <BoulderStyleSelector
            value={field.value}
            onChange={(style: BoulderStyleValue) => field.onChange(style)}
            error={errors.style?.message}
          />
        )}
      />

      {/* Sector (optional) */}
      <div>
        <label htmlFor="boulder-sector" className="mb-1.5 block text-sm font-medium text-foreground">
          Secteur <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <select
          id="boulder-sector"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          {...register('sector')}
        >
          <option value="">Sélectionner un secteur</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Description (optional) */}
      <div>
        <label htmlFor="boulder-description" className="mb-1.5 block text-sm font-medium text-foreground">
          Description <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <textarea
          id="boulder-description"
          rows={2}
          placeholder="Type de roche, difficulté spécifique, remarques..."
          className={`w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.description ? 'border-destructive' : 'border-input'
          }`}
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Height (optional) */}
      <div>
        <label htmlFor="boulder-height" className="mb-1.5 block text-sm font-medium text-foreground">
          Hauteur (m) <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <input
          id="boulder-height"
          type="number"
          step="0.5"
          min="0.5"
          max="15"
          placeholder="Ex: 3.5"
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.height ? 'border-destructive' : 'border-input'
          }`}
          {...register('height')}
        />
        {errors.height && (
          <p className="mt-1 text-xs text-destructive">{errors.height.message}</p>
        )}
      </div>

      {/* Exposure (optional) */}
      <div>
        <label htmlFor="boulder-exposure" className="mb-1.5 block text-sm font-medium text-foreground">
          Exposition <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <select
          id="boulder-exposure"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          {...register('exposure')}
        >
          <option value="">Sélectionner une exposition</option>
          {BOULDER_EXPOSURES.map((exp) => (
            <option key={exp} value={exp}>
              {EXPOSURE_LABELS[exp]}
            </option>
          ))}
        </select>
      </div>

      {/* Stroller accessible (optional toggle) */}
      <label className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2.5">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-input text-primary accent-primary"
          {...register('strollerAccessible')}
        />
        <span className="text-sm text-foreground">Accessible poussette</span>
      </label>

      {/* Photo (optional — Story 5.2) */}
      <PhotoCapture
        previewUrl={photo?.dataUrl ?? null}
        isProcessing={photoProcessing}
        error={photoError}
        onFileSelected={handleFileSelected}
        onRemove={handlePhotoRemove}
      />

      {/* Topo trace (optional — Story 5.4) */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">
          Tracé <span className="font-normal text-muted-foreground">(optionnel)</span>
        </p>

        {topoDrawing ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Tracé défini</p>
              <p className="text-xs text-muted-foreground">
                {topoDrawing.elements.filter((e) => e.type === 'path').length} ligne(s)
                {topoDrawing.elements.some((e) => e.type === 'circle') && ' · Départ'}
                {topoDrawing.elements.some((e) => e.type === 'polygon') && ' · Arrivée'}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setShowTraceEditor(true)}
                disabled={!photo}
                className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setTopoDrawing(null)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer le tracé"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowTraceEditor(true)}
            disabled={!photo}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50 disabled:hover:border-input disabled:hover:text-muted-foreground"
          >
            <Pencil className="h-4 w-4" />
            Dessiner le tracé
          </button>
        )}

        {!photo && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ajoutez une photo pour dessiner le tracé
          </p>
        )}
      </div>

      {/* Topo trace editor overlay (lazy-loaded) */}
      {showTraceEditor && photo && (
        <Suspense fallback={null}>
          <TopoTraceEditor
            photoDataUrl={photo.dataUrl}
            photoWidth={photo.width}
            photoHeight={photo.height}
            strokeColor={DEFAULT_STROKE_COLOR}
            onConfirm={(drawing) => {
              setTopoDrawing(drawing)
              setShowTraceEditor(false)
            }}
            onCancel={() => setShowTraceEditor(false)}
          />
        </Suspense>
      )}

      {/* Location (optional — Story 5.3) */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">
          Localisation <span className="font-normal text-muted-foreground">(optionnel)</span>
        </p>

        {location ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Position définie</p>
              <p className="text-xs text-muted-foreground" data-testid="form-coordinates">
                {formatLatitude(location.latitude)}
                <br />
                {formatLongitude(location.longitude)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setLocation(null)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer la localisation"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <MapPin className="h-4 w-4" />
            Localiser le bloc
          </button>
        )}
      </div>

      {/* Location picker overlay (lazy-loaded) */}
      {showLocationPicker && (
        <Suspense fallback={null}>
          <LocationPicker
            theme={resolvedTheme}
            initialPosition={location}
            onConfirm={(coords) => {
              setLocation(coords)
              setShowLocationPicker(false)
            }}
            onCancel={() => setShowLocationPicker(false)}
          />
        </Suspense>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted min-touch"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 min-touch"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSubmitting
            ? (isEditMode ? 'Enregistrement...' : 'Création...')
            : (isEditMode ? 'Enregistrer' : 'Créer le bloc')}
        </button>
      </div>
    </form>
  )
}

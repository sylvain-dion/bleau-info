'use client'

import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, X } from 'lucide-react'
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
import { BoulderStyleSelector } from './boulder-style-selector'

interface BoulderFormProps {
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Boulder creation form with Zod + React Hook Form (Story 5.1).
 *
 * Required: name, grade, climbing style.
 * Optional: sector, description, height, exposure, stroller access.
 */
export function BoulderForm({ onClose, onSuccess }: BoulderFormProps) {
  const addDraft = useBoulderDraftStore((s) => s.addDraft)
  const sectors = useMemo(() => extractSectors(mockBoulders.features), [])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BoulderFormInput, unknown, BoulderFormData>({
    resolver: zodResolver(boulderFormSchema),
    defaultValues: {
      name: '',
      grade: '',
      style: '' as BoulderStyleValue,
      sector: '',
      description: '',
      height: '',
      exposure: '',
      strollerAccessible: false,
    },
  })

  function onSubmit(data: BoulderFormData) {
    addDraft({
      name: data.name,
      grade: data.grade,
      style: data.style,
      sector: data.sector ?? '',
      description: data.description ?? '',
      height: data.height ?? null,
      exposure: data.exposure ?? null,
      strollerAccessible: data.strollerAccessible,
    })

    triggerTickFeedback()
    onSuccess?.()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Nouveau bloc</h3>
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
          {isSubmitting ? 'Création...' : 'Créer le bloc'}
        </button>
      </div>
    </form>
  )
}

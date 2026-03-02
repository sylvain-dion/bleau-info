'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, X } from 'lucide-react'
import { tickFormSchema, todayISO, type TickFormData, type TickStyle } from '@/lib/validations/tick'
import { useTickStore } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import { triggerTickFeedback } from '@/lib/feedback'
import { TickStyleSelector } from './tick-style-selector'

interface TickFormProps {
  boulderId: string
  boulderName: string
  boulderGrade: string
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Inline form for logging an ascension (tick) on a boulder.
 *
 * Fields: style (visual selector), date, personal note.
 * On submit: saves to tick store, triggers confetti + haptic.
 */
export function TickForm({ boulderId, boulderName, boulderGrade, onClose, onSuccess }: TickFormProps) {
  const { user } = useAuthStore()
  const addTick = useTickStore((s) => s.addTick)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TickFormData>({
    resolver: zodResolver(tickFormSchema),
    defaultValues: {
      tickStyle: '' as TickStyle,
      tickDate: todayISO(),
      personalNote: '',
    },
  })

  function onSubmit(data: TickFormData) {
    addTick({
      userId: user?.id ?? 'anonymous',
      boulderId,
      boulderName,
      boulderGrade,
      tickStyle: data.tickStyle,
      tickDate: data.tickDate,
      personalNote: data.personalNote ?? '',
    })

    triggerTickFeedback()
    onSuccess?.()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Logger une croix</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Style selector */}
      <Controller
        name="tickStyle"
        control={control}
        render={({ field }) => (
          <TickStyleSelector
            value={field.value}
            onChange={(style: TickStyle) => field.onChange(style)}
            error={errors.tickStyle?.message}
          />
        )}
      />

      {/* Date */}
      <div>
        <label htmlFor="tickDate" className="mb-1.5 block text-sm font-medium text-foreground">
          Date
        </label>
        <input
          id="tickDate"
          type="date"
          max={todayISO()}
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.tickDate ? 'border-destructive' : 'border-input'
          }`}
          {...register('tickDate')}
        />
        {errors.tickDate && (
          <p className="mt-1 text-xs text-destructive">{errors.tickDate.message}</p>
        )}
      </div>

      {/* Personal note */}
      <div>
        <label htmlFor="personalNote" className="mb-1.5 block text-sm font-medium text-foreground">
          Note personnelle <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <textarea
          id="personalNote"
          rows={2}
          placeholder="Conditions, méthode, ressenti..."
          className={`w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.personalNote ? 'border-destructive' : 'border-input'
          }`}
          {...register('personalNote')}
        />
        {errors.personalNote && (
          <p className="mt-1 text-xs text-destructive">{errors.personalNote.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
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
          {isSubmitting ? 'Enregistrement...' : 'Valider'}
        </button>
      </div>
    </form>
  )
}

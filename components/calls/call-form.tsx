'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Clock, MapPin, Sparkles, Send, X } from 'lucide-react'
import {
  climbingCallFormSchema,
  todayISO,
  type ClimbingCallFormInput,
  type ClimbingCallFormData,
} from '@/lib/validations/climbing-call'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { useAuthStore } from '@/stores/auth-store'
import { getAllSectorSlugs } from '@/lib/data/boulder-service'

interface CallFormProps {
  /** Pre-fill the sector when the form is opened from a sector page. */
  defaultSectorSlug?: string
  defaultSectorName?: string
  onClose: () => void
  onSuccess?: (callId: string) => void
}

/**
 * Story 15.3 — form to publish a "Grimpons ensemble" broadcast.
 *
 * Validates with Zod (date in the future, optional time as HH:MM,
 * 300-char message). On submit, persists to the climbing-call store
 * and calls onSuccess with the new call id.
 */
export function CallForm({
  defaultSectorSlug,
  defaultSectorName,
  onClose,
  onSuccess,
}: CallFormProps) {
  const { user } = useAuthStore()
  const createCall = useClimbingCallStore((s) => s.createCall)

  const sectors = useMemo(
    () =>
      getAllSectorSlugs()
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClimbingCallFormInput>({
    resolver: zodResolver(climbingCallFormSchema),
    defaultValues: {
      sectorSlug: defaultSectorSlug ?? '',
      sectorName: defaultSectorName ?? '',
      plannedDate: todayISO(),
      startTime: '',
      targetGrade: '',
      message: '',
    },
  })

  const message = watch('message') ?? ''

  function onSubmit(input: ClimbingCallFormInput) {
    // Re-parse to apply the schema transforms (default message, '' → undefined).
    const parsed = climbingCallFormSchema.safeParse(input)
    if (!parsed.success) return
    const data: ClimbingCallFormData = parsed.data
    const id = createCall({
      hostUserId: user?.id ?? 'anonymous',
      hostName:
        user?.user_metadata?.display_name ?? user?.email ?? 'Anonyme',
      sectorSlug: data.sectorSlug,
      sectorName: data.sectorName,
      plannedDate: data.plannedDate,
      startTime: data.startTime,
      targetGrade: data.targetGrade,
      message: data.message,
    })
    onSuccess?.(id)
    onClose()
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Connectez-vous pour lancer un appel
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Lancer un appel à grimper
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sector */}
      <div>
        <label
          htmlFor="sector"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          <MapPin className="h-3.5 w-3.5" />
          Secteur
        </label>
        <select
          id="sector"
          defaultValue={defaultSectorSlug ?? ''}
          onChange={(e) => {
            const slug = e.target.value
            const match = sectors.find((s) => s.slug === slug)
            setValue('sectorSlug', slug, { shouldValidate: true })
            setValue('sectorName', match?.name ?? '', {
              shouldValidate: true,
            })
          }}
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.sectorSlug ? 'border-destructive' : 'border-input'
          }`}
        >
          <option value="">Choisis un secteur…</option>
          {sectors.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.sectorSlug && (
          <p className="mt-1 text-xs text-destructive">
            {errors.sectorSlug.message}
          </p>
        )}
      </div>

      {/* Date + start time on the same row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="plannedDate"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Date
          </label>
          <input
            id="plannedDate"
            type="date"
            min={todayISO()}
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.plannedDate ? 'border-destructive' : 'border-input'
            }`}
            {...register('plannedDate')}
          />
          {errors.plannedDate && (
            <p className="mt-1 text-xs text-destructive">
              {errors.plannedDate.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="startTime"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <Clock className="h-3.5 w-3.5" />
            Heure{' '}
            <span className="font-normal text-muted-foreground">
              (optionnel)
            </span>
          </label>
          <input
            id="startTime"
            type="time"
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.startTime ? 'border-destructive' : 'border-input'
            }`}
            {...register('startTime')}
          />
          {errors.startTime && (
            <p className="mt-1 text-xs text-destructive">
              {errors.startTime.message}
            </p>
          )}
        </div>
      </div>

      {/* Target grade */}
      <div>
        <label
          htmlFor="targetGrade"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Niveau visé{' '}
          <span className="font-normal text-muted-foreground">
            (optionnel)
          </span>
        </label>
        <input
          id="targetGrade"
          type="text"
          maxLength={20}
          placeholder='ex. "6a — 7a", "tout niveau"'
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.targetGrade ? 'border-destructive' : 'border-input'
          }`}
          {...register('targetGrade')}
        />
        {errors.targetGrade && (
          <p className="mt-1 text-xs text-destructive">
            {errors.targetGrade.message}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Message{' '}
          <span className="font-normal text-muted-foreground">
            (optionnel)
          </span>
        </label>
        <textarea
          id="message"
          rows={3}
          maxLength={300}
          placeholder="Quelques mots sur ta sortie : conditions, point de RDV, ambiance…"
          className={`w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.message ? 'border-destructive' : 'border-input'
          }`}
          {...register('message')}
        />
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
          {errors.message ? (
            <span className="text-destructive">{errors.message.message}</span>
          ) : (
            <span />
          )}
          <span>{message.length}/300</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
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
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Publication…' : "Lancer l'appel"}
        </button>
      </div>
    </form>
  )
}

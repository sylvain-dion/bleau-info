'use client'

import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link2, EyeOff } from 'lucide-react'
import { videoSubmissionSchema } from '@/lib/validations/video-submission'
import type { VideoSubmissionFormInput } from '@/lib/validations/video-submission'
import { parseVideoUrl } from '@/lib/video'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import { useAuthStore } from '@/stores/auth-store'
import { showVideoSubmittedToast } from '@/lib/feedback'
import { VideoEmbed } from './video-embed'
import { Combobox } from '@/components/ui/combobox'

interface VideoSubmissionFormProps {
  boulderId: string
  onClose: () => void
  onSuccess?: () => void
  /** When provided, the form edits an existing submission. */
  editSubmissionId?: string
}

/**
 * Form for submitting or editing a video for a boulder.
 *
 * - URL input with live preview
 * - Climber name combobox with autocomplete from existing submissions
 * - Videographer name combobox with autocomplete
 */
export function VideoSubmissionForm({
  boulderId,
  onClose,
  onSuccess,
  editSubmissionId,
}: VideoSubmissionFormProps) {
  const { user } = useAuthStore()
  const addSubmission = useVideoSubmissionStore((s) => s.addSubmission)
  const updateSubmission = useVideoSubmissionStore((s) => s.updateSubmission)
  const allSubmissions = useVideoSubmissionStore((s) => s.submissions)

  const climberNames = useMemo(() => {
    const names = new Set<string>()
    for (const s of allSubmissions) {
      if (s.climberName) names.add(s.climberName)
    }
    return Array.from(names).sort()
  }, [allSubmissions])

  const videographerNames = useMemo(() => {
    const names = new Set<string>()
    for (const s of allSubmissions) {
      if (s.videographerName) names.add(s.videographerName)
    }
    return Array.from(names).sort()
  }, [allSubmissions])

  const existingSubmission = editSubmissionId
    ? allSubmissions.find((s) => s.id === editSubmissionId)
    : undefined

  const isEditMode = !!existingSubmission

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VideoSubmissionFormInput>({
    resolver: zodResolver(videoSubmissionSchema),
    defaultValues: {
      videoUrl: existingSubmission?.videoUrl ?? '',
      climberName: existingSubmission?.climberName ?? '',
      videographerName: existingSubmission?.videographerName ?? '',
      containsBeta: existingSubmission?.containsBeta ?? false,
    },
  })

  const videoUrl = watch('videoUrl')
  const isValidUrl = videoUrl ? parseVideoUrl(videoUrl) !== null : false

  function onSubmit(data: VideoSubmissionFormInput) {
    if (isEditMode && editSubmissionId) {
      updateSubmission(editSubmissionId, {
        videoUrl: data.videoUrl,
        climberName: data.climberName || null,
        videographerName: data.videographerName || null,
        containsBeta: !!data.containsBeta,
      })
    } else {
      addSubmission({
        boulderId,
        videoUrl: data.videoUrl,
        climberName: data.climberName || null,
        videographerName: data.videographerName || null,
        containsBeta: !!data.containsBeta,
        userId: user?.id ?? 'anonymous',
      })
      showVideoSubmittedToast()
    }
    onSuccess?.()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">
        {isEditMode ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
      </h3>

      {/* Video URL */}
      <div>
        <label
          htmlFor="videoUrl"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          <Link2 className="h-3.5 w-3.5" />
          URL de la vidéo
        </label>
        <input
          id="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.videoUrl ? 'border-destructive' : 'border-input'
          }`}
          {...register('videoUrl')}
        />
        {errors.videoUrl && (
          <p className="mt-1 text-xs text-destructive">
            {errors.videoUrl.message}
          </p>
        )}
      </div>

      {/* Live preview */}
      {isValidUrl && (
        <div className="rounded-lg border border-border p-2">
          <VideoEmbed videoUrl={videoUrl} />
        </div>
      )}

      {/* Climber name */}
      <Controller
        name="climberName"
        control={control}
        render={({ field }) => (
          <Combobox
            id="climberName"
            label="Grimpeur (optionnel)"
            value={field.value ?? ''}
            onChange={field.onChange}
            suggestions={climberNames}
            placeholder="Nom du grimpeur en vidéo"
            error={errors.climberName?.message}
          />
        )}
      />

      {/* Videographer name */}
      <Controller
        name="videographerName"
        control={control}
        render={({ field }) => (
          <Combobox
            id="videographerName"
            label="Réalisateur (optionnel)"
            value={field.value ?? ''}
            onChange={field.onChange}
            suggestions={videographerNames}
            placeholder="Nom du réalisateur / chaîne"
            error={errors.videographerName?.message}
          />
        )}
      />

      {/* Contains beta — Story 15.1 */}
      <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm select-none">
        <input
          type="checkbox"
          {...register('containsBeta')}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
          data-testid="video-form-beta-checkbox"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-foreground">
            <EyeOff className="h-3.5 w-3.5" />
            <span className="font-medium">
              Cette vidéo contient de la bêta
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Les autres grimpeurs verront un voile à la place de la vidéo
            jusqu&apos;à ce qu&apos;ils choisissent de l&apos;afficher.
          </p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
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
          {isEditMode ? 'Enregistrer' : 'Soumettre'}
        </button>
      </div>

      {!isEditMode && (
        <p className="text-center text-[11px] text-muted-foreground">
          La vidéo sera visible après validation par la communauté.
        </p>
      )}
    </form>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pin, X } from 'lucide-react'
import {
  annotationFormSchema,
  type AnnotationFormData,
  type Annotation,
} from '@/lib/validations/annotation'
import { todayISO } from '@/lib/validations/tick'

interface AnnotationFormProps {
  onSubmit: (data: AnnotationFormData) => void
  onClose: () => void
  editingAnnotation?: Annotation
}

export function AnnotationForm({
  onSubmit,
  onClose,
  editingAnnotation,
}: AnnotationFormProps) {
  const isEditing = !!editingAnnotation

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<AnnotationFormData>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      date: editingAnnotation?.date ?? todayISO(),
      text: editingAnnotation?.text ?? '',
    },
    mode: 'onChange',
  })

  const textValue = watch('text') ?? ''

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-lg border border-border bg-muted/50 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {isEditing ? 'Modifier l\u2019annotation' : 'Nouvelle annotation'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label htmlFor="annotation-date" className="sr-only">
          Date
        </label>
        <input
          id="annotation-date"
          type="date"
          {...register('date')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="annotation-text" className="sr-only">
          Texte
        </label>
        <input
          id="annotation-text"
          type="text"
          maxLength={100}
          placeholder="Ex: Blessure \u00e9paule, Stage Bleau\u2026"
          {...register('text')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-invalid={!!errors.text}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.text ? (
            <p className="text-xs text-red-500">{errors.text.message}</p>
          ) : (
            <span />
          )}
          <span
            className="text-xs text-muted-foreground"
            aria-live="polite"
          >
            {textValue.length}/100
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <Pin className="h-3.5 w-3.5" />
          {isEditing ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

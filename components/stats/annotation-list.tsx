'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Annotation } from '@/lib/validations/annotation'

/** Format YYYY-MM-DD to French short date: "15 mars 2026" */
function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface AnnotationListProps {
  annotations: Annotation[]
  onEdit: (annotation: Annotation) => void
  onDelete: (annotationId: string) => void
}

export function AnnotationList({
  annotations,
  onEdit,
  onDelete,
}: AnnotationListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (annotations.length === 0) return null

  const sorted = [...annotations].sort(
    (a, b) => a.date.localeCompare(b.date)
  )

  function handleDelete(id: string) {
    if (confirmingId === id) {
      onDelete(id)
      setConfirmingId(null)
    } else {
      setConfirmingId(id)
    }
  }

  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">
        Annotations ({annotations.length})
      </p>
      <ul className="space-y-1" role="list">
        {sorted.map((annotation) => (
          <li
            key={annotation.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateFr(annotation.date)}
            </span>
            <span className="min-w-0 flex-1 truncate text-foreground">
              {annotation.text}
            </span>
            <button
              type="button"
              onClick={() => onEdit(annotation)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Modifier "${annotation.text}"`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(annotation.id)}
              className={`shrink-0 rounded-md p-1 ${
                confirmingId === annotation.id
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label={
                confirmingId === annotation.id
                  ? `Confirmer la suppression de "${annotation.text}"`
                  : `Supprimer "${annotation.text}"`
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

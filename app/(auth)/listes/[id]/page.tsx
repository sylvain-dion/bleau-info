'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, X as XIcon, ListChecks } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useListStore } from '@/stores/list-store'
import { formatGrade } from '@/lib/grades'

interface ListDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = use(params)
  const { user, isLoading } = useAuthStore()
  const getList = useListStore((s) => s.getList)
  const removeBoulderFromList = useListStore((s) => s.removeBoulderFromList)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) return null

  const list = getList(id)

  if (!list) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/listes"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux listes
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <ListChecks className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            Liste introuvable
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cette liste n&apos;existe pas ou a été supprimée
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Back link */}
      <Link
        href="/listes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux listes
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">{list.emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-foreground">{list.name}</h1>
          <p className="text-sm text-muted-foreground">
            {list.items.length === 0
              ? 'Aucun bloc'
              : `${list.items.length} bloc${list.items.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Boulder items */}
      {list.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <ListChecks className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            Cette liste est vide
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajoutez des blocs depuis la carte en utilisant l&apos;icône signet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.items.map((item) => (
            <div
              key={item.boulderId}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              {/* Grade badge */}
              <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1">
                <span className="text-base font-bold text-primary">
                  {formatGrade(item.boulderGrade)}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.boulderName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajouté le{' '}
                  {new Date(item.addedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeBoulderFromList(list.id, item.boulderId)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Retirer ${item.boulderName} de la liste`}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

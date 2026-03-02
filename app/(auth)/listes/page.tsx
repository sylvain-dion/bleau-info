'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  ListChecks,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useListStore } from '@/stores/list-store'
import { formatGrade } from '@/lib/grades'
import {
  LIST_EMOJI_PRESETS,
  DEFAULT_LIST_EMOJI,
} from '@/lib/validations/list'
import type { BoulderList } from '@/lib/validations/list'

export default function ListesPage() {
  const { user, isLoading } = useAuthStore()
  const lists = useListStore((s) => s.lists)
  const [showCreateForm, setShowCreateForm] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Mes Listes</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-touch"
        >
          <Plus className="h-4 w-4" />
          Créer
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-4">
          <CreateListForm
            onCreated={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 && !showCreateForm ? (
        <EmptyState onCreateClick={() => setShowCreateForm(true)} />
      ) : (
        <div className="space-y-3">
          {lists.map((list, index) => (
            <ListCard
              key={list.id}
              list={list}
              isFirst={index === 0}
              isLast={index === lists.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Empty state when no lists exist */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <ListChecks className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">Aucune liste</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Créez des listes pour organiser vos projets et favoris
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-touch"
      >
        <Plus className="h-4 w-4" />
        Créer une liste
      </button>
    </div>
  )
}

/** Single list card with actions */
function ListCard({
  list,
  isFirst,
  isLast,
}: {
  list: BoulderList
  isFirst: boolean
  isLast: boolean
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const moveList = useListStore((s) => s.moveList)
  const deleteList = useListStore((s) => s.deleteList)

  const previewText =
    list.items.length > 0
      ? list.items
          .slice(0, 3)
          .map((item) => `${item.boulderName} (${formatGrade(item.boulderGrade)})`)
          .join(', ')
      : 'Liste vide'

  function handleDelete() {
    deleteList(list.id)
    setShowMenu(false)
  }

  if (isEditing) {
    return (
      <RenameListForm
        list={list}
        onDone={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Link
        href={`/listes/${list.id}`}
        className="block p-4 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{list.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {list.name}
              </h2>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {list.items.length}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {previewText}
            </p>
          </div>
        </div>
      </Link>

      {/* Action bar */}
      <div className="flex items-center justify-between border-t border-border px-2 py-1">
        {/* Reorder */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => moveList(list.id, 'up')}
            disabled={isFirst}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            aria-label="Monter"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => moveList(list.id, 'down')}
            disabled={isLast}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            aria-label="Descendre"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Actions"
            aria-expanded={showMenu}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <ListCardMenu
              onRename={() => {
                setIsEditing(true)
                setShowMenu(false)
              }}
              onDelete={handleDelete}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Kebab menu for list card actions */
function ListCardMenu({
  onRename,
  onDelete,
  onClose,
}: {
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <>
      {/* Invisible overlay to close on click outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        role="menu"
        className="absolute bottom-full right-0 z-50 mb-1 w-40 rounded-lg border border-border bg-popover p-1 shadow-lg"
      >
        <button
          type="button"
          role="menuitem"
          onClick={onRename}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" />
          Renommer
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={onDelete}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer
        </button>
      </div>
    </>
  )
}

/** Inline form to create a new list */
function CreateListForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_LIST_EMOJI)
  const [error, setError] = useState<string | null>(null)
  const createList = useListStore((s) => s.createList)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Le nom est requis')
      return
    }
    if (trimmed.length > 50) {
      setError('50 caractères maximum')
      return
    }
    createList(trimmed, emoji)
    onCreated()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Nouvelle liste</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Annuler"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Emoji picker */}
      <div className="mb-3 flex gap-1.5">
        {LIST_EMOJI_PRESETS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${
              emoji === e
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'bg-muted hover:bg-muted/80'
            }`}
            aria-label={`Emoji ${e}`}
            aria-pressed={emoji === e}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Name input */}
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        placeholder="Nom de la liste"
        className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        maxLength={50}
        autoFocus
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Créer
        </button>
      </div>
    </form>
  )
}

/** Inline form to rename a list */
function RenameListForm({
  list,
  onDone,
}: {
  list: BoulderList
  onDone: () => void
}) {
  const [name, setName] = useState(list.name)
  const [emoji, setEmoji] = useState(list.emoji)
  const [error, setError] = useState<string | null>(null)
  const renameList = useListStore((s) => s.renameList)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Le nom est requis')
      return
    }
    if (trimmed.length > 50) {
      setError('50 caractères maximum')
      return
    }
    renameList(list.id, trimmed, emoji)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-4"
    >
      <p className="mb-3 text-sm font-semibold text-foreground">Renommer</p>

      {/* Emoji picker */}
      <div className="mb-3 flex gap-1.5">
        {LIST_EMOJI_PRESETS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${
              emoji === e
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'bg-muted hover:bg-muted/80'
            }`}
            aria-label={`Emoji ${e}`}
            aria-pressed={emoji === e}
          >
            {e}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        placeholder="Nom de la liste"
        className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        maxLength={50}
        autoFocus
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Enregistrer
        </button>
      </div>
    </form>
  )
}

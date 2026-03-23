'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { useListStore } from '@/stores/list-store'
import {
  LIST_EMOJI_PRESETS,
  DEFAULT_LIST_EMOJI,
} from '@/lib/validations/list'

interface AddToListMenuProps {
  boulderId: string
  boulderName: string
  boulderGrade: string
  isOpen: boolean
  onClose: () => void
  /** Render as inline content (no absolute positioning, for use inside drawers) */
  inline?: boolean
}

/**
 * Popover menu to add/remove a boulder from user lists.
 * Shows existing lists with toggle checkboxes + inline create form.
 */
export function AddToListMenu({
  boulderId,
  boulderName,
  boulderGrade,
  isOpen,
  onClose,
  inline,
}: AddToListMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const lists = useListStore((s) => s.lists)
  const addBoulderToList = useListStore((s) => s.addBoulderToList)
  const removeBoulderFromList = useListStore((s) => s.removeBoulderFromList)
  const getListsForBoulder = useListStore((s) => s.getListsForBoulder)

  const boulderListIds = getListsForBoulder(boulderId)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleToggle(listId: string) {
    const isInList = boulderListIds.includes(listId)
    if (isInList) {
      removeBoulderFromList(listId, boulderId)
    } else {
      addBoulderToList(listId, {
        id: boulderId,
        name: boulderName,
        grade: boulderGrade,
      })
    }
  }

  function handleListCreated() {
    setShowCreateForm(false)
  }

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-label="Ajouter à une liste"
      className={inline
        ? 'w-full p-1'
        : 'absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-1 shadow-xl'
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-semibold text-foreground">Mes listes</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* List items */}
      <div className="max-h-48 overflow-y-auto py-1">
        {lists.length === 0 && !showCreateForm && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Aucune liste créée
          </p>
        )}

        {lists.map((list) => {
          const isInList = boulderListIds.includes(list.id)
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => handleToggle(list.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  isInList
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background'
                }`}
              >
                {isInList && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="shrink-0">{list.emoji}</span>
              <span className="truncate text-foreground">{list.name}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {list.items.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Create new list */}
      {showCreateForm ? (
        <InlineCreateForm
          boulderId={boulderId}
          boulderName={boulderName}
          boulderGrade={boulderGrade}
          onCreated={handleListCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary transition-colors hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          Créer une nouvelle liste
        </button>
      )}
    </div>
  )
}

/** Inline form to create a new list and optionally add the boulder to it */
function InlineCreateForm({
  boulderId,
  boulderName,
  boulderGrade,
  onCreated,
  onCancel,
}: {
  boulderId: string
  boulderName: string
  boulderGrade: string
  onCreated: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_LIST_EMOJI)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const createList = useListStore((s) => s.createList)
  const addBoulderToList = useListStore((s) => s.addBoulderToList)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

    const listId = createList(trimmed, emoji)
    addBoulderToList(listId, {
      id: boulderId,
      name: boulderName,
      grade: boulderGrade,
    })
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit} className="p-2">
      {/* Emoji picker row */}
      <div className="mb-2 flex gap-1">
        {LIST_EMOJI_PRESETS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors ${
              emoji === e
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'hover:bg-muted'
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
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        placeholder="Nom de la liste"
        className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        maxLength={50}
      />

      {error && (
        <p className="mb-2 text-xs text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Créer
        </button>
      </div>
    </form>
  )
}

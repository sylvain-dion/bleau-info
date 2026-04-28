'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Target } from 'lucide-react'
import {
  GOAL_TYPES,
  GOAL_GRADE_OPTIONS,
  validateGoalTarget,
  getGoalTypeMeta,
  type GoalType,
} from '@/lib/goals'
import { formatGrade } from '@/lib/grades'

interface AddGoalDialogProps {
  /** Called with the new goal data when the user submits. */
  onAdd: (params: {
    type: GoalType
    target: number | string
    deadline: string | null
  }) => void
}

/**
 * Modal dialog to create a new personal goal.
 *
 * - Type select drives the input shape (number vs grade ladder).
 * - Optional deadline.
 * - Inline validation via `validateGoalTarget` before submission.
 */
export function AddGoalDialog({ onAdd }: AddGoalDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<GoalType>('tickCount')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset form when the dialog opens.
  useEffect(() => {
    if (!isOpen) return
    setType('tickCount')
    setTarget('')
    setDeadline('')
    setError(null)
  }, [isOpen])

  function handleSubmit() {
    const validation = validateGoalTarget(type, target)
    if (validation) {
      setError(validation)
      return
    }
    const meta = getGoalTypeMeta(type)
    const value: number | string =
      meta.shape === 'grade' ? target : Number(target)
    onAdd({
      type,
      target: value,
      deadline: deadline || null,
    })
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted min-touch"
      >
        <Plus className="h-4 w-4" />
        Ajouter un objectif
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-goal-title"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h2
                  id="add-goal-title"
                  className="text-lg font-bold text-foreground"
                >
                  Nouvel objectif
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Type select */}
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Type
              </span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as GoalType)
                  setTarget('')
                  setError(null)
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {GOAL_TYPES.map((g) => (
                  <option key={g.type} value={g.type}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Target — numeric or grade dropdown */}
            <label className="mb-3 block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Cible
              </span>
              {getGoalTypeMeta(type).shape === 'grade' ? (
                <select
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value)
                    setError(null)
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    error ? 'border-destructive' : 'border-input'
                  }`}
                >
                  <option value="">Choisir un niveau…</option>
                  {GOAL_GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {formatGrade(g)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value)
                    setError(null)
                  }}
                  placeholder={`p. ex. ${suggestPlaceholder(type)}`}
                  className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    error ? 'border-destructive' : 'border-input'
                  }`}
                />
              )}
              {error && (
                <p className="mt-1 text-xs text-destructive">{error}</p>
              )}
            </label>

            {/* Deadline (optional) */}
            <label className="mb-5 block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Échéance <span className="font-normal text-muted-foreground">(facultatif)</span>
              </span>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function suggestPlaceholder(type: GoalType): string {
  switch (type) {
    case 'tickCount':
      return '50'
    case 'uniqueBoulders':
      return '25'
    case 'sectorsVisited':
      return '6'
    case 'circuitsCompleted':
      return '3'
    case 'longestStreak':
      return '7'
    case 'maxGrade':
      return '6a'
  }
}

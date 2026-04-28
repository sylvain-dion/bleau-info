'use client'

import { Star, Award, Map, Route, Flame, Mountain, X, Check } from 'lucide-react'
import {
  computeGoalProgress,
  getGoalTypeMeta,
  type Goal,
  type GoalProgress,
} from '@/lib/goals'
import type { BadgeInput } from '@/lib/badges'

const ICONS = {
  Star,
  Award,
  Map,
  Route,
  Flame,
  Mountain,
} as const

interface GoalCardProps {
  goal: Goal
  input: BadgeInput
  onRemove: (id: string) => void
}

/**
 * One goal tile: icon + label + progress bar + target / deadline meta + delete.
 * Achieved goals get a check badge; expired goals show a muted state.
 */
export function GoalCard({ goal, input, onRemove }: GoalCardProps) {
  const progress = computeGoalProgress(goal, input)
  return <GoalCardView progress={progress} onRemove={onRemove} />
}

interface GoalCardViewProps {
  progress: GoalProgress
  onRemove: (id: string) => void
}

/** View-only variant — exported for unit tests with deterministic input. */
export function GoalCardView({ progress, onRemove }: GoalCardViewProps) {
  const { goal, currentDisplay, targetDisplay, status, daysRemaining } = progress
  const meta = getGoalTypeMeta(goal.type)
  const Icon = ICONS[meta.icon] ?? Star

  const pct = Math.round(progress.progress * 100)
  const isAchieved = status === 'achieved'
  const isExpired = status === 'expired'

  return (
    <div
      className={`relative rounded-xl border p-4 transition-colors ${
        isAchieved
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : isExpired
            ? 'border-border bg-muted/40'
            : 'border-border bg-card'
      }`}
      data-status={status}
      data-testid={`goal-card-${goal.id}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isAchieved ? 'bg-emerald-500/10' : 'bg-muted'
          }`}
        >
          {isAchieved ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Icon className={`h-4 w-4 ${meta.color}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {meta.label}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className={isAchieved ? '' : 'font-medium text-foreground'}>
              {currentDisplay}
            </span>
            {' / '}
            <span>
              {targetDisplay}
              {meta.unit ? ` ${meta.unit}` : ''}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(goal.id)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          aria-label={`Supprimer l'objectif ${meta.label}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression : ${pct}%`}
      >
        <div
          className={`h-full transition-all ${
            isAchieved
              ? 'bg-emerald-500'
              : isExpired
                ? 'bg-muted-foreground/40'
                : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer meta */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{pct}%</span>
        <span>{describeDeadline(status, daysRemaining)}</span>
      </div>
    </div>
  )
}

function describeDeadline(
  status: GoalProgress['status'],
  daysRemaining: number | null,
): string {
  if (status === 'achieved') return 'Atteint'
  if (daysRemaining === null) return 'Sans échéance'
  if (daysRemaining < 0) return `Échue depuis ${-daysRemaining} j`
  if (daysRemaining === 0) return 'Dernier jour'
  if (daysRemaining === 1) return 'Plus qu\u2019un jour'
  return `${daysRemaining} jours restants`
}

'use client'

import { useEffect, useMemo } from 'react'
import { Target } from 'lucide-react'
import { useGoalsStore } from '@/stores/goals-store'
import { computeGoalProgress, suggestGoals, getGoalTypeMeta } from '@/lib/goals'
import type { BadgeInput } from '@/lib/badges'
import { GoalCard } from '@/components/profile/goal-card'
import { AddGoalDialog } from '@/components/profile/add-goal-dialog'
import { formatGrade } from '@/lib/grades'

interface GoalsSectionProps {
  /** Snapshot of stats used to compute live progress for each goal. */
  input: BadgeInput
}

/**
 * Personal goals dashboard (Story 14.3).
 *
 * Lists active goals with live progress, lets the user remove goals
 * and add new ones, and surfaces 3-5 suggestions tailored to the
 * current stats. Achieved goals get auto-stamped via the store's
 * `reconcileAchievements` whenever the input shape changes.
 */
export function GoalsSection({ input }: GoalsSectionProps) {
  const goals = useGoalsStore((s) => s.goals)
  const addGoal = useGoalsStore((s) => s.addGoal)
  const removeGoal = useGoalsStore((s) => s.removeGoal)
  const reconcile = useGoalsStore((s) => s.reconcileAchievements)

  // Auto-mark achievements whenever the underlying input changes.
  useEffect(() => {
    reconcile(input)
    // We intentionally serialise input to a stable signature. The numeric
    // fields + max grade fully describe the relevant state for goals.
  }, [
    reconcile,
    input.tickCount,
    input.uniqueBoulders,
    input.maxGrade,
    input.sectorsVisited,
    input.circuitsCompleted,
    input.longestStreak,
  ])

  // Sort: active first (by progress desc), then achieved, then expired.
  const sortedGoals = useMemo(() => {
    const decorated = goals.map((g) => ({
      goal: g,
      progress: computeGoalProgress(g, input),
    }))
    const order = { active: 0, achieved: 1, expired: 2 } as const
    decorated.sort((a, b) => {
      const sa = order[a.progress.status]
      const sb = order[b.progress.status]
      if (sa !== sb) return sa - sb
      if (a.progress.status === 'active') {
        return b.progress.progress - a.progress.progress
      }
      return 0
    })
    return decorated.map((d) => d.goal)
  }, [goals, input])

  // Hide suggestions that match an existing active goal type.
  const existingActiveTypes = new Set(
    goals
      .filter((g) => !g.achievedAt)
      .map((g) => g.type),
  )
  const suggestions = suggestGoals(input).filter(
    (s) => !existingActiveTypes.has(s.type),
  )

  const achievedCount = goals.filter((g) => g.achievedAt).length

  return (
    <section aria-label="Objectifs personnels" className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Target className="h-4 w-4 text-muted-foreground" />
        Objectifs
        {goals.length > 0 && (
          <span className="text-[10px] font-normal text-muted-foreground">
            {achievedCount} / {goals.length}
          </span>
        )}
      </h2>

      {goals.length === 0 ? (
        <div className="mb-3 rounded-xl border border-dashed border-border bg-card p-4 text-center">
          <Target className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            Fixez-vous une cible pour rester motivé. Aucun engagement, juste pour vous.
          </p>
        </div>
      ) : (
        <div className="mb-3 space-y-2">
          {sortedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              input={input}
              onRemove={removeGoal}
            />
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggérés pour vous
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const meta = getGoalTypeMeta(s.type)
              const targetLabel =
                meta.shape === 'grade'
                  ? formatGrade(String(s.target))
                  : `${s.target}${meta.unit ? ` ${meta.unit}` : ''}`
              return (
                <button
                  key={`${s.type}-${s.target}`}
                  type="button"
                  onClick={() =>
                    addGoal({ type: s.type, target: s.target, deadline: null })
                  }
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  aria-label={`Ajouter l'objectif ${meta.label} ${targetLabel}`}
                >
                  <span>{meta.label}</span>
                  <span className="text-muted-foreground">→ {targetLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <AddGoalDialog onAdd={addGoal} />
    </section>
  )
}

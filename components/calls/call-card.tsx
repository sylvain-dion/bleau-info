'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  Trash2,
  Check,
  HelpCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import type { ClimbingCall } from '@/lib/validations/climbing-call'

interface CallCardProps {
  call: ClimbingCall
  /**
   * When true, hides the sector name + link (used in the per-sector
   * widget where the sector header is already visible above).
   */
  hideSector?: boolean
}

/**
 * Story 15.3 — single broadcast card.
 *
 * Renders the host, planned date, sector and message, plus
 * "Je viens / Peut-être" toggle buttons and a count of confirmed
 * climbers. The host sees a delete affordance instead of RSVP.
 */
export function CallCard({ call, hideSector = false }: CallCardProps) {
  const { user } = useAuthStore()
  const responses = useClimbingCallStore((s) => s.responses)
  const respond = useClimbingCallStore((s) => s.respond)
  const withdrawResponse = useClimbingCallStore((s) => s.withdrawResponse)
  const deleteCall = useClimbingCallStore((s) => s.deleteCall)

  const callResponses = useMemo(
    () => responses.filter((r) => r.callId === call.id),
    [responses, call.id],
  )

  const goingCount = callResponses.filter((r) => r.status === 'going').length
  const maybeCount = callResponses.filter((r) => r.status === 'maybe').length
  const isHost = user?.id === call.hostUserId

  const myResponse = useMemo(
    () => callResponses.find((r) => r.userId === user?.id),
    [callResponses, user?.id],
  )

  function handleRespond(status: 'going' | 'maybe') {
    if (!user) return
    if (myResponse?.status === status) {
      withdrawResponse(call.id, user.id)
      return
    }
    respond(
      call.id,
      {
        id: user.id,
        name: user.user_metadata?.display_name ?? user.email ?? 'Anonyme',
      },
      status,
    )
  }

  function handleDelete() {
    if (!isHost) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm("Supprimer cet appel ?")
    ) {
      return
    }
    deleteCall(call.id)
  }

  const formattedDate = formatDate(call.plannedDate)
  const initial = call.hostName.charAt(0).toUpperCase()

  return (
    <article
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      data-testid="call-card"
      data-call-id={call.id}
    >
      {/* Host + date row */}
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initial}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {call.hostName}
            </p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {formattedDate}
              {call.startTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <Clock className="h-3 w-3" />
                  {call.startTime}
                </>
              )}
            </p>
          </div>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            data-testid="call-card-delete"
            aria-label="Supprimer l'appel"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        )}
      </header>

      {/* Sector + grade */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {!hideSector && (
          <Link
            href={`/secteurs/${call.sectorSlug}`}
            className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <MapPin className="h-3 w-3" />
            {call.sectorName}
          </Link>
        )}
        {call.targetGrade && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {call.targetGrade}
          </span>
        )}
      </div>

      {/* Message */}
      {call.message && (
        <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {call.message}
        </p>
      )}

      {/* Footer: counts + RSVP buttons */}
      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" />
            {goingCount} grimpeur{goingCount > 1 ? 's' : ''}
          </span>
          {maybeCount > 0 && (
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-amber-500" />
              {maybeCount} peut-être
            </span>
          )}
        </div>

        {!isHost && user && (
          <div className="flex gap-1.5" role="group" aria-label="Répondre à l'appel">
            <button
              type="button"
              onClick={() => handleRespond('going')}
              data-testid="call-card-going"
              aria-pressed={myResponse?.status === 'going'}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors min-touch ${
                myResponse?.status === 'going'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Check className="h-3 w-3" />
              Je viens
            </button>
            <button
              type="button"
              onClick={() => handleRespond('maybe')}
              data-testid="call-card-maybe"
              aria-pressed={myResponse?.status === 'maybe'}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors min-touch ${
                myResponse?.status === 'maybe'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <HelpCircle className="h-3 w-3" />
              Peut-être
            </button>
          </div>
        )}

        {!user && (
          <Link
            href="/login"
            className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Connecte-toi pour répondre
          </Link>
        )}
      </footer>
    </article>
  )
}

function formatDate(iso: string): string {
  // iso = YYYY-MM-DD; build a date in local time (avoid UTC drift).
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

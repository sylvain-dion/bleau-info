'use client'

import { Eye, EyeOff } from 'lucide-react'
import type { ReactNode } from 'react'

interface SpoilerVeilProps {
  /** When true, the children are hidden behind the veil. */
  hidden: boolean
  /** Called when the user taps "Afficher la bêta". */
  onReveal: () => void
  /** Wrapped content (comment text, video embed, …). */
  children: ReactNode
  /**
   * What sits under the veil — used for the screen-reader label and
   * a small visual hint ("Vidéo masquée" vs. "Bêta masquée").
   */
  kind?: 'comment' | 'video'
}

/**
 * Story 15.1 — anti-spoiler veil.
 *
 * Wraps any block of content that has been flagged as containing climbing
 * beta (handholds, crux sequence, video resolution…) and hides it behind
 * a translucent overlay until the user taps "Afficher la bêta".
 *
 * - When `hidden=true`: the children are still rendered (for layout
 *   stability + media preload) but blurred and overlaid with a CTA. The
 *   overlay is the only thing in the tab order; children are
 *   `inert` + `aria-hidden`.
 * - When `hidden=false`: the children are shown without any wrapper
 *   change — no extra DOM, no layout shift.
 */
export function SpoilerVeil({
  hidden,
  onReveal,
  children,
  kind = 'comment',
}: SpoilerVeilProps) {
  if (!hidden) {
    return <>{children}</>
  }

  const label = kind === 'video' ? 'Vidéo masquée' : 'Bêta masquée'

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      data-testid="spoiler-veil"
      data-kind={kind}
    >
      {/* Children are visually preserved (size/layout) but inert. */}
      <div
        aria-hidden="true"
        // React 19 supports `inert` natively as a boolean attribute, which
        // pulls the subtree out of the focus order and pointer-events tree.
        inert
        className="pointer-events-none select-none blur-md"
      >
        {children}
      </div>

      {/* Veil overlay: dim + reveal button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 px-4 py-3 text-center backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ce contenu peut révéler la méthode du bloc.
        </p>
        <button
          type="button"
          onClick={onReveal}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-touch"
          data-testid="spoiler-veil-reveal"
          aria-label={`Afficher la bêta (${label.toLowerCase()})`}
        >
          <Eye className="h-3.5 w-3.5" />
          Afficher la bêta
        </button>
      </div>
    </div>
  )
}

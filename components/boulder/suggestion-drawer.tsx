'use client'

import { Drawer } from 'vaul'
import { BoulderForm } from './boulder-form'
import type { SuggestionTarget } from './boulder-form'

interface SuggestionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The existing boulder to suggest a modification for (new suggestion mode). */
  suggestionFor?: SuggestionTarget
  /** When provided, the form edits an existing suggestion. */
  editSuggestionId?: string
}

/**
 * Bottom-sheet drawer for creating or editing a boulder modification suggestion.
 *
 * Uses Vaul Drawer for consistent mobile-first UX (same as BoulderCreationDrawer).
 * Wraps BoulderForm in suggestion mode (new or edit).
 */
export function SuggestionDrawer({ open, onOpenChange, suggestionFor, editSuggestionId }: SuggestionDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-xl outline-none"
        >
          <Drawer.Title className="sr-only">
            {editSuggestionId ? 'Modifier la suggestion' : 'Suggérer une modification'}
          </Drawer.Title>

          {/* Drag handle */}
          <div className="flex shrink-0 justify-center py-3">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <BoulderForm
              onClose={() => onOpenChange(false)}
              onSuccess={() => onOpenChange(false)}
              suggestionFor={suggestionFor}
              editSuggestionId={editSuggestionId}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

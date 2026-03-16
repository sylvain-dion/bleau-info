'use client'

import { Drawer } from 'vaul'
import { VideoSubmissionForm } from './video-submission-form'

interface VideoSubmissionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boulderId: string
  /** When provided, the form edits an existing submission. */
  editSubmissionId?: string
}

/**
 * Bottom-sheet drawer for creating or editing a video submission.
 *
 * Uses Vaul Drawer for mobile-first UX (same pattern as SuggestionDrawer).
 */
export function VideoSubmissionDrawer({
  open,
  onOpenChange,
  boulderId,
  editSubmissionId,
}: VideoSubmissionDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-xl outline-none"
        >
          <Drawer.Title className="sr-only">
            {editSubmissionId ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
          </Drawer.Title>

          {/* Drag handle */}
          <div className="flex shrink-0 justify-center py-3">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <VideoSubmissionForm
              boulderId={boulderId}
              onClose={() => onOpenChange(false)}
              onSuccess={() => onOpenChange(false)}
              editSubmissionId={editSubmissionId}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

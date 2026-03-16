'use client'

import { useState, useMemo } from 'react'
import { Video, Pencil, Trash2 } from 'lucide-react'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import type { VideoSubmission } from '@/stores/video-submission-store'
import { useAuthStore } from '@/stores/auth-store'
import { parseVideoUrl } from '@/lib/video'
import { VideoSubmissionDrawer } from '@/components/boulder/video-submission-drawer'

/**
 * Displays the user's video submissions on the profile page.
 *
 * Each submission shows video provider, climber name, moderation status.
 * Submissions can be edited (Pencil) or deleted (Trash2). Renders nothing when empty.
 */
export function VideoSubmissionsSection() {
  const { user } = useAuthStore()
  const allSubmissions = useVideoSubmissionStore((s) => s.submissions)
  const removeSubmission = useVideoSubmissionStore((s) => s.removeSubmission)

  const submissions = useMemo(
    () => (user ? allSubmissions.filter((s) => s.userId === user.id) : []),
    [allSubmissions, user]
  )
  const [editingId, setEditingId] = useState<string | null>(null)

  // Find the boulderId for the editing submission
  const editingSubmission = editingId
    ? submissions.find((s) => s.id === editingId)
    : undefined

  if (submissions.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Video className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Mes vidéos soumises
        </h2>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {submissions.length}
        </span>
      </div>

      <ul className="space-y-2" role="list">
        {submissions.map((submission) => (
          <VideoSubmissionRow
            key={submission.id}
            submission={submission}
            onEdit={() => setEditingId(submission.id)}
            onDelete={() => removeSubmission(submission.id)}
          />
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Les vidéos sont visibles après validation par la communauté.
      </p>

      {/* Edit drawer */}
      {editingSubmission && (
        <VideoSubmissionDrawer
          open={!!editingId}
          onOpenChange={(open) => {
            if (!open) setEditingId(null)
          }}
          boulderId={editingSubmission.boulderId}
          editSubmissionId={editingId ?? undefined}
        />
      )}
    </div>
  )
}

/** Single row for a video submission */
function VideoSubmissionRow({
  submission,
  onEdit,
  onDelete,
}: {
  submission: VideoSubmission
  onEdit: () => void
  onDelete: () => void
}) {
  const parsed = parseVideoUrl(submission.videoUrl)
  const providerLabel = parsed?.provider === 'youtube' ? 'YouTube' : 'Vimeo'

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      {/* Provider badge */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
        {providerLabel === 'YouTube' ? 'YT' : 'VM'}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {submission.climberName ?? providerLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {submission.videographerName
            ? `Vidéo : ${submission.videographerName} · `
            : ''}
          {formatDate(submission.createdAt)}
        </p>
      </div>

      {/* Status pill */}
      <ModerationPill status={submission.moderationStatus} />

      {/* Edit */}
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Modifier la vidéo"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Supprimer la vidéo"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}

/** Visual config for moderation statuses */
const STATUS_CONFIG: Record<
  VideoSubmission['moderationStatus'],
  { label: string; className: string }
> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  approved: {
    label: 'Approuvée',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  rejected: {
    label: 'Rejetée',
    className: 'bg-destructive/10 text-destructive',
  },
}

function ModerationPill({
  status,
}: {
  status: VideoSubmission['moderationStatus']
}) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

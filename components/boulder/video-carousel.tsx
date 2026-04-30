'use client'

import { useState, useMemo } from 'react'
import { Plus, Video, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import { VideoCard } from './video-card'
import { VideoSubmissionDrawer } from './video-submission-drawer'

interface VideoItem {
  videoUrl: string
  climberName?: string | null
  videographerName?: string | null
  /** Story 15.1 — show the video behind a spoiler veil. */
  containsBeta?: boolean
}

interface VideoCarouselProps {
  boulderId: string
  /** Static videos from mock data / DB. */
  mockVideos?: VideoItem[]
}

/**
 * Horizontal scrollable carousel of video cards for a boulder.
 *
 * Merges static mock videos with approved user submissions.
 * Shows "Ajouter une vidéo" button (opens drawer or redirects to login).
 */
export function VideoCarousel({ boulderId, mockVideos }: VideoCarouselProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [showDrawer, setShowDrawer] = useState(false)

  // Select the raw array (stable reference) and derive filtered lists via useMemo
  const allSubmissions = useVideoSubmissionStore((s) => s.submissions)

  const storeSubmissions = useMemo(
    () => allSubmissions.filter((s) => s.boulderId === boulderId),
    [allSubmissions, boulderId]
  )

  // Approved submissions from the store
  const approvedSubmissions = useMemo(
    () =>
      storeSubmissions
        .filter((s) => s.moderationStatus === 'approved')
        .map((s) => ({
          videoUrl: s.videoUrl,
          climberName: s.climberName,
          videographerName: s.videographerName,
          containsBeta: s.containsBeta,
        })),
    [storeSubmissions]
  )

  // Pending count for current user
  const userPendingCount = useMemo(
    () =>
      storeSubmissions.filter(
        (s) => s.userId === user?.id && s.moderationStatus === 'pending'
      ).length,
    [storeSubmissions, user?.id]
  )

  // Merge: mock videos first, then approved store submissions
  const allVideos: VideoItem[] = [
    ...(mockVideos ?? []),
    ...approvedSubmissions,
  ]

  const videoCount = allVideos.length
  const heading = videoCount <= 1 ? 'Vidéo' : 'Vidéos'

  function handleAddClick() {
    if (user) {
      setShowDrawer(true)
    } else {
      router.push('/login')
    }
  }

  // No videos and no ability to add → show nothing
  if (videoCount === 0 && !user) return null

  return (
    <div className="border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {videoCount > 0 ? heading : 'Vidéos'}
          {videoCount > 1 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({videoCount})
            </span>
          )}
        </h3>

        {userPendingCount > 0 && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            {userPendingCount} en attente
          </span>
        )}
      </div>

      {/* Carousel */}
      {videoCount > 0 ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
          {allVideos.map((video, index) => (
            <VideoCard
              key={`${video.videoUrl}-${index}`}
              videoUrl={video.videoUrl}
              climberName={video.climberName}
              videographerName={video.videographerName}
              containsBeta={video.containsBeta}
              boulderId={boulderId}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <div className="text-center">
            <Video className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p>Aucune vidéo</p>
          </div>
        </div>
      )}

      {/* Add video button */}
      <button
        type="button"
        onClick={handleAddClick}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary min-touch"
      >
        {user ? (
          <>
            <Plus className="h-4 w-4" />
            Ajouter une vidéo
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Connectez-vous pour ajouter une vidéo
          </>
        )}
      </button>

      {/* Submission drawer */}
      <VideoSubmissionDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        boulderId={boulderId}
      />
    </div>
  )
}

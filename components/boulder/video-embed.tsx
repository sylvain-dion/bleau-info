import { parseVideoUrl, getEmbedUrl } from '@/lib/video'

interface VideoEmbedProps {
  videoUrl: string
}

/**
 * Responsive YouTube/Vimeo embed player.
 *
 * Parses the raw URL, derives the embed iframe src, and renders
 * a 16:9 responsive wrapper. Returns null for unrecognized URLs.
 */
export function VideoEmbed({ videoUrl }: VideoEmbedProps) {
  const parsed = parseVideoUrl(videoUrl)
  if (!parsed) return null

  const embedSrc = getEmbedUrl(parsed)

  return (
    <div className="aspect-video overflow-hidden rounded-lg" data-testid="video-embed">
      <iframe
        src={embedSrc}
        title="Vidéo du bloc"
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin"
        allow="fullscreen; encrypted-media"
        loading="lazy"
      />
    </div>
  )
}

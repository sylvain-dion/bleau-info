/** Parsed video reference from a YouTube or Vimeo URL. */
export interface ParsedVideo {
  provider: 'youtube' | 'vimeo'
  videoId: string
}

/**
 * Extract provider and video ID from a YouTube or Vimeo URL.
 *
 * Supported formats:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 * - vimeo.com/ID
 * - player.vimeo.com/video/ID
 *
 * Returns null for unrecognized or malformed URLs.
 */
export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url || typeof url !== 'string') return null

  let parsed: URL
  try {
    // Handle URLs without protocol
    const normalized = url.startsWith('http') ? url : `https://${url}`
    parsed = new URL(normalized)
  } catch {
    return null
  }

  const hostname = parsed.hostname.replace(/^www\./, '')

  // YouTube: youtube.com/watch?v=ID
  if (hostname === 'youtube.com' && parsed.pathname === '/watch') {
    const videoId = parsed.searchParams.get('v')
    if (videoId) return { provider: 'youtube', videoId }
  }

  // YouTube: youtube.com/embed/ID
  if (hostname === 'youtube.com' && parsed.pathname.startsWith('/embed/')) {
    const videoId = parsed.pathname.split('/embed/')[1]?.split(/[/?#]/)[0]
    if (videoId) return { provider: 'youtube', videoId }
  }

  // YouTube: youtu.be/ID
  if (hostname === 'youtu.be') {
    const videoId = parsed.pathname.slice(1).split(/[/?#]/)[0]
    if (videoId) return { provider: 'youtube', videoId }
  }

  // Vimeo: vimeo.com/ID
  if (hostname === 'vimeo.com') {
    const match = parsed.pathname.match(/^\/(\d+)/)
    if (match) return { provider: 'vimeo', videoId: match[1] }
  }

  // Vimeo: player.vimeo.com/video/ID
  if (hostname === 'player.vimeo.com' && parsed.pathname.startsWith('/video/')) {
    const videoId = parsed.pathname.split('/video/')[1]?.split(/[/?#]/)[0]
    if (videoId) return { provider: 'vimeo', videoId }
  }

  return null
}

/**
 * Generate a privacy-enhanced embed URL from a parsed video reference.
 *
 * - YouTube: uses youtube-nocookie.com to reduce tracking
 * - Vimeo: uses player.vimeo.com
 */
export function getEmbedUrl(parsed: ParsedVideo): string {
  if (parsed.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${parsed.videoId}`
  }
  return `https://player.vimeo.com/video/${parsed.videoId}`
}

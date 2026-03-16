import { describe, it, expect } from 'vitest'
import { parseVideoUrl, getEmbedUrl } from '@/lib/video'

describe('parseVideoUrl', () => {
  describe('YouTube', () => {
    it('parses standard youtube.com/watch URL', () => {
      expect(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
      })
    })

    it('parses youtube.com/watch without www', () => {
      expect(parseVideoUrl('https://youtube.com/watch?v=abc123')).toEqual({
        provider: 'youtube',
        videoId: 'abc123',
      })
    })

    it('parses youtube.com/watch with extra params', () => {
      expect(parseVideoUrl('https://youtube.com/watch?v=abc123&t=120&list=PLxyz')).toEqual({
        provider: 'youtube',
        videoId: 'abc123',
      })
    })

    it('parses youtu.be short URL', () => {
      expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
      })
    })

    it('parses youtube.com/embed URL', () => {
      expect(parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
      })
    })

    it('parses URL without protocol', () => {
      expect(parseVideoUrl('youtube.com/watch?v=abc123')).toEqual({
        provider: 'youtube',
        videoId: 'abc123',
      })
    })
  })

  describe('Vimeo', () => {
    it('parses standard vimeo.com URL', () => {
      expect(parseVideoUrl('https://vimeo.com/123456789')).toEqual({
        provider: 'vimeo',
        videoId: '123456789',
      })
    })

    it('parses player.vimeo.com URL', () => {
      expect(parseVideoUrl('https://player.vimeo.com/video/123456789')).toEqual({
        provider: 'vimeo',
        videoId: '123456789',
      })
    })

    it('parses vimeo URL without protocol', () => {
      expect(parseVideoUrl('vimeo.com/987654321')).toEqual({
        provider: 'vimeo',
        videoId: '987654321',
      })
    })
  })

  describe('invalid URLs', () => {
    it('returns null for empty string', () => {
      expect(parseVideoUrl('')).toBeNull()
    })

    it('returns null for random string', () => {
      expect(parseVideoUrl('not a url')).toBeNull()
    })

    it('returns null for other domains', () => {
      expect(parseVideoUrl('https://dailymotion.com/video/abc')).toBeNull()
    })

    it('returns null for youtube.com without video ID', () => {
      expect(parseVideoUrl('https://youtube.com/watch')).toBeNull()
    })

    it('returns null for vimeo.com without numeric ID', () => {
      expect(parseVideoUrl('https://vimeo.com/channels/staffpicks')).toBeNull()
    })
  })
})

describe('getEmbedUrl', () => {
  it('returns youtube-nocookie embed URL for YouTube', () => {
    expect(getEmbedUrl({ provider: 'youtube', videoId: 'dQw4w9WgXcQ' }))
      .toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('returns player.vimeo.com URL for Vimeo', () => {
    expect(getEmbedUrl({ provider: 'vimeo', videoId: '123456789' }))
      .toBe('https://player.vimeo.com/video/123456789')
  })
})

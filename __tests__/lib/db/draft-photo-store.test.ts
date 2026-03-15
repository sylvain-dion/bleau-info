import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { draftDb } from '@/lib/db/draft-db'
import {
  dataUrlToBuffer,
  bufferToDataUrl,
  savePhoto,
  loadPhoto,
  deletePhoto,
  deletePhotos,
} from '@/lib/db/draft-photo-store'

/** Minimal valid JPEG data URL (1x1 red pixel) */
const TINY_JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k='

/** Minimal PNG data URL (1x1 pixel) */
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

describe('draft-photo-store', () => {
  beforeEach(async () => {
    await draftDb.draftPhotos.clear()
  })

  describe('dataUrlToBuffer', () => {
    it('extracts correct MIME type from JPEG data URL', () => {
      const { mimeType } = dataUrlToBuffer(TINY_JPEG)
      expect(mimeType).toBe('image/jpeg')
    })

    it('extracts correct MIME type from PNG data URL', () => {
      const { mimeType } = dataUrlToBuffer(TINY_PNG)
      expect(mimeType).toBe('image/png')
    })

    it('returns non-empty ArrayBuffer', () => {
      const { buffer } = dataUrlToBuffer(TINY_JPEG)
      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('defaults to image/jpeg when MIME is absent', () => {
      // data:;base64,... → no MIME captured → fallback
      const { mimeType } = dataUrlToBuffer('data:;base64,AAAA')
      expect(mimeType).toBe('image/jpeg')
    })
  })

  describe('bufferToDataUrl', () => {
    it('converts buffer back to data URL', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer
      const result = bufferToDataUrl(buffer, 'text/plain')
      expect(result).toBe('data:text/plain;base64,SGVsbG8=')
    })
  })

  describe('round-trip: dataUrl → buffer → dataUrl', () => {
    it('preserves JPEG data exactly', () => {
      const { buffer, mimeType } = dataUrlToBuffer(TINY_JPEG)
      const restored = bufferToDataUrl(buffer, mimeType)
      expect(restored).toBe(TINY_JPEG)
    })

    it('preserves PNG data exactly', () => {
      const { buffer, mimeType } = dataUrlToBuffer(TINY_PNG)
      const restored = bufferToDataUrl(buffer, mimeType)
      expect(restored).toBe(TINY_PNG)
    })
  })

  describe('savePhoto', () => {
    it('saves a photo to IndexedDB', async () => {
      await savePhoto('draft-1', TINY_JPEG)

      const count = await draftDb.draftPhotos.count()
      expect(count).toBe(1)

      const record = await draftDb.draftPhotos
        .where('draftId')
        .equals('draft-1')
        .first()
      expect(record).toBeDefined()
      expect(record!.draftId).toBe('draft-1')
      expect(record!.mimeType).toBe('image/jpeg')
      expect(record!.data.byteLength).toBeGreaterThan(0)
      expect(record!.createdAt).toBeTruthy()
    })

    it('upserts — replaces existing photo for same draftId', async () => {
      await savePhoto('draft-1', TINY_JPEG)
      await savePhoto('draft-1', TINY_PNG)

      const count = await draftDb.draftPhotos
        .where('draftId')
        .equals('draft-1')
        .count()
      expect(count).toBe(1)

      const record = await draftDb.draftPhotos
        .where('draftId')
        .equals('draft-1')
        .first()
      expect(record!.mimeType).toBe('image/png')
    })

    it('stores photos for different drafts independently', async () => {
      await savePhoto('draft-1', TINY_JPEG)
      await savePhoto('draft-2', TINY_JPEG)

      const count = await draftDb.draftPhotos.count()
      expect(count).toBe(2)
    })
  })

  describe('loadPhoto', () => {
    it('loads a saved photo as data URL', async () => {
      await savePhoto('draft-1', TINY_JPEG)

      const result = await loadPhoto('draft-1')
      expect(result).toBe(TINY_JPEG)
    })

    it('returns null for non-existent draftId', async () => {
      const result = await loadPhoto('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('deletePhoto', () => {
    it('removes a photo from IndexedDB', async () => {
      await savePhoto('draft-1', TINY_JPEG)
      await deletePhoto('draft-1')

      const result = await loadPhoto('draft-1')
      expect(result).toBeNull()
    })

    it('does not fail when deleting non-existent photo', async () => {
      await expect(deletePhoto('non-existent')).resolves.toBeUndefined()
    })

    it('does not affect other drafts', async () => {
      await savePhoto('draft-1', TINY_JPEG)
      await savePhoto('draft-2', TINY_JPEG)

      await deletePhoto('draft-1')

      expect(await loadPhoto('draft-1')).toBeNull()
      expect(await loadPhoto('draft-2')).toBe(TINY_JPEG)
    })
  })

  describe('deletePhotos (batch)', () => {
    it('deletes photos for multiple draftIds', async () => {
      await savePhoto('draft-1', TINY_JPEG)
      await savePhoto('draft-2', TINY_JPEG)
      await savePhoto('draft-3', TINY_JPEG)

      await deletePhotos(['draft-1', 'draft-3'])

      expect(await loadPhoto('draft-1')).toBeNull()
      expect(await loadPhoto('draft-2')).toBe(TINY_JPEG)
      expect(await loadPhoto('draft-3')).toBeNull()
    })

    it('handles empty array gracefully', async () => {
      await expect(deletePhotos([])).resolves.toBeUndefined()
    })
  })
})

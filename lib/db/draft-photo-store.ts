/**
 * Async helper for storing/retrieving photo data in IndexedDB.
 *
 * Photos are stored as ArrayBuffer + mimeType (not Blob) for
 * maximum IndexedDB compatibility. Conversion between data URL
 * and binary happens at the boundary.
 */

import { draftDb } from './draft-db'

/** Extract MIME type from a data URL header */
function parseMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;,]+)/)
  return match?.[1] || 'image/jpeg'
}

/**
 * Convert a data URL (e.g. "data:image/jpeg;base64,...") to an
 * ArrayBuffer + mimeType pair.
 */
export function dataUrlToBuffer(
  dataUrl: string
): { buffer: ArrayBuffer; mimeType: string } {
  const mimeType = parseMimeType(dataUrl)
  const base64 = dataUrl.split(',')[1]
  const bytes = atob(base64)
  const buffer = new ArrayBuffer(bytes.length)
  const view = new Uint8Array(buffer)

  for (let i = 0; i < bytes.length; i++) {
    view[i] = bytes.charCodeAt(i)
  }

  return { buffer, mimeType }
}

/**
 * Convert an ArrayBuffer + mimeType back to a data URL string.
 */
export function bufferToDataUrl(
  buffer: ArrayBuffer,
  mimeType: string
): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return `data:${mimeType};base64,${btoa(binary)}`
}

/**
 * Save a photo for a draft. Upserts — replaces existing photo
 * for the same draftId.
 */
export async function savePhoto(
  draftId: string,
  dataUrl: string
): Promise<void> {
  const { buffer, mimeType } = dataUrlToBuffer(dataUrl)

  await draftDb.transaction('rw', draftDb.draftPhotos, async () => {
    // Delete any existing photo for this draft
    await draftDb.draftPhotos.where('draftId').equals(draftId).delete()

    // Insert the new photo
    await draftDb.draftPhotos.add({
      draftId,
      data: buffer,
      mimeType,
      createdAt: new Date().toISOString(),
    })
  })
}

/**
 * Load a photo data URL for a given draft.
 * Returns null if no photo exists.
 */
export async function loadPhoto(
  draftId: string
): Promise<string | null> {
  const record = await draftDb.draftPhotos
    .where('draftId')
    .equals(draftId)
    .first()

  if (!record) return null

  return bufferToDataUrl(record.data, record.mimeType)
}

/**
 * Delete the photo data for a given draft.
 */
export async function deletePhoto(draftId: string): Promise<void> {
  await draftDb.draftPhotos.where('draftId').equals(draftId).delete()
}

/**
 * Batch delete photos for multiple drafts.
 */
export async function deletePhotos(draftIds: string[]): Promise<void> {
  if (draftIds.length === 0) return
  await draftDb.draftPhotos
    .where('draftId')
    .anyOf(draftIds)
    .delete()
}

/**
 * Dexie IndexedDB database for boulder draft binary data.
 *
 * Photo data is too large for localStorage, so we store it
 * in IndexedDB while keeping draft metadata in Zustand/localStorage.
 *
 * We store ArrayBuffer + mimeType instead of Blob for maximum
 * compatibility across IndexedDB implementations.
 */

import Dexie, { type Table } from 'dexie'

/** A photo record linked to a boulder draft */
export interface DraftPhoto {
  /** Auto-increment primary key */
  id?: number
  /** Links to BoulderDraft.id in the Zustand store */
  draftId: string
  /** Raw photo binary data */
  data: ArrayBuffer
  /** MIME type (e.g. "image/jpeg") */
  mimeType: string
  /** ISO timestamp */
  createdAt: string
}

class DraftDatabase extends Dexie {
  draftPhotos!: Table<DraftPhoto>

  constructor() {
    super('bleau-drafts')
    this.version(1).stores({
      draftPhotos: '++id, draftId',
    })
  }
}

export const draftDb = new DraftDatabase()

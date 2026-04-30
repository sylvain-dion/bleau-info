import { describe, it, expect, beforeEach } from 'vitest'
import { useSpoilerPreferenceStore } from '@/stores/spoiler-preference-store'

/** Reset to a clean store between tests */
function resetStore() {
  useSpoilerPreferenceStore.setState({
    revealedComments: {},
    revealedVideos: {},
    revealAllByBoulder: {},
  })
}

describe('spoiler-preference-store', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('revealComment', () => {
    it('marks a comment as revealed', () => {
      useSpoilerPreferenceStore.getState().revealComment('c-1')
      expect(useSpoilerPreferenceStore.getState().revealedComments['c-1']).toBe(true)
    })

    it('is a no-op when called twice on the same id (same reference)', () => {
      const { revealComment } = useSpoilerPreferenceStore.getState()
      revealComment('c-1')
      const before = useSpoilerPreferenceStore.getState().revealedComments
      revealComment('c-1')
      const after = useSpoilerPreferenceStore.getState().revealedComments
      expect(after).toBe(before)
    })

    it('keeps unrelated comments untouched', () => {
      const { revealComment } = useSpoilerPreferenceStore.getState()
      revealComment('c-1')
      revealComment('c-2')
      const map = useSpoilerPreferenceStore.getState().revealedComments
      expect(map['c-1']).toBe(true)
      expect(map['c-2']).toBe(true)
    })
  })

  describe('revealVideo', () => {
    it('marks a video URL as revealed', () => {
      useSpoilerPreferenceStore
        .getState()
        .revealVideo('https://www.youtube.com/watch?v=abc')
      expect(
        useSpoilerPreferenceStore.getState().revealedVideos[
          'https://www.youtube.com/watch?v=abc'
        ],
      ).toBe(true)
    })

    it('is a no-op on second reveal of the same URL', () => {
      const { revealVideo } = useSpoilerPreferenceStore.getState()
      revealVideo('vid-key')
      const before = useSpoilerPreferenceStore.getState().revealedVideos
      revealVideo('vid-key')
      expect(useSpoilerPreferenceStore.getState().revealedVideos).toBe(before)
    })
  })

  describe('setRevealAll', () => {
    it('flips the boulder-level override on', () => {
      useSpoilerPreferenceStore.getState().setRevealAll('boulder-42', true)
      expect(
        useSpoilerPreferenceStore.getState().isRevealAllForBoulder('boulder-42'),
      ).toBe(true)
    })

    it('removes the entry when set to false', () => {
      const { setRevealAll, isRevealAllForBoulder } =
        useSpoilerPreferenceStore.getState()
      setRevealAll('boulder-42', true)
      expect(isRevealAllForBoulder('boulder-42')).toBe(true)
      setRevealAll('boulder-42', false)
      expect(isRevealAllForBoulder('boulder-42')).toBe(false)
      // Underlying record actually removes the key (not just sets it false)
      expect(
        'boulder-42' in useSpoilerPreferenceStore.getState().revealAllByBoulder,
      ).toBe(false)
    })
  })

  describe('isCommentRevealed', () => {
    it('returns false when neither individual nor boulder reveal is set', () => {
      expect(
        useSpoilerPreferenceStore.getState().isCommentRevealed('c-1', 'b-1'),
      ).toBe(false)
    })

    it('returns true when revealed individually', () => {
      const { revealComment, isCommentRevealed } =
        useSpoilerPreferenceStore.getState()
      revealComment('c-1')
      expect(isCommentRevealed('c-1', 'b-1')).toBe(true)
    })

    it('returns true via the boulder-level override', () => {
      const { setRevealAll, isCommentRevealed } =
        useSpoilerPreferenceStore.getState()
      setRevealAll('b-1', true)
      expect(isCommentRevealed('c-99', 'b-1')).toBe(true)
    })

    it('does not leak across boulders', () => {
      const { setRevealAll, isCommentRevealed } =
        useSpoilerPreferenceStore.getState()
      setRevealAll('b-1', true)
      expect(isCommentRevealed('c-1', 'b-2')).toBe(false)
    })
  })

  describe('isVideoRevealed', () => {
    it('returns true when individually revealed', () => {
      const { revealVideo, isVideoRevealed } =
        useSpoilerPreferenceStore.getState()
      revealVideo('vid-key')
      expect(isVideoRevealed('vid-key', 'b-1')).toBe(true)
    })

    it('returns true via boulder-level override', () => {
      const { setRevealAll, isVideoRevealed } =
        useSpoilerPreferenceStore.getState()
      setRevealAll('b-1', true)
      expect(isVideoRevealed('vid-other', 'b-1')).toBe(true)
    })
  })

  describe('hideAllForBoulder', () => {
    it('clears revealed comments listed in the boulder', () => {
      const { revealComment, hideAllForBoulder, isCommentRevealed } =
        useSpoilerPreferenceStore.getState()
      revealComment('c-1')
      revealComment('c-2')
      hideAllForBoulder('b-1', { commentIds: ['c-1', 'c-2'], videoKeys: [] })
      expect(isCommentRevealed('c-1', 'b-1')).toBe(false)
      expect(isCommentRevealed('c-2', 'b-1')).toBe(false)
    })

    it('clears revealed videos listed in the boulder', () => {
      const { revealVideo, hideAllForBoulder, isVideoRevealed } =
        useSpoilerPreferenceStore.getState()
      revealVideo('vid-1')
      revealVideo('vid-2')
      hideAllForBoulder('b-1', {
        commentIds: [],
        videoKeys: ['vid-1', 'vid-2'],
      })
      expect(isVideoRevealed('vid-1', 'b-1')).toBe(false)
      expect(isVideoRevealed('vid-2', 'b-1')).toBe(false)
    })

    it('clears the boulder-level override', () => {
      const { setRevealAll, hideAllForBoulder, isRevealAllForBoulder } =
        useSpoilerPreferenceStore.getState()
      setRevealAll('b-1', true)
      hideAllForBoulder('b-1', { commentIds: [], videoKeys: [] })
      expect(isRevealAllForBoulder('b-1')).toBe(false)
    })

    it('leaves reveals on other boulders intact', () => {
      const { revealComment, revealVideo, hideAllForBoulder } =
        useSpoilerPreferenceStore.getState()
      revealComment('c-other-boulder')
      revealVideo('vid-other-boulder')
      hideAllForBoulder('b-1', { commentIds: ['c-1'], videoKeys: ['vid-1'] })

      const state = useSpoilerPreferenceStore.getState()
      expect(state.revealedComments['c-other-boulder']).toBe(true)
      expect(state.revealedVideos['vid-other-boulder']).toBe(true)
    })
  })
})

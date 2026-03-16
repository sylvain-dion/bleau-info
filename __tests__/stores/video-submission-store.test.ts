import { describe, it, expect, beforeEach } from 'vitest'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'

describe('video-submission-store', () => {
  beforeEach(() => {
    useVideoSubmissionStore.setState({ submissions: [] })
  })

  describe('addSubmission', () => {
    it('creates a submission with pending status', () => {
      const store = useVideoSubmissionStore.getState()
      const id = store.addSubmission({
        boulderId: 'boulder-1',
        videoUrl: 'https://www.youtube.com/watch?v=abc123',
        userId: 'user-1',
        climberName: 'Jacky Godoffe',
        videographerName: 'Bleau.info',
      })

      const submission = useVideoSubmissionStore.getState().getSubmission(id)
      expect(submission).toBeDefined()
      expect(submission?.boulderId).toBe('boulder-1')
      expect(submission?.videoUrl).toBe('https://www.youtube.com/watch?v=abc123')
      expect(submission?.climberName).toBe('Jacky Godoffe')
      expect(submission?.videographerName).toBe('Bleau.info')
      expect(submission?.moderationStatus).toBe('pending')
      expect(submission?.userId).toBe('user-1')
    })

    it('defaults climberName and videographerName to null', () => {
      const store = useVideoSubmissionStore.getState()
      const id = store.addSubmission({
        boulderId: 'boulder-1',
        videoUrl: 'https://vimeo.com/123456',
        userId: 'user-1',
      })

      const submission = useVideoSubmissionStore.getState().getSubmission(id)
      expect(submission?.climberName).toBeNull()
      expect(submission?.videographerName).toBeNull()
    })

    it('prepends new submissions to the list', () => {
      const store = useVideoSubmissionStore.getState()
      store.addSubmission({
        boulderId: 'boulder-1',
        videoUrl: 'https://youtube.com/watch?v=first',
        userId: 'user-1',
      })
      store.addSubmission({
        boulderId: 'boulder-1',
        videoUrl: 'https://youtube.com/watch?v=second',
        userId: 'user-1',
      })

      const { submissions } = useVideoSubmissionStore.getState()
      expect(submissions).toHaveLength(2)
      expect(submissions[0].videoUrl).toContain('second')
    })
  })

  describe('updateSubmission', () => {
    it('updates editable fields', () => {
      const store = useVideoSubmissionStore.getState()
      const id = store.addSubmission({
        boulderId: 'boulder-1',
        videoUrl: 'https://youtube.com/watch?v=old',
        userId: 'user-1',
      })

      useVideoSubmissionStore.getState().updateSubmission(id, {
        videoUrl: 'https://youtube.com/watch?v=new',
        climberName: 'Updated Climber',
      })

      const after = useVideoSubmissionStore.getState().getSubmission(id)
      expect(after?.videoUrl).toContain('new')
      expect(after?.climberName).toBe('Updated Climber')
      // boulderId and userId should remain unchanged
      expect(after?.boulderId).toBe('boulder-1')
      expect(after?.userId).toBe('user-1')
    })
  })

  describe('removeSubmission', () => {
    it('removes a submission by ID', () => {
      const store = useVideoSubmissionStore.getState()
      const id = store.addSubmission({
        boulderId: 'boulder-1',
        videoUrl: 'https://youtube.com/watch?v=test',
        userId: 'user-1',
      })

      expect(useVideoSubmissionStore.getState().submissions).toHaveLength(1)
      useVideoSubmissionStore.getState().removeSubmission(id)
      expect(useVideoSubmissionStore.getState().submissions).toHaveLength(0)
    })
  })

  describe('getSubmissionsForBoulder', () => {
    it('filters by boulderId', () => {
      const store = useVideoSubmissionStore.getState()
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=a', userId: 'u1' })
      store.addSubmission({ boulderId: 'b-2', videoUrl: 'https://youtube.com/watch?v=b', userId: 'u1' })
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=c', userId: 'u2' })

      const result = useVideoSubmissionStore.getState().getSubmissionsForBoulder('b-1')
      expect(result).toHaveLength(2)
      expect(result.every((s) => s.boulderId === 'b-1')).toBe(true)
    })
  })

  describe('getSubmissionsForUser', () => {
    it('filters by userId', () => {
      const store = useVideoSubmissionStore.getState()
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=a', userId: 'u1' })
      store.addSubmission({ boulderId: 'b-2', videoUrl: 'https://youtube.com/watch?v=b', userId: 'u2' })

      const result = useVideoSubmissionStore.getState().getSubmissionsForUser('u1')
      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('u1')
    })
  })

  describe('getUniqueClimberNames', () => {
    it('returns sorted unique climber names', () => {
      const store = useVideoSubmissionStore.getState()
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=a', userId: 'u1', climberName: 'Zack' })
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=b', userId: 'u1', climberName: 'Alice' })
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=c', userId: 'u1', climberName: 'Zack' })
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=d', userId: 'u1' })

      const names = useVideoSubmissionStore.getState().getUniqueClimberNames()
      expect(names).toEqual(['Alice', 'Zack'])
    })
  })

  describe('getUniqueVideographerNames', () => {
    it('returns sorted unique videographer names', () => {
      const store = useVideoSubmissionStore.getState()
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=a', userId: 'u1', videographerName: 'Pierre' })
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=b', userId: 'u1', videographerName: 'Marie' })
      store.addSubmission({ boulderId: 'b-1', videoUrl: 'https://youtube.com/watch?v=c', userId: 'u1', videographerName: 'Pierre' })

      const names = useVideoSubmissionStore.getState().getUniqueVideographerNames()
      expect(names).toEqual(['Marie', 'Pierre'])
    })
  })
})

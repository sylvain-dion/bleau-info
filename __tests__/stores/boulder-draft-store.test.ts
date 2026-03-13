import { describe, it, expect, beforeEach } from 'vitest'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import type { BoulderDraftInput } from '@/stores/boulder-draft-store'

/** Minimal valid draft input for reuse across tests */
const validInput: BoulderDraftInput = {
  name: 'Le Nouveau Bloc',
  grade: '6a',
  style: 'dalle',
  sector: 'Cul de Chien',
  description: '',
  height: null,
  exposure: null,
  strollerAccessible: false,
}

describe('boulder-draft-store', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({ drafts: [] })
  })

  it('should start with empty drafts', () => {
    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
  })

  it('should add a draft and return its id', () => {
    const id = useBoulderDraftStore.getState().addDraft(validInput)

    expect(id).toBeTruthy()
    const drafts = useBoulderDraftStore.getState().drafts
    expect(drafts).toHaveLength(1)
    expect(drafts[0].name).toBe('Le Nouveau Bloc')
    expect(drafts[0].grade).toBe('6a')
    expect(drafts[0].style).toBe('dalle')
    expect(drafts[0].status).toBe('draft')
    expect(drafts[0].createdAt).toBeTruthy()
    expect(drafts[0].updatedAt).toBeTruthy()
  })

  it('should prepend new drafts (newest first)', () => {
    useBoulderDraftStore.getState().addDraft({ ...validInput, name: 'Bloc A' })
    useBoulderDraftStore.getState().addDraft({ ...validInput, name: 'Bloc B' })

    const drafts = useBoulderDraftStore.getState().drafts
    expect(drafts).toHaveLength(2)
    expect(drafts[0].name).toBe('Bloc B')
    expect(drafts[1].name).toBe('Bloc A')
  })

  it('should add a draft with all optional fields', () => {
    const id = useBoulderDraftStore.getState().addDraft({
      ...validInput,
      description: 'Un superbe dévers à doigts',
      height: 4.5,
      exposure: 'soleil',
      strollerAccessible: true,
    })

    const draft = useBoulderDraftStore.getState().getDraft(id)
    expect(draft).toBeDefined()
    expect(draft!.description).toBe('Un superbe dévers à doigts')
    expect(draft!.height).toBe(4.5)
    expect(draft!.exposure).toBe('soleil')
    expect(draft!.strollerAccessible).toBe(true)
  })

  it('should update a draft by id', () => {
    const id = useBoulderDraftStore.getState().addDraft(validInput)

    useBoulderDraftStore.getState().updateDraft(id, {
      name: 'Nom Modifié',
      grade: '7a',
    })

    const updated = useBoulderDraftStore.getState().getDraft(id)
    expect(updated).toBeDefined()
    expect(updated!.name).toBe('Nom Modifié')
    expect(updated!.grade).toBe('7a')
    expect(updated!.updatedAt).toBeTruthy()
  })

  it('should not fail when updating non-existent draft', () => {
    useBoulderDraftStore.getState().updateDraft('non-existent', { name: 'Test' })
    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
  })

  it('should remove a draft by id', () => {
    const id = useBoulderDraftStore.getState().addDraft(validInput)
    expect(useBoulderDraftStore.getState().drafts).toHaveLength(1)

    useBoulderDraftStore.getState().removeDraft(id)
    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
  })

  it('should not fail when removing non-existent draft', () => {
    useBoulderDraftStore.getState().removeDraft('non-existent')
    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
  })

  it('should get a draft by id', () => {
    const id = useBoulderDraftStore.getState().addDraft(validInput)

    const draft = useBoulderDraftStore.getState().getDraft(id)
    expect(draft).toBeDefined()
    expect(draft!.id).toBe(id)
  })

  it('should return undefined for non-existent draft', () => {
    expect(useBoulderDraftStore.getState().getDraft('non-existent')).toBeUndefined()
  })

  describe('isNameTaken', () => {
    it('should detect duplicate name in mock boulders', () => {
      // "La Marie-Rose" exists in "Cul de Chien" sector in mock data
      const taken = useBoulderDraftStore.getState().isNameTaken(
        'La Marie-Rose',
        'Cul de Chien'
      )
      expect(taken).toBe(true)
    })

    it('should be case-insensitive for name matching', () => {
      const taken = useBoulderDraftStore.getState().isNameTaken(
        'la marie-rose',
        'Cul de Chien'
      )
      expect(taken).toBe(true)
    })

    it('should not flag name in a different sector', () => {
      const taken = useBoulderDraftStore.getState().isNameTaken(
        'La Marie-Rose',
        'Bas Cuvier'
      )
      expect(taken).toBe(false)
    })

    it('should detect duplicate name in local drafts', () => {
      useBoulderDraftStore.getState().addDraft(validInput)

      const taken = useBoulderDraftStore.getState().isNameTaken(
        'Le Nouveau Bloc',
        'Cul de Chien'
      )
      expect(taken).toBe(true)
    })

    it('should return false when name or sector is empty', () => {
      expect(useBoulderDraftStore.getState().isNameTaken('', 'Cul de Chien')).toBe(false)
      expect(useBoulderDraftStore.getState().isNameTaken('Test', '')).toBe(false)
    })

    it('should return false for unique name in sector', () => {
      const taken = useBoulderDraftStore.getState().isNameTaken(
        'Un Bloc Qui N\'Existe Pas',
        'Cul de Chien'
      )
      expect(taken).toBe(false)
    })
  })
})

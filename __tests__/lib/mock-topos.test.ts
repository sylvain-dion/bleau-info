import { describe, it, expect } from 'vitest'
import { getTopoData, mockTopos } from '@/lib/data/mock-topos'

describe('mock-topos', () => {
  describe('getTopoData', () => {
    it('should return topo data for a boulder with topo', () => {
      const topo = getTopoData('cul-de-chien-1')
      expect(topo).not.toBeNull()
      expect(topo!.boulderId).toBe('cul-de-chien-1')
      expect(topo!.circuitColor).toBe('rouge')
    })

    it('should return null for a boulder without topo', () => {
      const topo = getTopoData('nonexistent-boulder')
      expect(topo).toBeNull()
    })

    it('should include drawing with valid viewBox', () => {
      const topo = getTopoData('cul-de-chien-1')
      expect(topo!.drawing.viewBox).toBe('0 0 800 600')
    })

    it('should include route path, start circle, and end polygon', () => {
      const topo = getTopoData('cul-de-chien-1')
      const elements = topo!.drawing.elements

      const path = elements.find((e) => e.type === 'path')
      const circle = elements.find((e) => e.type === 'circle')
      const polygon = elements.find((e) => e.type === 'polygon')

      expect(path).toBeDefined()
      expect(circle).toBeDefined()
      expect(polygon).toBeDefined()
    })

    it('should have start label on circle', () => {
      const topo = getTopoData('cul-de-chien-1')
      const circle = topo!.drawing.elements.find((e) => e.type === 'circle')
      expect(circle).toBeDefined()
      if (circle?.type === 'circle') {
        expect(circle.label).toBe('start')
      }
    })

    it('should have end label on polygon', () => {
      const topo = getTopoData('cul-de-chien-1')
      const polygon = topo!.drawing.elements.find((e) => e.type === 'polygon')
      expect(polygon).toBeDefined()
      if (polygon?.type === 'polygon') {
        expect(polygon.label).toBe('end')
      }
    })
  })

  describe('mockTopos', () => {
    it('should have at least 5 boulders with topo data', () => {
      expect(Object.keys(mockTopos).length).toBeGreaterThanOrEqual(5)
    })

    it('should include topos for different circuit colors', () => {
      const colors = new Set(
        Object.values(mockTopos)
          .map((t) => t.circuitColor)
          .filter(Boolean)
      )
      expect(colors.has('rouge')).toBe(true)
      expect(colors.has('bleu')).toBe(true)
    })

    it('should include a topo for a boulder without circuit', () => {
      const nullCircuit = Object.values(mockTopos).find((t) => t.circuitColor === null)
      expect(nullCircuit).toBeDefined()
    })
  })
})

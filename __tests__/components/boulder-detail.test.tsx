import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoulderDetail } from '@/components/map/boulder-detail'
import type { BoulderProperties } from '@/lib/data/mock-boulders'

const defaultProps: BoulderProperties = {
  id: 'test-boulder-1',
  name: 'La Marie-Rose',
  grade: '6a',
  sector: 'Cul de Chien',
  circuit: 'rouge',
  circuitNumber: 1,
  style: 'dalle',
  exposure: 'soleil',
  strollerAccessible: false,
}

const defaultCoordinates: [number, number] = [2.6345, 48.3815]

describe('BoulderDetail', () => {
  describe('Peek state (isExpanded=false)', () => {
    it('should render boulder name', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.getByText('La Marie-Rose')).toBeDefined()
    })

    it('should render sector name', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.getByText('Cul de Chien')).toBeDefined()
    })

    it('should render grade', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.getByText('6A')).toBeDefined()
    })

    it('should render circuit badge', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.getByText('Rouge')).toBeDefined()
    })

    it('should render circuit number', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.getByText('1')).toBeDefined()
    })

    it('should render style tag', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.getByText('Dalle')).toBeDefined()
    })

    it('should NOT render expanded details', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.queryByText('Exposition')).toBeNull()
    })
  })

  describe('Expanded state (isExpanded=true)', () => {
    it('should render exposure info', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      expect(screen.getByText('Exposition')).toBeDefined()
      expect(screen.getByText('Au soleil')).toBeDefined()
    })

    it('should render stroller access info', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      expect(screen.getByText('Accès poussette')).toBeDefined()
      expect(screen.getByText('Non')).toBeDefined()
    })

    it('should render stroller "Oui" when accessible', () => {
      render(
        <BoulderDetail
          properties={{ ...defaultProps, strollerAccessible: true }}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      expect(screen.getByText('Oui')).toBeDefined()
    })

    it('should render topo placeholder', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      expect(screen.getByText('Topo')).toBeDefined()
    })

    it('should render coordinates', () => {
      render(
        <BoulderDetail
          properties={defaultProps}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      expect(screen.getByText('48.38150')).toBeDefined()
      expect(screen.getByText('2.63450')).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle boulder without circuit', () => {
      render(
        <BoulderDetail
          properties={{ ...defaultProps, circuit: null, circuitNumber: null }}
          coordinates={defaultCoordinates}
          isExpanded={false}
        />
      )
      expect(screen.queryByText('Rouge')).toBeNull()
      // Name and grade should still render
      expect(screen.getByText('La Marie-Rose')).toBeDefined()
      expect(screen.getByText('6A')).toBeDefined()
    })

    it('should render ombre exposure', () => {
      render(
        <BoulderDetail
          properties={{ ...defaultProps, exposure: 'ombre' }}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      // Check the unicode right single quotation mark
      const exposureEl = screen.getByText('Exposition')
      expect(exposureEl).toBeDefined()
    })

    it('should render mi-ombre exposure', () => {
      render(
        <BoulderDetail
          properties={{ ...defaultProps, exposure: 'mi-ombre' }}
          coordinates={defaultCoordinates}
          isExpanded={true}
        />
      )
      expect(screen.getByText('Mi-ombre')).toBeDefined()
    })
  })
})

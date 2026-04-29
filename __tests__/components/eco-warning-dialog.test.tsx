import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EcoWarningDialog } from '@/components/boulder/eco-warning-dialog'
import type { EnvironmentalZoneFeature } from '@/lib/data/mock-environmental-zones'

const zone: EnvironmentalZoneFeature = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  properties: {
    id: 'zone-test',
    type: 'nidification',
    severity: 'forbidden',
    title: 'Zone test',
    description: 'Description test',
    validFrom: '2026-03-01',
    validTo: '2026-06-30',
    source: 'ONF',
  },
}

describe('EcoWarningDialog', () => {
  it('renders the dialog with the zone information', () => {
    render(
      <EcoWarningDialog
        zones={[zone]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByTestId('eco-warning-dialog')).toBeDefined()
    expect(screen.getByTestId('eco-warning-zone-zone-test')).toBeDefined()
    expect(screen.getByText('Zone test')).toBeDefined()
    expect(screen.getByText('Description test')).toBeDefined()
    expect(screen.getByText(/Source : ONF/)).toBeDefined()
  })

  it('calls onConfirm when the user clicks the confirm button', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <EcoWarningDialog zones={[zone]} onConfirm={onConfirm} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByTestId('eco-warning-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when the user clicks the cancel button', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <EcoWarningDialog zones={[zone]} onConfirm={onConfirm} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByTestId('eco-warning-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('closes on Escape key', () => {
    const onCancel = vi.fn()
    render(
      <EcoWarningDialog zones={[zone]} onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders multiple zones when provided', () => {
    const zone2: EnvironmentalZoneFeature = {
      ...zone,
      properties: { ...zone.properties, id: 'zone-test-2', title: 'Zone test 2' },
    }
    render(
      <EcoWarningDialog
        zones={[zone, zone2]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByTestId('eco-warning-zone-zone-test')).toBeDefined()
    expect(screen.getByTestId('eco-warning-zone-zone-test-2')).toBeDefined()
  })
})

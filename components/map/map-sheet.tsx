'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Drawer } from 'vaul'
import { useMapStore } from '@/stores/map-store'
import { mockBoulders } from '@/lib/data/mock-boulders'
import type { BoulderProperties } from '@/lib/data/mock-boulders'
import { BoulderDetail } from './boulder-detail'

/** Find a boulder feature by its ID */
function findBoulder(id: string): { properties: BoulderProperties; coordinates: [number, number] } | null {
  const feature = mockBoulders.features.find((f) => f.properties.id === id)
  if (!feature) return null
  return {
    properties: feature.properties,
    coordinates: feature.geometry.coordinates as [number, number],
  }
}

export function MapSheet() {
  const selectedFeatureId = useMapStore((s) => s.selectedFeatureId)
  const selectFeature = useMapStore((s) => s.selectFeature)
  const prevIdRef = useRef<string | null>(null)

  const isOpen = selectedFeatureId !== null
  const boulder = selectedFeatureId ? findBoulder(selectedFeatureId) : null

  /** Handle open state changes from the drawer */
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        selectFeature(null)
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/')
        }
      }
    },
    [selectFeature]
  )

  /** Update URL when a new boulder is selected */
  useEffect(() => {
    if (selectedFeatureId && selectedFeatureId !== prevIdRef.current) {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/?bloc=${selectedFeatureId}`)
      }
    }
    prevIdRef.current = selectedFeatureId
  }, [selectedFeatureId])

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-30 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-xl outline-none"
        >
          {/* Accessible title (visually hidden) */}
          <Drawer.Title className="sr-only">
            {boulder ? `Fiche détail : ${boulder.properties.name}` : 'Détail bloc'}
          </Drawer.Title>

          {/* Drag handle */}
          <div className="flex shrink-0 justify-center py-3">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {boulder && (
              <BoulderDetail
                properties={boulder.properties}
                coordinates={boulder.coordinates}
                isExpanded={true}
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

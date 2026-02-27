'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/lib/hooks/use-theme'

const MapContainer = dynamic(
  () => import('@/components/map/map-container').then((mod) => mod.MapContainer),
  { ssr: false }
)

export default function Home() {
  const { resolvedTheme } = useTheme()

  return (
    <main className="h-[calc(100vh-57px)]">
      <MapContainer theme={resolvedTheme} />
    </main>
  )
}

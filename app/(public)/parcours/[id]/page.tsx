'use client'

import { use } from 'react'
import { useCustomRouteStore } from '@/stores/custom-route-store'
import { RouteDetail } from '@/components/routes/route-detail'

export default function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const route = useCustomRouteStore((s) => s.routes.find((r) => r.id === id))

  if (!route) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Parcours introuvable.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <RouteDetail route={route} />
    </main>
  )
}

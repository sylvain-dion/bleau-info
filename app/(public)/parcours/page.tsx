import type { Metadata } from 'next'
import { RouteList } from '@/components/routes/route-list'

export const metadata: Metadata = {
  title: 'Mes parcours — Bleau.info',
  description:
    'Créez et gérez vos parcours personnalisés de blocs à Fontainebleau.',
}

export default function ParcourPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <RouteList />
    </main>
  )
}

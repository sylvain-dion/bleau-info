import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { CallsFeed } from '@/components/calls/calls-feed'

export const metadata: Metadata = {
  title: 'Grimpons ensemble | Bleau.info',
  description:
    'Liste des appels publics pour grimper ensemble à Fontainebleau. Lance ton propre appel ou rejoins celui d\'un autre grimpeur.',
}

export default function GrimponsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Accueil
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Grimpons ensemble
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tous les appels publics à grimper en cours. Lance le tien ou
              rejoins une sortie qui te tente.
            </p>
          </div>
        </div>
      </div>

      <CallsFeed title="Appels en cours" />
    </main>
  )
}

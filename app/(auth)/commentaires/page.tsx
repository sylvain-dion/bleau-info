'use client'

import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { CommentsSection } from '@/components/profile/comments-section'

/**
 * My Comments page — lists all comments by the current user,
 * grouped by boulder, sorted by date (newest first).
 */
export default function CommentairesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/profil"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Profil
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Mes commentaires
          </h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez tous vos commentaires laissés sur les blocs
          </p>
        </div>
      </div>

      <CommentsSection />
    </main>
  )
}

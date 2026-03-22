'use client'

import { useState } from 'react'
import { Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuditLogStore } from '@/stores/audit-log-store'

/**
 * Collapsible section showing auto-validated submissions.
 *
 * Lets moderators review items that bypassed the queue because
 * the author was a trusted user.
 */
export function AutoValidationHistory() {
  const autoApproved = useAuditLogStore((s) => s.getAutoApproved())
  const [isExpanded, setIsExpanded] = useState(false)

  if (autoApproved.length === 0) return null

  const displayed = isExpanded ? autoApproved : autoApproved.slice(0, 3)

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Auto-validations
          </h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {autoApproved.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div className="mt-3 space-y-2">
        {displayed.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {entry.boulderName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {entry.submissionType === 'draft' ? 'Création' : 'Modification'}
                {' · '}
                {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Publication instantanée
            </span>
          </div>
        ))}
      </div>

      {autoApproved.length > 3 && !isExpanded && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          +{autoApproved.length - 3} autres
        </p>
      )}
    </div>
  )
}

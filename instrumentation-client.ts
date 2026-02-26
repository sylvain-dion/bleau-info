import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  // Sample 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // No Replay or Feedback integrations to keep bundle small (NFR-01)
  integrations: [],

  // Strip PII before sending to Sentry (AC #3: anonymized user context)
  beforeSend(event) {
    if (event.user) {
      delete event.user.email
      delete event.user.username
      delete event.user.ip_address
    }
    return event
  },
})

// Instrument App Router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

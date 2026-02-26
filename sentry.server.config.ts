import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate: 0.1,

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

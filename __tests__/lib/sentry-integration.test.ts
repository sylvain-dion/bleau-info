import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}))

describe('Sentry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('instrumentation', () => {
    it('should export register function', async () => {
      const mod = await import('@/instrumentation')
      expect(typeof mod.register).toBe('function')
    })

    it('should export onRequestError', async () => {
      const mod = await import('@/instrumentation')
      expect(mod.onRequestError).toBeDefined()
    })
  })

  describe('client config beforeSend', () => {
    it('should strip PII from user context', async () => {
      const { init } = await import('@sentry/nextjs')
      await import('../../instrumentation-client')

      const initCall = vi.mocked(init).mock.calls[0]?.[0]
      expect(initCall).toBeDefined()

      const beforeSend = initCall?.beforeSend
      expect(beforeSend).toBeDefined()

      if (beforeSend) {
        const event = {
          user: {
            id: '123',
            email: 'test@example.com',
            username: 'testuser',
            ip_address: '192.168.1.1',
          },
          exception: { values: [{ type: 'Error', value: 'test' }] },
        } as Parameters<typeof beforeSend>[0]

        const result = beforeSend(event, {} as Parameters<typeof beforeSend>[1])

        // PII should be stripped
        expect((result as typeof event)?.user?.email).toBeUndefined()
        expect((result as typeof event)?.user?.username).toBeUndefined()
        expect((result as typeof event)?.user?.ip_address).toBeUndefined()
        // Anonymous ID should remain
        expect((result as typeof event)?.user?.id).toBe('123')
      }
    })
  })

  describe('server config beforeSend', () => {
    it('should strip PII from user context', async () => {
      const { init } = await import('@sentry/nextjs')
      await import('../../sentry.server.config')

      const initCall = vi.mocked(init).mock.calls[0]?.[0]
      expect(initCall).toBeDefined()

      const beforeSend = initCall?.beforeSend
      expect(beforeSend).toBeDefined()

      if (beforeSend) {
        const event = {
          user: {
            id: '456',
            email: 'server@example.com',
            username: 'serveruser',
            ip_address: '10.0.0.1',
          },
          exception: { values: [{ type: 'Error', value: 'test' }] },
        } as Parameters<typeof beforeSend>[0]

        const result = beforeSend(event, {} as Parameters<typeof beforeSend>[1])

        expect((result as typeof event)?.user?.email).toBeUndefined()
        expect((result as typeof event)?.user?.username).toBeUndefined()
        expect((result as typeof event)?.user?.ip_address).toBeUndefined()
        expect((result as typeof event)?.user?.id).toBe('456')
      }
    })
  })
})

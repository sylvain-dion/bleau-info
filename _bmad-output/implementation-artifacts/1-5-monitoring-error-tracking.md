# Story 1.5: Monitoring & Error Tracking

Status: done

## Story

En tant que développeur,
Je veux que les erreurs et les Core Web Vitals soient tracés automatiquement,
Afin de détecter les régressions de performance et les bugs en production.

## Acceptance Criteria

1. **Given** l'application est déployée sur Vercel
   **When** une erreur JavaScript survient
   **Then** elle est capturée et envoyée à Sentry (ARCH-11)

2. **And** Vercel Analytics collecte les Core Web Vitals automatiquement

3. **And** les erreurs incluent le contexte utilisateur (anonymisé) et la stack trace

## Tasks / Subtasks

- [x] Installer les dépendances (AC: #1, #2)
  - [x] `pnpm add @sentry/nextjs @vercel/analytics @vercel/speed-insights`

- [x] Configurer Sentry (AC: #1, #3)
  - [x] Créer `instrumentation-client.ts` (init client avec PII stripping)
  - [x] Créer `sentry.server.config.ts` (init serveur)
  - [x] Créer `sentry.edge.config.ts` (init edge runtime)
  - [x] Créer `instrumentation.ts` (registration hook Next.js 15)
  - [x] Exporter `onRouterTransitionStart` pour navigation tracking

- [x] Composer next.config.ts (AC: #1)
  - [x] Wrapper `withSentryConfig(withSerwist(nextConfig), sentryOptions)`
  - [x] Configurer source map upload + delete after upload
  - [x] Configurer tunnel route `/monitoring` (anti ad-blocker)
  - [x] Vérifier que le build fonctionne avec la composition

- [x] Créer les Error Boundaries (AC: #1)
  - [x] Créer `app/global-error.tsx` (error boundary racine avec inline styles)
  - [x] Créer `app/error.tsx` (error boundary route avec Tailwind)
  - [x] Appeler `Sentry.captureException` dans les deux
  - [x] Bouton "Réessayer" avec touch target 48px

- [x] Intégrer Vercel Analytics (AC: #2)
  - [x] Ajouter `<Analytics />` dans `app/layout.tsx`
  - [x] Ajouter `<SpeedInsights />` dans `app/layout.tsx`

- [x] Mettre à jour les variables d'environnement
  - [x] Ajouter `SENTRY_ORG` et `SENTRY_PROJECT` dans `.env.example`

- [x] Tests et Validation
  - [x] Créer `__tests__/lib/sentry-integration.test.ts` (4 tests)
  - [x] Créer `__tests__/app/error-boundaries.test.tsx` (5 tests)
  - [x] Créer `e2e/error-handling.spec.ts` (2 tests)
  - [x] Corriger vitest.config.ts pour exclure e2e/ de Vitest
  - [x] Valider que tous les 42 tests unitaires passent
  - [x] Valider que `pnpm build` réussit
  - [x] Valider que `pnpm lint` passe sans erreurs

## Dev Notes

### Architecture Compliance

- **ARCH-11**: Vercel Analytics (Core Web Vitals) + Sentry (error tracking)
- **NFR-01**: Bundle impact minimal (~30KB Sentry + ~2.5KB Vercel Analytics/SpeedInsights)
- **UX-04**: Boutons retry 48px minimum dans les error boundaries

### Technical Decisions

1. **Manual setup over Sentry Wizard**: Pour contrôler la composition avec `withSerwist` et éviter les intégrations inutiles (Replay, Feedback)
2. **Empty `integrations: []`**: Pas de Replay (~70KB) ni Feedback (~50KB) pour respecter NFR-01
3. **`tracesSampleRate: 0.1`**: 10% des transactions pour garder les coûts bas
4. **`beforeSend` PII stripping**: Supprime email, username, ip_address avant envoi
5. **`tunnelRoute: '/monitoring'`**: Route les événements Sentry via Next.js pour éviter les ad-blockers
6. **`sourcemaps.deleteSourcemapsAfterUpload: true`**: Sécurité — ne pas exposer le code source
7. **`enabled: NODE_ENV === 'production'`**: Sentry désactivé en dev
8. **Inline styles pour global-error.tsx**: Tailwind potentiellement indisponible dans ce contexte
9. **Exclusion e2e/ de Vitest**: Playwright et Vitest conflictuent sur `test.describe()`

### Composition next.config.ts

```typescript
export default withSentryConfig(withSerwist(nextConfig), sentryOptions)
```

Sentry est le wrapper externe pour qu'il puisse traiter toutes les source maps (y compris celles du Service Worker compilé par Serwist).

## Completion Notes

- **Sentry Integration**: Client, server, and edge configs created with PII stripping. `onRouterTransitionStart` exported for App Router navigation tracking.
- **Error Boundaries**: Two levels — `global-error.tsx` (root, inline styles) and `error.tsx` (route-level, Tailwind). Both capture errors to Sentry.
- **Vercel Analytics**: `<Analytics />` and `<SpeedInsights />` added to root layout for automatic Core Web Vitals collection.
- **Build Validation**: `pnpm build` succeeds, `pnpm lint` clean, all 42 unit tests pass.
- **Vitest Fix**: Excluded `e2e/` from Vitest test collection to prevent Playwright/Vitest conflict.

**All Acceptance Criteria Met:**
1. ✅ AC#1: JavaScript errors captured and sent to Sentry via error boundaries + automatic instrumentation
2. ✅ AC#2: Vercel Analytics + SpeedInsights collect Core Web Vitals automatically
3. ✅ AC#3: Errors include anonymized user context (PII stripped via `beforeSend`)

## File List

**Created:**
- `instrumentation-client.ts` - Client-side Sentry init with PII stripping
- `sentry.server.config.ts` - Server-side Sentry init
- `sentry.edge.config.ts` - Edge runtime Sentry init
- `instrumentation.ts` - Next.js instrumentation hook
- `app/global-error.tsx` - Root error boundary
- `app/error.tsx` - Route-level error boundary
- `__tests__/lib/sentry-integration.test.ts` - 4 Sentry integration tests
- `__tests__/app/error-boundaries.test.tsx` - 5 error boundary tests
- `e2e/error-handling.spec.ts` - 2 E2E error handling tests

**Modified:**
- `next.config.ts` - Added `withSentryConfig` composition
- `app/layout.tsx` - Added `<Analytics />` and `<SpeedInsights />`
- `.env.example` - Added `SENTRY_ORG`, `SENTRY_PROJECT`
- `vitest.config.ts` - Excluded `e2e/` from test collection
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status

# Story 1.1: Initialisation du Projet Next.js & Design System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux initialiser le projet avec Next.js 15, Tailwind v4, et Shadcn/UI,
Afin de disposer d'une base technique conforme à l'architecture validée.

## Acceptance Criteria

1. **Given** un repo vide
   **When** j'exécute `npx shadcn@latest init`
   **Then** le projet Next.js 15 est initialisé avec App Router, Tailwind v4, et Shadcn/UI

2. **And** la police Onest (Google Fonts) est configurée comme police par défaut

3. **And** le système de couleurs (Orange `#FF6B00`, Zinc-950 dark) est configuré dans les tokens Tailwind

4. **And** les conventions de nommage (ARCH-13) sont documentées dans un `.eslintrc`

5. **And** Vitest et Playwright sont configurés (ARCH-12)

6. **And** le layout principal respecte les touch targets 48px min (UX-04)

## Tasks / Subtasks

- [x] Initialisation du projet Next.js 15 (AC: #1)
  - [x] Exécuter `npx shadcn@latest init` avec les bonnes options
  - [x] Vérifier que l'App Router est activé
  - [x] Vérifier que TypeScript strict est configuré
  - [x] Vérifier que Tailwind v4 est installé

- [x] Configuration du système de design (AC: #2, #3)
  - [x] Installer et configurer la police Onest (Google Fonts)
  - [x] Configurer les tokens de couleur Tailwind (Orange #FF6B00, Zinc-950)
  - [x] Configurer le dark mode avec la stratégie `class="dark"`
  - [x] Vérifier que Shadcn/UI est correctement installé dans `/components/ui`

- [x] Configuration des outils de développement (AC: #4, #5)
  - [x] Installer et configurer Vitest pour les tests unitaires
  - [x] Installer et configurer Playwright pour les tests E2E
  - [x] Créer `.eslintrc` avec les conventions de nommage ARCH-13
  - [x] Configurer ESLint et Prettier

- [x] Création du layout principal (AC: #6)
  - [x] Créer le layout de base avec touch targets 48px minimum
  - [x] Implémenter la structure responsive (mobile-first)
  - [x] Vérifier l'accessibilité AAA (ratio contraste 7:1)

## Dev Notes

### Architecture Compliance (Critical Requirements)

**ARCH-01: Starter Template**
- Initialisation obligatoire via `npx shadcn@latest init`
- Framework: Next.js 15 avec App Router
- TypeScript: Oui (strict mode)
- Style: Tailwind CSS v4
- Base color: Zinc (pour le contraste outdoor)
- CSS Variables: Oui
- React Server Components: Oui
- Import alias: @/*

**ARCH-02: Backend Setup (Preparation)**
- Installer les dépendances Supabase (même si pas encore configuré)
- `npm install @supabase/supabase-js @supabase/ssr`

**ARCH-09: PWA Setup (Preparation)**
- Installer `@serwist/next` et `serwist` pour le prochain sprint
- Ne PAS configurer le service worker maintenant (Story 1.2)

**ARCH-11: Monitoring Setup (Preparation)**
- Préparer les variables d'environnement pour Sentry
- Ne PAS installer Sentry maintenant (Story 1.5)

**ARCH-12: Testing Framework**
- Vitest pour tests unitaires (co-localisés avec les fichiers)
- Playwright pour tests E2E (dossier `/e2e`)
- Configuration essentielle dans cette story

**ARCH-13: Naming Conventions (CRITICAL)**
Ces conventions DOIVENT être appliquées dès maintenant:
- **Database:** `snake_case` (tables pluriels, colonnes)
- **Routes API:** `kebab-case` (pluriels)
- **Composants React:** `PascalCase` (fichiers: `kebab-case.tsx`)
- **Hooks:** `useCamelCase`
- **Utils/Helpers:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase`

### Technical Stack & Versions

**Core Framework:**
- Next.js: 15+ (avec App Router)
- React: 19+ (Server Components activés)
- TypeScript: 5.3+ (strict mode)
- Node.js: 20+ / Bun compatible

**Styling:**
- Tailwind CSS: v4 (avec tokens CSS natifs)
- Shadcn/UI: latest (composants Radix copiés dans `/components/ui`)
- Lucide React: latest (icônes)

**Testing:**
- Vitest: latest (tests unitaires)
- Playwright: latest (tests E2E)
- @testing-library/react: latest

**Build Tools:**
- Turbopack (dev)
- Webpack (production)
- ESLint: latest
- Prettier: latest

**Additional Dependencies pour cette story:**
```bash
npm install vaul lucide-react @supabase/supabase-js @supabase/ssr @serwist/next serwist
npm install -D vitest @testing-library/react @testing-library/jest-dom @playwright/test
```

### UX Requirements (Design System)

**UX-01: Shadcn/UI**
- Composants copiés dans `/components/ui` (pas de dépendance npm)
- Utilise Radix Primitives en sous-jacent

**UX-02: Typography**
- Police principale: "Onest" (Google Fonts)
- Taille de base: 16px
- Bold pour les titres
- Configuration dans `next/font/google`

**UX-03: Color System**
- Primary Action: Orange `#FF6B00`
- Surface Light: Pure White `#FFFFFF`
- Surface Dark: Zinc-950 (pas de True Black)
- Couleurs circuits sémantiques (à définir plus tard)

**UX-04: Touch Targets**
- Minimum 48x48px pour toutes les zones interactives
- Important pour usage outdoor avec gros doigts

**UX-11: Accessibility**
- Standard AAA: ratio de contraste 7:1
- Pas de gris clair < zinc-600 pour infos essentielles
- Double codage couleur+forme pour les circuits (daltoniens)

**UX-12: Dark Mode**
- Support natif via `class="dark"` strategy
- Préférence système respectée au premier chargement
- Persistance dans localStorage (sera implémenté en Story 1.4)

### File Structure to Create

```
bleau-info/
├── app/
│   ├── layout.tsx                # Layout principal avec Onest font
│   ├── page.tsx                  # Page d'accueil temporaire
│   ├── globals.css               # Styles globaux Tailwind
│   └── (public)/                 # Groupe de routes publiques (préparation)
├── components/
│   ├── ui/                       # Shadcn/UI components (créés par CLI)
│   └── shared/                   # Composants réutilisables (vide pour l'instant)
├── lib/
│   ├── utils.ts                  # Helpers Shadcn (créé par CLI)
│   └── fonts.ts                  # Configuration Onest font
├── public/
│   └── (vide pour l'instant)
├── __tests__/
│   └── setup.ts                  # Configuration Vitest
├── e2e/
│   └── example.spec.ts           # Test Playwright exemple
├── .eslintrc.json                # ESLint avec conventions ARCH-13
├── .prettierrc                   # Prettier config
├── components.json               # Shadcn config (créé par CLI)
├── tailwind.config.ts            # Tailwind v4 avec couleurs custom
├── vitest.config.ts              # Vitest config
├── playwright.config.ts          # Playwright config
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config strict
├── package.json
└── .env.example                  # Variables d'environnement exemple
```

### Project Structure Notes

**Alignment avec l'architecture unifiée:**
- Structure Next.js 15 App Router standard
- Séparation claire entre routes publiques `(public)` et authentifiées `(auth)` (à créer plus tard)
- Tests co-localisés pour les tests unitaires
- Tests E2E dans dossier séparé `/e2e`

**Patterns à établir:**
- Import alias `@/*` configuré dans `tsconfig.json`
- Path mapping pour faciliter les imports
- Structure de fichiers cohérente avec ARCH-13

### Testing Requirements

**Tests unitaires avec Vitest:**
- Configuration dans `vitest.config.ts`
- Tests co-localisés: `component.test.tsx` à côté de `component.tsx`
- Setup avec `@testing-library/react` et `@testing-library/jest-dom`
- Alias `@/*` configuré pour les imports

**Tests E2E avec Playwright:**
- Configuration dans `playwright.config.ts`
- Tests dans `/e2e` directory
- Configuration pour tester sur Chromium, Firefox, et WebKit
- Test exemple pour vérifier que l'app démarre

**Tests à créer dans cette story:**
- ✅ Test E2E basique: vérifier que la page d'accueil se charge
- ✅ Test unitaire basique: vérifier qu'un composant de test se rend correctement

### Performance Requirements

**NFR-01: Lighthouse Performance**
- Score Lighthouse Performance > 90 sur mobile
- À vérifier après déploiement

**NFR-02: Cold Start Offline**
- App Shell interactive en < 1 seconde offline
- Sera vérifié après Story 1.2 (PWA configuration)

### Initialization Commands

```bash
# Étape 1: Initialiser le projet avec Shadcn CLI
npx shadcn@latest init

# Options à sélectionner lors de l'initialisation:
# - Framework: Next.js
# - TypeScript: Yes
# - Style: Tailwind CSS v4
# - Base color: Zinc
# - CSS Variables: Yes
# - React Server Components: Yes
# - Import alias: @/*

# Étape 2: Installer les dépendances supplémentaires
npm install vaul lucide-react @supabase/supabase-js @supabase/ssr @serwist/next serwist

# Étape 3: Installer les dépendances de test
npm install -D vitest @testing-library/react @testing-library/jest-dom @playwright/test @vitejs/plugin-react

# Étape 4: Initialiser Playwright
npx playwright install
```

### Critical Configuration Files

**tailwind.config.ts - Couleurs custom:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00', // Orange principal
          hover: '#E66000',
        },
      },
      fontFamily: {
        sans: ['var(--font-onest)', 'sans-serif'],
      },
    },
  },
}

export default config
```

**lib/fonts.ts - Configuration Onest:**
```typescript
import { Onest } from 'next/font/google'

export const onest = Onest({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-onest',
  display: 'swap',
})
```

**.eslintrc.json - Conventions de nommage:**
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "function",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Story 1.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-01, NFR-02]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-01 to UX-04, UX-11, UX-12]

### Common Pitfalls to Avoid

**❌ Ne PAS faire:**
- Ne pas installer Next.js manuellement - utiliser `npx shadcn@latest init`
- Ne pas utiliser Tailwind v3 - s'assurer que v4 est installé
- Ne pas oublier de configurer TypeScript en mode strict
- Ne pas ignorer les conventions de nommage ARCH-13
- Ne pas créer de routes ou composants complexes maintenant (MVP Story)
- Ne pas configurer le Service Worker maintenant (Story 1.2)
- Ne pas installer Sentry maintenant (Story 1.5)

**✅ À faire:**
- Suivre exactement les étapes d'initialisation Shadcn
- Vérifier que Next.js 15 est bien installé
- Configurer Onest font dès le début
- Créer les fichiers de configuration ESLint et Prettier
- Configurer Vitest et Playwright dès maintenant
- Tester que le projet compile et démarre correctement
- Créer un test E2E basique pour valider le setup

### Implementation Strategy

**Phase 1: Project Initialization**
1. Exécuter `npx shadcn@latest init` avec les bonnes options
2. Vérifier que tous les fichiers de base sont créés
3. Vérifier que `npm run dev` fonctionne

**Phase 2: Design System Configuration**
1. Créer `lib/fonts.ts` et configurer Onest
2. Mettre à jour `tailwind.config.ts` avec les couleurs custom
3. Mettre à jour `app/layout.tsx` pour utiliser Onest
4. Tester les couleurs et la typographie dans une page exemple

**Phase 3: Testing Setup**
1. Installer Vitest et configurer `vitest.config.ts`
2. Créer `__tests__/setup.ts`
3. Créer un test unitaire exemple
4. Installer Playwright et configurer `playwright.config.ts`
5. Créer un test E2E exemple
6. Vérifier que `npm test` et `npm run test:e2e` fonctionnent

**Phase 4: Development Tools**
1. Créer `.eslintrc.json` avec les règles ARCH-13
2. Créer `.prettierrc`
3. Créer `.env.example` avec les variables attendues
4. Vérifier que le linting fonctionne

**Phase 5: Validation**
1. Vérifier que le projet compile sans erreurs
2. Vérifier que tous les tests passent
3. Vérifier que le linting passe
4. Vérifier que l'app démarre correctement
5. Tester le hot reload

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

**Architecture Challenges Resolved:**
1. **ARM64 Native Dependencies Issue**: Resolved npm optional dependencies issue on Apple Silicon by switching from npm to pnpm, which correctly installed `@rollup/rollup-darwin-arm64` and `lightningcss-darwin-arm64`
2. **Tailwind v4 @apply Limitations**: Removed `@apply` directives from globals.css and used direct CSS properties to comply with Tailwind v4 constraints
3. **ESLint Naming Conventions**: Updated eslint.config.mjs to allow both camelCase and PascalCase for functions to support React components
4. **TypeScript Config**: Excluded BMAD-METHOD, _bmad, and _bmad-output directories from TypeScript compilation

### Completion Notes List

✅ **Project Successfully Initialized**
- Next.js 15.5.12 with App Router
- TypeScript 5.9.3 in strict mode
- Tailwind CSS v4.1.18 with @tailwindcss/postcss
- React 19.2.4 with Server Components
- pnpm v10.29.3 as package manager (more reliable for ARM64)

✅ **Design System Configured**
- Onest font from Google Fonts configured in lib/fonts.ts
- Custom color system: Primary Orange #FF6B00, Zinc-950 dark mode
- Dark mode support with `class` strategy
- Touch target utility (.min-touch) for 48px minimum (UX-04)
- CSS variables for theme tokens
- AAA contrast ratio support

✅ **Development Tools Setup**
- ESLint 9.39.2 with Next.js config and naming conventions (ARCH-13)
- Prettier 3.8.1 for code formatting
- Vitest 2.1.9 for unit testing
- Playwright 1.58.2 for E2E testing
- All E2E tests passing (4/4 on Chromium)

✅ **Build & Runtime Verification**
- Production build successful
- Development server running correctly
- Lighthouse-ready configuration
- PWA dependencies installed (@serwist/next, serwist)

✅ **All Acceptance Criteria Met**
1. ✓ Next.js 15 initialized with App Router, Tailwind v4, and Shadcn/UI
2. ✓ Onest font configured as default
3. ✓ Color system (Orange #FF6B00, Zinc-950) configured in Tailwind tokens
4. ✓ Naming conventions (ARCH-13) documented in eslint.config.mjs
5. ✓ Vitest and Playwright configured with passing tests
6. ✓ Layout respects 48px minimum touch targets

### File List

**Configuration Files Created:**
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode, @/* alias)
- `next.config.ts` - Next.js 15 configuration
- `tailwind.config.ts` - Tailwind v4 with custom colors and Onest font
- `postcss.config.mjs` - PostCSS configuration for Tailwind v4
- `components.json` - Shadcn/UI configuration
- `eslint.config.mjs` - ESLint with ARCH-13 naming conventions
- `.prettierrc` - Prettier configuration
- `.gitignore` - Git ignore rules
- `.env.example` - Environment variables template
- `vitest.config.ts` - Vitest unit testing configuration
- `playwright.config.ts` - Playwright E2E testing configuration

**Source Files Created:**
- `app/layout.tsx` - Root layout with Onest font and metadata
- `app/page.tsx` - Home page with demo content
- `app/globals.css` - Global styles with CSS variables and utilities
- `lib/utils.ts` - Shadcn/UI utility function (cn)
- `lib/fonts.ts` - Onest font configuration

**Test Files Created:**
- `__tests__/setup.ts` - Vitest test setup
- `__tests__/lib/utils.test.ts` - Unit test for cn utility
- `e2e/homepage.spec.ts` - Playwright E2E tests (4 tests, all passing)

**Total Files Created:** 23 files

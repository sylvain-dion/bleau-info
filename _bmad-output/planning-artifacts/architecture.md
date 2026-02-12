---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-Bleau-info-2026-01-20.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'architecture'
project_name: 'Bleau-info'
user_name: 'Sdion'
date: '2026-01-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
*   **Offline-First Core:** Complete map and topo functionality without network using IndexedDB/Service Workers.
*   **Vector Interaction (The "Vector Log"):** Touch-based drawing on photos with "Loupe" assistance and Bézier smoothing.
*   **Geo-Spatial Navigation:** High-performance vector map with clustering, filtering, and seamless zoom levels (Forest -> Boulder -> Line).
*   **Smart Sync:** Background synchronization of local changes when network allows.
*   **Social Trust:** User contribution system with moderation/trust levels.

**Non-Functional Requirements:**
*   **Performance:** "Zero-latency" feeling (<100ms response) for all UI interactions. Map rendering must stay at 60fps even with 1000+ markers.
*   **Accessibility:** AAA Contrast ratio constraints for "Outdoor" usage (Plein Soleil).
*   **Device Support:** Broad Android/iOS support, including mid-range devices (rendering efficiency).
*   **Battery Efficiency:** Critical for all-day outdoor usage (minimize GPS/Radio usage).

**Scale & Complexity:**
*   **Primary Domain:** Offline-First PWA / Geo-Spatial / Social Graph.
*   **Complexity Level:** **High**. The combination of Vector Maps + Offline Logic + Canvas Drawing pushes the browser limits.
*   **Estimated Architectural Components:** ~20 (Map Engine, DB Layer, Sync Engine, Canvas Editor, UI Shell, etc.).

### Technical Constraints & Dependencies
*   **No Native Stores:** Pure Web Distribution (PWA) bypasses App Store reviews but limits access to some native APIs (though rapidly improving).
*   **Storage Limits:** Browser quotas for IndexedDB can be restrictive (~60% disk space). Strategy needed for "Eviction".
*   **Network Unreliability:** The "Forest" context implies flaky 4G/Edge or total signal loss as the default state.

### Cross-Cutting Concerns Identified
*   **State Synchronization:** How to merge local "Drafts" with server truth without conflicts.
*   **Security/Moderation:** Preventing "Graffiti" vandalism on the shared database.
*   **Theme/Contrast:** Global "High Contrast" mode management.

## Starter Template Evaluation

### Primary Technology Domain

**Progressive Web App (PWA) Offline-First avec rendu hybride (SSG/ISR + CSR)** — identifié d'après l'analyse des exigences du PRD et de la spécification UX.

### Starter Options Considered

| Critère | **Next.js 15 + @serwist/next** | **Vite React + vite-plugin-pwa** | **SvelteKit PWA** |
|---------|-------------------------------|----------------------------------|-------------------|
| **Rendering Hybride SSG/ISR** | ✅ Natif | ❌ CSR uniquement | ✅ Partiel |
| **SEO pour contenu public** | ✅ Excellent | ❌ Limité (SPA) | ✅ Bon |
| **Offline-First (Service Worker)** | ✅ Via @serwist/next | ✅ Via vite-plugin-pwa | ✅ Natif |
| **Shadcn/UI Support** | ✅ Natif | ✅ Natif | ❌ Port non officiel |
| **Tailwind CSS** | ✅ Intégré CLI | ✅ Intégré | ✅ Intégré |
| **Dev Experience (HMR)** | ⚡ Rapide (Turbopack) | ⚡⚡ Ultra-rapide (ESM) | ⚡ Rapide |
| **Complexité PWA Offline** | 🟡 Moyenne | 🟢 Simple | 🟡 Moyenne |
| **Communauté/Écosystème React** | ✅ Massif | ✅ Large | ❌ Différent |

### Selected Starter: Next.js 15 + Tailwind + Shadcn/UI

**Rationale for Selection:**

1. **SEO Critique :** Le PRD exige que les pages Secteur/Bloc soient indexables (SSG/ISR). Next.js est le seul à offrir cela nativement avec React.

2. **Rendu Hybride :** La stratégie "Public Content (SSG) + Private Content (CSR)" du PRD s'aligne parfaitement avec l'architecture Next.js App Router.

3. **Shadcn/UI Native :** Le CLI `npx shadcn@latest init` crée automatiquement un projet Next.js 15 + Tailwind, exactement comme spécifié dans le UX Design Specification.

4. **PWA via @serwist/next :** Le successeur de `next-pwa` offre une intégration propre pour l'App Router avec des stratégies de cache avancées.

5. **Maturité en Production :** Next.js 15 (avec React 19) est stable et largement adopté pour les PWA complexes.

**Initialization Command:**

```bash
# Étape 1 : Créer le projet Next.js avec Tailwind via Shadcn CLI
npx shadcn@latest init

# Options recommandées lors de l'initialisation :
# - Framework: Next.js
# - TypeScript: Yes
# - Style: Tailwind CSS v4
# - Base color: Zinc (pour le contraste outdoor)
# - CSS Variables: Yes
# - React Server Components: Yes
# - Import alias: @/*

# Étape 2 : Ajouter le support PWA
npm install @serwist/next serwist

# Étape 3 : Ajouter les dépendances UX spécifiques
npm install vaul lucide-react
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript (strict mode)
- Node.js 20+ / Bun compatible
- React 19 (Server Components)

**Styling Solution:**
- Tailwind CSS v4 avec tokens CSS natifs
- Shadcn/UI composants copiés dans `/components/ui`
- Dark Mode via `class="dark"` strategy

**Build Tooling:**
- Turbopack (dev) / Webpack (prod)
- Optimisation automatique des images (next/image)
- Code splitting automatique

**Testing Framework:**
- À configurer : Vitest + Playwright recommandés

**Code Organization:**
- App Router (`/app` directory)
- `/components/ui` pour Shadcn
- `/lib` pour utilitaires
- `/public` pour assets statiques

**Development Experience:**
- Hot Module Replacement via Turbopack
- TypeScript intellisense complet
- ESLint + Prettier pré-configurés

> **Note:** L'initialisation du projet avec cette commande sera la première story d'implémentation (Epic 0 / Story 0.1).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Base de données Backend → Supabase (PostgreSQL + PostGIS)
- Stockage Offline Client → Dexie.js (IndexedDB)
- Authentification → Supabase Auth + RLS
- Carte Vectorielle → MapLibre GL JS + Protomaps

**Important Decisions (Shape Architecture):**
- State Management → Zustand + TanStack Query
- Topo Editor → Konva.js (react-konva)
- Sync Strategy → LWW + Manual Merge (modération)
- Hosting → Vercel + Supabase Cloud

**Deferred Decisions (Post-MVP):**
- Gamification Engine (badges, leaderboards)
- Chat/Messaging infrastructure
- API publique pour partenaires

### Data Architecture

| Décision | Choix | Version | Rationale |
|----------|-------|---------|-----------|
| **Backend DB** | Supabase (PostgreSQL) | Latest | All-in-one : DB + Auth + Storage + Realtime. PostGIS pour le géospatial |
| **Client Offline** | Dexie.js | ^4.0 | API Promise élégante, requêtes performantes sur IndexedDB |
| **Sync Strategy** | LWW + Manual Merge | - | LWW pour champs simples, modération pour conflits géo/médias (PRD NFR-06) |
| **Geospatial Server** | PostGIS | Native | Requêtes proximité (doublons), bounds export |
| **Geospatial Client** | Turf.js | ^6.5 | Calculs offline dans le navigateur |

### Authentication & Security

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **Auth Provider** | Supabase Auth | Intégré, RLS native, Social Login (Google) |
| **Authorization** | Row Level Security (RLS) | Sécurité au niveau données PostgreSQL |
| **Trust System** | `role` + `trust_score` columns | Roles : Anonymous → User → Contributor → Trusted → Moderator → Admin |
| **Media Storage** | Supabase Storage | S3-compatible, RLS, transformations d'images |

### API & Communication Patterns

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **API Pattern** | Hybride Direct + Server Actions | Lectures SSG = direct. Mutations = Server Actions (validation) |
| **Realtime** | Supabase Realtime | Subscriptions pour modération collaborative |
| **Cache Strategy** | ISR + On-demand Revalidation | `revalidate: 3600` + Webhooks Supabase → `revalidatePath()` |

### Frontend Architecture

| Décision | Choix | Version | Rationale |
|----------|-------|---------|-----------|
| **UI State** | Zustand | ^4.5 | Store léger, minimal boilerplate |
| **Server State** | TanStack Query | ^5.0 | Cache Supabase, sync background, gestion offline |
| **Map Engine** | MapLibre GL JS | ^4.0 | Open-source, 60 FPS avec 1000+ markers, tiles offline |
| **Offline Tiles** | Protomaps (PMTiles) | - | Stockage compact des tuiles vectorielles |
| **Topo Editor** | Konva.js (react-konva) | ^8.0 | Canvas React-native, export SVG, touch events |

### Infrastructure & Deployment

| Décision | Choix | Rationale |
|----------|-------|-----------|
| **Frontend Hosting** | Vercel | Native Next.js, ISR, Edge Functions, tier gratuit MVP |
| **Backend Hosting** | Supabase Cloud | Managé, scaling auto, tier gratuit MVP |
| **CI/CD** | Vercel Git + GitHub Actions | Auto-deploy + Tests/Lint avant merge |
| **Monitoring** | Vercel Analytics + Sentry | Core Web Vitals + Error tracking |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project Init (Next.js + Shadcn + PWA setup)
2. Supabase Setup (DB schema + Auth + RLS)
3. Map Engine Integration (MapLibre + Protomaps)
4. Offline Layer (Dexie + Service Worker)
5. Topo Editor (Konva + Canvas)
6. Sync Engine (Background Sync + Conflict Resolution)

**Cross-Component Dependencies:**
- `Supabase` → utilisé par Auth, Data, Storage, Realtime
- `Dexie` → synced avec Supabase via custom sync logic
- `MapLibre` → consomme les données Dexie offline ou Supabase online
- `TanStack Query` → orchestrateur de cache entre Supabase et UI

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**19 points de conflits potentiels** identifiés et adressés par ces patterns pour garantir la cohérence entre les agents IA.

### Naming Patterns

#### Database Naming (Supabase/PostgreSQL)

| Élément | Convention | Exemple |
|---------|------------|---------|
| **Tables** | `snake_case`, pluriel | `boulders`, `user_ticks`, `trust_scores` |
| **Colonnes** | `snake_case` | `created_at`, `trust_score`, `boulder_id` |
| **Foreign Keys** | `{table}_id` | `user_id`, `sector_id` |
| **Indexes** | `idx_{table}_{columns}` | `idx_boulders_sector_id` |
| **Enums** | `snake_case` | `user_role`, `sync_status` |

#### API Naming (Next.js App Router)

| Élément | Convention | Exemple |
|---------|------------|---------|
| **Routes** | `kebab-case`, pluriel | `/api/boulders`, `/api/user-ticks` |
| **Params dynamiques** | `[id]` | `/api/boulders/[id]` |
| **Query params** | `camelCase` | `?sectorId=123&limit=10` |
| **Actions serveur** | `verbNoun` | `createBoulder`, `updateTick` |

#### Code Naming (TypeScript/React)

| Élément | Convention | Exemple |
|---------|------------|---------|
| **Composants** | `PascalCase` | `BoulderCard`, `MapSheet` |
| **Fichiers composants** | `kebab-case.tsx` | `boulder-card.tsx`, `map-sheet.tsx` |
| **Hooks** | `useCamelCase` | `useBoulders`, `useOfflineSync` |
| **Utils/Helpers** | `camelCase` | `formatDate`, `calculateDistance` |
| **Constants** | `UPPER_SNAKE_CASE` | `MAX_TRUST_SCORE`, `API_BASE_URL` |
| **Types/Interfaces** | `PascalCase` | `Boulder`, `UserProfile`, `SyncState` |

### Structure Patterns

#### Project Organization (Next.js App Router)

```
bleau-info/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Routes publiques (SEO/SSG)
│   │   ├── secteurs/[slug]/
│   │   └── blocs/[id]/
│   ├── (auth)/                   # Routes authentifiées
│   │   ├── profil/
│   │   ├── carnet/
│   │   └── contribution/
│   ├── api/                      # Route Handlers API
│   └── layout.tsx
├── components/
│   ├── ui/                       # Shadcn/UI (copié)
│   ├── map/                      # Composants carte
│   ├── topo/                     # Composants topo
│   └── shared/                   # Composants réutilisables
├── lib/
│   ├── supabase/                 # Client + helpers
│   ├── db/                       # Dexie schemas + sync
│   ├── hooks/                    # Custom hooks
│   └── utils/                    # Helpers génériques
├── stores/                       # Zustand stores
├── types/                        # TypeScript definitions
├── public/                       # Assets statiques
└── __tests__/                    # Tests (miroir structure)
```

#### Test Organization

| Type | Emplacement |
|------|-------------|
| **Tests unitaires** | Co-localisés : `boulder-card.test.tsx` |
| **Tests d'intégration** | `__tests__/integration/` |
| **Tests E2E** | `e2e/` (Playwright) |

### Format Patterns

#### API Response Structure

```typescript
// Succès
{ data: T, meta?: { count?, page?, nextCursor? } }

// Erreur
{ error: { code: string, message: string, details?: unknown } }
```

#### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Succès GET/PUT |
| `201` | Création (POST) |
| `204` | Suppression (DELETE) |
| `400` | Validation error |
| `401` | Non authentifié |
| `403` | Non autorisé |
| `404` | Not found |
| `409` | Conflict (sync) |
| `500` | Server error |

#### Data Format Conventions

| Élément | Convention |
|---------|------------|
| **JSON fields** | `camelCase` (auto-transform from `snake_case`) |
| **Dates** | ISO 8601 : `"2026-02-03T11:20:00Z"` |
| **IDs** | UUID strings |
| **Booleans** | `true` / `false` (never `1` / `0`) |
| **Coordinates** | `{ lat: number, lng: number }` client |
| **PostGIS** | `POINT(lng lat)` server |

### Communication Patterns

#### State Management (Zustand)

```typescript
interface Store {
  // État
  activeBoulderId: string | null;
  drawingMode: 'idle' | 'drawing' | 'editing';
  
  // Actions: set*, toggle*, reset*
  setActiveBoulderId: (id: string | null) => void;
  toggleSidePanel: () => void;
  resetDrawingMode: () => void;
}
```

#### Query Keys (TanStack Query)

```typescript
const queryKeys = {
  boulders: {
    all: ['boulders'] as const,
    list: (filters) => [...queryKeys.boulders.all, 'list', filters],
    detail: (id) => [...queryKeys.boulders.all, 'detail', id],
  },
};
```

#### Sync Status States

```typescript
type SyncStatus = 
  | 'synced'    // En phase avec serveur
  | 'pending'   // Modification locale
  | 'syncing'   // Upload en cours
  | 'conflict'  // Modération requise
  | 'error';    // Échec sync
```

### Process Patterns

#### Optimistic UI Pattern

```typescript
const handleAction = async () => {
  // 1. Update UI immédiatement
  updateLocalState();
  showSuccessFeedback();
  
  // 2. Sync background
  try {
    await syncToServer();
  } catch (error) {
    if (!isOffline) rollbackLocalState();
  }
};
```

#### Error Handling Strategy

| Niveau | Handling |
|--------|----------|
| **Réseau** | Toast discret + retry auto |
| **Validation** | Inline sur formulaire |
| **Auth** | Redirect + message |
| **Critique** | Error Boundary + Sentry |

#### Validation Strategy

| Moment | Méthode |
|--------|---------|
| **Client (form)** | Zod + React Hook Form |
| **Server (action)** | Zod (mêmes schemas) |
| **Database** | PostgreSQL constraints + RLS |

### Enforcement Guidelines

**Tous les agents IA DOIVENT :**
- Suivre les conventions de nommage exactement comme spécifié
- Placer les fichiers dans les dossiers appropriés selon la structure
- Utiliser le format de réponse API standard pour toutes les routes
- Appliquer le pattern Optimistic UI pour les mutations
- Valider avec Zod côté client ET serveur

**Vérification des patterns :**
- ESLint rules pour le naming
- TypeScript strict pour les types
- PR review checklist incluant ces patterns

## Project Structure & Boundaries

### Requirements to Structure Mapping

| Catégorie FR | Module | Emplacement |
|--------------|--------|-------------|
| **FR-01 à FR-10** (Navigation) | Map Engine | `components/map/`, `lib/maplibre/` |
| **FR-11 à FR-20** (Topo Viewer) | Topo Module | `components/topo/`, `lib/konva/` |
| **FR-21 à FR-30** (Logging) | Carnet Module | `app/(auth)/carnet/`, `lib/db/` |
| **FR-31 à FR-40** (Contribution) | Contribution | `app/(auth)/contribution/` |
| **FR-41 à FR-50** (Social/Trust) | User Module | `app/(auth)/profil/`, `lib/supabase/` |
| **FR-51 à FR-60** (Offline) | Sync Engine | `lib/db/`, `lib/sync/`, `sw.ts` |

### Complete Project Directory Structure

```
bleau-info/
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── components.json                 # Shadcn/UI config
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Tests + Lint on PR
│       └── deploy.yml              # Vercel deploy
│
├── app/
│   ├── globals.css                 # Tailwind + Onest font
│   ├── layout.tsx                  # Root layout + providers
│   ├── manifest.ts                 # PWA manifest generator
│   ├── sw.ts                       # Service Worker (Serwist)
│   │
│   ├── (public)/                   # Routes SEO (SSG/ISR)
│   │   ├── page.tsx                # Homepage / Map
│   │   ├── secteurs/
│   │   │   ├── page.tsx            # Liste secteurs
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Secteur detail
│   │   └── blocs/
│   │       └── [id]/
│   │           └── page.tsx        # Bloc detail (SSG)
│   │
│   ├── (auth)/                     # Routes authentifiées
│   │   ├── layout.tsx              # Auth layout + guard
│   │   ├── profil/
│   │   │   └── page.tsx
│   │   ├── carnet/
│   │   │   └── page.tsx            # Personal logbook
│   │   └── contribution/
│   │       ├── page.tsx            # New boulder form
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx    # Edit boulder
│   │
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts        # OAuth callback
│       ├── revalidate/
│       │   └── route.ts            # Supabase webhook
│       └── sync/
│           └── route.ts            # Sync endpoint
│
├── components/
│   ├── ui/                         # Shadcn/UI (copié)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx              # Vaul
│   │   ├── input.tsx
│   │   ├── sonner.tsx              # Toasts
│   │   └── ...
│   │
│   ├── map/
│   │   ├── map-container.tsx       # MapLibre wrapper
│   │   ├── map-markers.tsx         # Boulder markers
│   │   ├── map-clusters.tsx        # Cluster logic
│   │   ├── map-controls.tsx        # Zoom, locate, layers
│   │   └── map-sheet.tsx           # Bottom sheet content
│   │
│   ├── topo/
│   │   ├── topo-viewer.tsx         # Photo + lines display
│   │   ├── topo-editor.tsx         # Konva canvas editor
│   │   ├── topo-line.tsx           # SVG line rendering
│   │   └── topo-loupe.tsx          # Offset loupe helper
│   │
│   ├── boulder/
│   │   ├── boulder-card.tsx        # Card in lists
│   │   ├── boulder-detail.tsx      # Full detail view
│   │   ├── boulder-tick-button.tsx # Log tick action
│   │   └── boulder-grade-badge.tsx # Grade display
│   │
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── bottom-nav.tsx          # Mobile nav
│   │   ├── side-panel.tsx          # Desktop panel
│   │   └── offline-status.tsx      # Network indicator
│   │
│   └── shared/
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       ├── empty-state.tsx
│       └── confirm-dialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   ├── middleware.ts           # Auth middleware
│   │   ├── queries/
│   │   │   ├── boulders.ts
│   │   │   ├── sectors.ts
│   │   │   └── users.ts
│   │   └── mutations/
│   │       ├── ticks.ts
│   │       └── boulders.ts
│   │
│   ├── db/
│   │   ├── dexie.ts                # Dexie instance
│   │   ├── schemas/
│   │   │   ├── boulders.ts
│   │   │   ├── sectors.ts
│   │   │   └── ticks.ts
│   │   └── sync/
│   │       ├── sync-engine.ts      # Main sync logic
│   │       ├── conflict-resolver.ts
│   │       └── queue.ts            # Pending operations
│   │
│   ├── maplibre/
│   │   ├── config.ts               # Map settings
│   │   ├── layers.ts               # Custom layers
│   │   └── sources.ts              # Tile sources
│   │
│   ├── hooks/
│   │   ├── use-boulders.ts         # TanStack Query hook
│   │   ├── use-offline.ts          # Network status
│   │   ├── use-geolocation.ts      # GPS position
│   │   └── use-haptic.ts           # Vibration feedback
│   │
│   ├── utils/
│   │   ├── cn.ts                   # Class merge helper
│   │   ├── format-date.ts
│   │   ├── format-grade.ts
│   │   └── geo.ts                  # Turf.js helpers
│   │
│   └── validations/
│       ├── boulder.ts              # Zod schemas
│       ├── tick.ts
│       └── user.ts
│
├── stores/
│   ├── ui-store.ts                 # UI state (panels, mode)
│   ├── map-store.ts                # Map state (viewport, layers)
│   └── editor-store.ts             # Topo editor state
│
├── types/
│   ├── boulder.ts
│   ├── sector.ts
│   ├── user.ts
│   ├── tick.ts
│   ├── sync.ts
│   └── supabase.ts                 # Generated types
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   ├── tiles/                      # Offline PMTiles
│   │   └── fontainebleau.pmtiles
│   └── fonts/
│       └── Onest-Variable.woff2
│
├── e2e/
│   ├── playwright.config.ts
│   └── tests/
│       ├── navigation.spec.ts
│       ├── offline.spec.ts
│       └── contribution.spec.ts
│
└── __tests__/
    ├── integration/
    │   ├── sync.test.ts
    │   └── auth.test.ts
    └── mocks/
        ├── supabase.ts
        └── dexie.ts
```

### Architectural Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Zustand   │  │  TanStack   │  │   Dexie     │              │
│  │  (UI State) │  │   Query     │  │ (IndexedDB) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │              Sync Engine (lib/db/sync/)        │              │
│  │   - Queue pending operations                   │              │
│  │   - Conflict detection                         │              │
│  │   - Background sync on network restore         │              │
│  └───────────────────────┬───────────────────────┘              │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │           Service Worker (@serwist/next)       │              │
│  │   - Cache static assets                        │              │
│  │   - Cache API responses (stale-while-revalid) │              │
│  │   - Precache PMTiles                           │              │
│  └───────────────────────┬───────────────────────┘              │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                         EDGE (Vercel)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Next.js App Router (SSG/ISR)                    ││
│  │   - (public)/ routes: Pre-rendered, cached at edge          ││
│  │   - (auth)/ routes: Dynamic, auth-protected                 ││
│  │   - api/ routes: Server Actions, webhooks                   ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │ RLS-protected queries
┌─────────────────────────────▼───────────────────────────────────┐
│                       BACKEND (Supabase)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │              │
│  │  + PostGIS  │  │ (JWT/OAuth) │  │  (S3-like)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Row Level Security (RLS)                   ││
│  │   - Anonymous: SELECT on public tables                       ││
│  │   - User: + INSERT/UPDATE own ticks                         ││
│  │   - Contributor: + INSERT boulders (status=draft)           ││
│  │   - Trusted: + UPDATE boulders (auto-approve)               ││
│  │   - Moderator: + UPDATE any, resolve conflicts              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
[User Action] 
     │
     ▼
┌──────────────┐     Optimistic Update
│   Zustand    │◄────────────────────────┐
│   UI Store   │                         │
└──────┬───────┘                         │
       │                                 │
       ▼                                 │
┌──────────────┐                         │
│   Dexie      │     Write to IndexedDB  │
│  (Offline)   │─────────────────────────┤
└──────┬───────┘                         │
       │                                 │
       ▼                                 │
┌──────────────┐                         │
│ Sync Engine  │     Queue if offline    │
│              │─────────────────────────┘
└──────┬───────┘
       │ Online?
       ▼
┌──────────────┐
│  Supabase    │     POST/PATCH via Server Action
│   Client     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │     RLS validation
│   + RLS      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Webhook    │     Trigger revalidation
│  → Vercel    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    ISR       │     Regenerate static page
│  Revalidate  │
└──────────────┘
```

### Integration Points

**Internal Communication:**
- `Zustand` ↔ `React Components` : Direct store access via hooks
- `TanStack Query` ↔ `Supabase` : Automatic cache management
- `Dexie` ↔ `Sync Engine` : Background sync queue
- `Service Worker` ↔ `App` : Cache-first for assets, network-first for API

**External Integrations:**
- `Supabase Auth` : OAuth (Google), Email/Password
- `Supabase Storage` : Photo uploads with RLS
- `Supabase Realtime` : Moderation notifications
- `Vercel` : Webhooks for ISR revalidation
- `Sentry` : Error tracking and performance monitoring

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Toutes les technologies sélectionnées sont compatibles entre elles :
- Next.js 15 + React 19 : Versions stables, compatibles
- Supabase + Next.js : Clients SSR/Client officiellement supportés
- Tailwind v4 + Shadcn/UI : Configuration native générée par CLI
- @serwist/next + App Router : Conçu spécifiquement pour App Router
- MapLibre + React : Via react-map-gl ou wrapper custom
- Dexie + TanStack Query : Pattern hybride documenté et éprouvé

**Pattern Consistency:**
Les patterns d'implémentation sont alignés avec le stack technologique :
- Conventions de nommage DB (snake_case) alignées avec Supabase/PostgreSQL
- Patterns Zustand conformes à la documentation officielle
- Query keys TanStack structurés selon best practices
- Optimistic UI compatible avec TanStack + Dexie

**Structure Alignment:**
La structure du projet supporte pleinement les décisions architecturales :
- Route groups `(public)/` et `(auth)/` pour le rendu hybride
- Dossiers dédiés pour chaque domaine (map, topo, boulder, sync)
- Séparation claire lib/stores/components/types

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| Catégorie | Couverture | Composants Architecturaux |
|-----------|------------|---------------------------|
| FR-01 à FR-10 (Navigation) | ✅ 100% | MapLibre, Protomaps, lib/maplibre/ |
| FR-11 à FR-20 (Topo Viewer) | ✅ 100% | Konva, components/topo/ |
| FR-21 à FR-30 (Logging) | ✅ 100% | Dexie, Supabase, TanStack Query |
| FR-31 à FR-40 (Contribution) | ✅ 100% | Server Actions, Zod, Supabase RLS |
| FR-41 à FR-50 (Social/Trust) | ✅ 100% | Supabase Auth, RLS policies, Realtime |
| FR-51 à FR-60 (Offline) | ✅ 100% | Dexie, Serwist, Sync Engine |

**Non-Functional Requirements Coverage:**

| NFR | Exigence | Solution Architecturale |
|-----|----------|------------------------|
| NFR-01 | Lighthouse > 90 | Next.js SSG, Vercel Edge, Tailwind static |
| NFR-02 | < 100ms UI response | Optimistic UI, Zustand, Dexie |
| NFR-03 | 60 FPS with 1000+ markers | MapLibre GL WebGL, clustering |
| NFR-04 | Offline-First | Dexie + Serwist + Background Sync |
| NFR-05 | WCAG AAA contrast | Tailwind tokens, Shadcn accessible |
| NFR-06 | Conflict resolution | LWW + Manual Merge moderation |
| NFR-07 | Battery efficiency | Service Worker precache, minimal GPS |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ Toutes les décisions critiques documentées avec versions
- ✅ Patterns d'implémentation avec exemples de code
- ✅ Règles de consistance claires et applicables
- ✅ Conventions de nommage exhaustives

**Structure Completeness:**
- ✅ 50+ fichiers/dossiers définis explicitement
- ✅ Frontières de composants documentées
- ✅ Points d'intégration mappés (internes + externes)
- ✅ Mapping FR → structure du projet

**Pattern Completeness:**
- ✅ 19 points de conflit potentiels adressés
- ✅ Patterns de state management complets
- ✅ Patterns de gestion d'erreur définis
- ✅ Patterns de validation Zod documentés

### Gap Analysis Results

**Critical Gaps:** Aucun ❌ → Aucun blocage identifié

**Nice-to-Have (Post-MVP):**
- Schema Supabase détaillé (tables, colonnes, RLS policies) → Défini dans Epics & Stories
- Configuration ESLint/Prettier exacte → Généré automatiquement par starter
- Stratégie de test détaillée → Défini dans Epic QA/Testing

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé en profondeur
- [x] Échelle et complexité évaluées (High)
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales mappées

**✅ Architectural Decisions**
- [x] Décisions critiques documentées avec versions
- [x] Stack technologique entièrement spécifié
- [x] Patterns d'intégration définis
- [x] Considérations de performance adressées

**✅ Implementation Patterns**
- [x] Conventions de nommage établies (DB, API, Code)
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de processus documentés

**✅ Project Structure**
- [x] Structure de répertoires complète définie
- [x] Frontières de composants établies
- [x] Points d'intégration mappés
- [x] Mapping requirements → structure complet

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH**

**Key Strengths:**
- Stack moderne et cohérent (Next.js 15 + Supabase + React 19)
- Architecture Offline-First robuste (Dexie + Serwist)
- Patterns clairs pour éviter les conflits entre agents IA
- Structure de fichiers complète et détaillée
- Couverture 100% des FR et NFR

**Areas for Future Enhancement:**
- Stratégie de monitoring avancée (APM, traces distribuées)
- Gamification engine (post-MVP)
- API publique pour partenaires (post-MVP)
- Chat/messaging infrastructure (post-MVP)

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre EXACTEMENT les décisions architecturales documentées
- Utiliser les patterns d'implémentation de manière CONSISTANTE
- Respecter la structure du projet et les frontières
- Référer ce document pour TOUTES les questions architecturales

**First Implementation Priority:**

```bash
# Commande d'initialisation du projet
npx shadcn@latest init

# Puis installer les dépendances PWA
npm install @serwist/next serwist vaul lucide-react
npm install @supabase/supabase-js @supabase/ssr
npm install dexie @tanstack/react-query zustand
npm install maplibre-gl react-konva konva
npm install zod react-hook-form @hookform/resolvers
npm install turf
```

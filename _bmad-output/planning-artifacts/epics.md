---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Bleau-info - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Bleau-info, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

#### FR Area 1: Core & Offline Architecture
- FR-01: L'utilisateur peut installer l'application sur son device (PWA A2HS - Add to Home Screen).
- FR-02: L'application détecte automatiquement le statut réseau (Online/Offline) et adapte l'UI.
- FR-03: L'utilisateur peut télécharger explicitement un "Pack Secteur" (Données + Images + Fond de carte) pour usage offline.
- FR-04: Le système synchronise automatiquement les données locales vers le serveur lorsque le réseau est disponible (Background Sync).
- FR-05: L'utilisateur peut vider manuellement les caches et forcer une resynchronisation complète (Hard Reset pour débogage).
- FR-06: L'utilisateur peut consulter l'espace de stockage utilisé et supprimer des packs offline individuellement.

#### FR Area 2: Exploration & Discovery
- FR-10: L'utilisateur peut visualiser une carte vectorielle interactive des secteurs et blocs.
- FR-11: L'utilisateur peut filtrer les blocs par critères multiples (Niveau, Style, Séchage, Poussette).
- FR-12: L'utilisateur peut rechercher un secteur ou un bloc par son nom (Recherche texte).
- FR-13: L'utilisateur peut consulter la fiche détaillée d'un bloc (Photo annotée, Description, Cotation, Historique).
- FR-14: L'utilisateur peut visualiser les tracés de départ/arrivée sur la photo du bloc.

#### FR Area 3: Contribution & Edition
- FR-20: L'utilisateur authentifié peut créer un nouveau bloc (Nom, Cotation, Style obligatoire).
- FR-21: L'utilisateur peut capturer ou uploader une photo pour le bloc.
- FR-22: L'utilisateur peut dessiner des annotations vectorielles (Ligne, Départ, Sortie) sur la photo. (Fallback: Image raster si limitation technique détectée).
- FR-23: L'utilisateur peut géolocaliser le bloc avec précision (GPS Device) et affiner la position sur la carte.
- FR-24: Le système sauvegarde les créations en "Brouillon Local" si offline.
- FR-25: L'utilisateur peut suggérer une modification sur un bloc existant (Wiki-like).
- FR-26: L'utilisateur peut uploader une vidéo de démonstration (Externe: YouTube/Vimeo Link ou Upload Direct compressé).

#### FR Area 4: Account & Progression
- FR-30: L'utilisateur peut créer un compte et se connecter (Email/Password + Social Auth).
- FR-31: L'utilisateur peut loguer une ascension ("Croix") avec date, style, et note personnelle.
- FR-32: L'utilisateur peut gérer des listes de blocs (Projets, Faits, Favoris).
- FR-33: L'utilisateur peut visualiser ses statistiques de progression (Graphiques temporels).
- FR-34: L'utilisateur peut ajouter des annotations textuelles sur sa timeline de stats (ex: "Blessure").
- FR-35: L'utilisateur peut configurer ses préférences de profil (Nom, Avatar, Niveau max à vue auto-déclaré).
- FR-36: L'utilisateur peut supprimer son compte et exporter ses données personnelles (Conformité GDPR).

#### FR Area 5: Quality & Moderation
- FR-40: Le système détecte et signale les doublons potentiels (Proximité géographique < 5m) lors de la création.
- FR-41: Le modérateur peut visualiser une file d'attente des nouvelles soumissions.
- FR-42: Le modérateur peut comparer les soumissions avec l'existant (Diff visuel Side-by-Side).
- FR-43: Le modérateur peut Valider, Rejeter, ou Demander des corrections sur une soumission.
- FR-44: Le système notifie l'auteur du statut de sa soumission (Validé/Rejeté).
- FR-45: Les utilisateurs "Trusted Users" (Score de confiance élevé) voient leurs modifications validées automatiquement.
- FR-46: Le modérateur peut suspendre les droits d'écriture d'un utilisateur malveillant (Ban).

### NonFunctional Requirements

- NFR-01 (Lighthouse Performance): Le score Lighthouse Performance sur mobile (émulation 4G) doit être supérieur à 90.
- NFR-02 (Cold Start Offline): L'application (App Shell) doit être interactive en moins de 1 seconde en mode Offline (démarrage depuis le cache).
- NFR-03 (Map Smoothness): La navigation sur la carte (pan/zoom) doit maintenir 50 FPS minimum avec 500 marqueurs affichés.
- NFR-04 (Battery Efficiency): L'application ne doit pas solliciter le GPS en arrière-plan (Background Location) sans action explicite de tracking, pour préserver la batterie.
- NFR-05 (Sync Reliability): Le mécanisme de synchronisation doit inclure un "Exponential Backoff Retry". Aucune donnée utilisateur ne doit être perdue silencieusement en cas d'échec réseau.
- NFR-06 (Conflict Resolution): Stratégie "Last Write Wins" pour les champs simples, et "Manual Merge" (Modération) pour les conflits géographiques ou structurels.
- NFR-07 (Data Portability): L'utilisateur doit pouvoir télécharger une archive JSON de toutes ses données sous 24h (GDPR).
- NFR-08 (Input Sanitization): Tous les uploads (Photos, Vidéos) et textes riches doivent être nettoyés (Sanitized) pour prévenir les attaques XSS et les métadonnées EXIF sensibles.

### Additional Requirements

#### From Architecture Document
- ARCH-01 (Starter Template): Initialisation via `npx shadcn@latest init` (Next.js 15 + Tailwind v4 + Shadcn/UI). Première story d'implémentation.
- ARCH-02 (Backend): Supabase (PostgreSQL + PostGIS) pour la base de données, l'authentification (Supabase Auth + RLS), et le stockage média (Supabase Storage).
- ARCH-03 (Client Offline DB): Dexie.js v4+ pour IndexedDB avec API Promise.
- ARCH-04 (Map Engine): MapLibre GL JS v4+ avec Protomaps (PMTiles) pour les tuiles offline.
- ARCH-05 (Topo Editor): Konva.js (react-konva v8+) pour le Canvas vectoriel interactif.
- ARCH-06 (State Management): Zustand v4.5+ (UI state) + TanStack Query v5+ (server state/cache).
- ARCH-07 (Sync Strategy): Last Write Wins + Manual Merge via modération. Background Sync API.
- ARCH-08 (Hosting): Vercel (frontend) + Supabase Cloud (backend). CI/CD via Vercel Git + GitHub Actions.
- ARCH-09 (PWA): @serwist/next pour le Service Worker (App Router compatible). Cache-first pour App Shell, téléchargement explicite pour packs secteur.
- ARCH-10 (Validation): Zod + React Hook Form côté client ET serveur (schemas partagés).
- ARCH-11 (Monitoring): Vercel Analytics (Core Web Vitals) + Sentry (error tracking).
- ARCH-12 (Testing): Vitest (unitaire) + Playwright (E2E). Tests co-localisés.
- ARCH-13 (Naming Conventions): snake_case pour DB, kebab-case pour routes, PascalCase pour composants, camelCase pour hooks/utils.
- ARCH-14 (API Pattern): Hybride Direct + Server Actions. Réponse standard `{ data, meta? }` / `{ error: { code, message } }`.
- ARCH-15 (Realtime): Supabase Realtime pour la modération collaborative.
- ARCH-16 (ISR): `revalidate: 3600` + On-demand revalidation via webhooks Supabase → `revalidatePath()`.

#### From UX Design Document
- UX-01 (Design System): Tailwind CSS + Shadcn/UI (Radix Primitives). Composants copiés dans `/components/ui`.
- UX-02 (Typography): Police "Onest" (Google Fonts), base 16px, Bold pour les titres.
- UX-03 (Color System): Primary Action Orange `#FF6B00`, Surface Light Pure White, Surface Dark Zinc-950 (pas de True Black). Couleurs circuits sémantiques.
- UX-04 (Touch Targets): Minimum 48x48px pour toutes les zones interactives (usage outdoor gros doigts).
- UX-05 (Responsive): Mobile < 768px = Bottom Sheet pattern. Desktop >= 768px = Side Panel droit. Paysage mobile = auto-bascule Side Panel.
- UX-06 (MapSheet Component): Custom Vaul-based drawer avec 3 états (Peek, Half, Full). Composant critique custom.
- UX-07 (TopoViewer): SVG léger superposé à l'image pour l'affichage des lignes. Lazy-loaded.
- UX-08 (TopoEditor): Canvas interactif Konva avec Loupe déportée, Smoothing Bézier, Undo stack. Chargé à la demande (Code Splitting).
- UX-09 (OfflineStatus): Pill discret en haut d'écran ("Offline • Zone Downloaded").
- UX-10 (Feedback Patterns): Optimistic UI partout. Zero-latency. Toast Undo > Confirm Modal.
- UX-11 (Accessibility): Standard AAA contraste (ratio 7:1). Pas de gris clair < zinc-600 pour les infos essentielles. Double codage couleur+forme pour les circuits (daltoniens).
- UX-12 (Dark Mode): Support natif complet via `class="dark"` strategy. Toggle rapide dans le header.
- UX-13 (Micro-Interactions): Feedback haptique + visuel "Magnésie" / Confetti lors du log d'une croix. No Spinners (squelettes UI).
- UX-14 (Modal Patterns): Sheet (Bottom/Side) > Dialog. Pas de modales bloquantes pendant le flow principal.
- UX-15 (Colorblind): Double codage circuits : Jaune=Triangle, Bleu=Rond, Rouge=Carré, Blanc=Losange.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-01 | Epic 1 | PWA install (A2HS) |
| FR-02 | Epic 1 | Détection réseau Online/Offline |
| FR-10 | Epic 2 | Carte vectorielle interactive |
| FR-11 | Epic 2 | Filtres multiples (Niveau, Style, Séchage, Poussette) |
| FR-12 | Epic 2 | Recherche texte secteur/bloc |
| FR-13 | Epic 2 | Fiche détaillée bloc |
| FR-14 | Epic 2 | Tracés départ/arrivée sur photo |
| FR-30 | Epic 3 | Création compte + connexion |
| FR-35 | Epic 3 | Préférences profil |
| FR-36 | Epic 3 | Suppression compte + export GDPR |
| FR-31 | Epic 4 | Log ascension ("Croix") |
| FR-32 | Epic 4 | Listes de blocs (Projets, Favoris) |
| FR-33 | Epic 4 | Stats de progression |
| FR-34 | Epic 4 | Annotations timeline |
| FR-20 | Epic 5 | Création bloc (Nom, Cotation, Style) |
| FR-21 | Epic 5 | Capture/upload photo |
| FR-22 | Epic 5 | Annotations vectorielles sur photo |
| FR-23 | Epic 5 | Géolocalisation GPS |
| FR-24 | Epic 5 | Brouillon Local offline |
| FR-25 | Epic 5 | Suggestion modification bloc existant |
| FR-26 | Epic 5 | Upload vidéo démo |
| FR-03 | Epic 6 | Téléchargement Pack Secteur offline |
| FR-04 | Epic 6 | Background Sync automatique |
| FR-05 | Epic 6 | Hard Reset cache |
| FR-06 | Epic 6 | Gestion espace stockage |
| FR-40 | Epic 7 | Détection doublons (proximité < 5m) |
| FR-41 | Epic 7 | File d'attente modération |
| FR-42 | Epic 7 | Comparaison Diff Side-by-Side |
| FR-43 | Epic 7 | Valider/Rejeter/Corrections |
| FR-44 | Epic 7 | Notification auteur |
| FR-45 | Epic 7 | Auto-validation Trusted Users |
| FR-46 | Epic 7 | Suspension droits (Ban) |

## Epic List

### Epic 1 : Fondation & App Shell PWA
L'utilisateur peut installer l'app, naviguer dans le shell applicatif, et bénéficier d'un rendu performant offline.
**FRs :** FR-01, FR-02
**NFRs :** NFR-01, NFR-02
**Additionnel :** ARCH-01, ARCH-08, ARCH-09, ARCH-11, ARCH-12, ARCH-13, UX-01, UX-02, UX-03, UX-04, UX-09, UX-12

### Epic 2 : Exploration & Découverte
L'utilisateur peut explorer la carte vectorielle, filtrer les blocs, rechercher par nom, et consulter les fiches détaillées avec topos.
**FRs :** FR-10, FR-11, FR-12, FR-13, FR-14
**NFRs :** NFR-03
**Additionnel :** ARCH-04, UX-05, UX-06, UX-07, UX-10, UX-14, UX-15

### Epic 3 : Authentification & Profil Utilisateur
L'utilisateur peut créer un compte, se connecter, gérer son profil et ses préférences, et exercer ses droits GDPR.
**FRs :** FR-30, FR-35, FR-36
**NFRs :** NFR-07, NFR-08
**Additionnel :** ARCH-02, UX-13

### Epic 4 : Carnet de Croix & Progression
L'utilisateur peut loguer ses ascensions, gérer ses listes (Projets/Favoris), visualiser ses stats et annoter sa timeline.
**FRs :** FR-31, FR-32, FR-33, FR-34
**NFRs :** NFR-04
**Additionnel :** ARCH-06, UX-13

### Epic 5 : Contribution & Création de Blocs
L'utilisateur authentifié peut créer un bloc avec photo, tracé vectoriel, géolocalisation, et sauvegarder en brouillon local.
**FRs :** FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26
**NFRs :** NFR-08
**Additionnel :** ARCH-05, ARCH-10, UX-08, UX-11

### Epic 6 : Offline & Synchronisation
L'utilisateur peut télécharger des packs offline, travailler sans réseau, et voir ses données synchronisées automatiquement au retour du réseau.
**FRs :** FR-03, FR-04, FR-05, FR-06
**NFRs :** NFR-05, NFR-06
**Additionnel :** ARCH-03, ARCH-07, ARCH-09, ARCH-16

### Epic 7 : Modération & Qualité
Les modérateurs peuvent gérer les soumissions, comparer les doublons, valider/rejeter, et le système de Trust gère les niveaux d'autorisation.
**FRs :** FR-40, FR-41, FR-42, FR-43, FR-44, FR-45, FR-46
**Additionnel :** ARCH-14, ARCH-15

---

## Epic 1 : Fondation & App Shell PWA

L'utilisateur peut installer l'app, naviguer dans le shell applicatif, et bénéficier d'un rendu performant offline.

### Story 1.1 : Initialisation du Projet Next.js & Design System

En tant que développeur,
Je veux initialiser le projet avec Next.js 15, Tailwind v4, et Shadcn/UI,
Afin de disposer d'une base technique conforme à l'architecture validée.

**Acceptance Criteria:**

**Given** un repo vide
**When** j'exécute `npx shadcn@latest init`
**Then** le projet Next.js 15 est initialisé avec App Router, Tailwind v4, et Shadcn/UI
**And** la police Onest (Google Fonts) est configurée comme police par défaut
**And** le système de couleurs (Orange `#FF6B00`, Zinc-950 dark) est configuré dans les tokens Tailwind
**And** les conventions de nommage (ARCH-13) sont documentées dans un `.eslintrc`
**And** Vitest et Playwright sont configurés (ARCH-12)
**And** le layout principal respecte les touch targets 48px min (UX-04)

### Story 1.2 : Configuration PWA & Service Worker

En tant qu'utilisateur mobile,
Je veux pouvoir installer l'application sur mon écran d'accueil,
Afin d'y accéder comme une application native.

**Acceptance Criteria:**

**Given** l'App Shell est déployée
**When** j'accède au site depuis un navigateur mobile compatible
**Then** le prompt "Ajouter à l'écran d'accueil" (A2HS) s'affiche (FR-01)
**And** @serwist/next est configuré avec le manifest.json (icônes, nom, couleurs)
**And** la stratégie Cache-First est active pour l'App Shell (ARCH-09)
**And** l'App Shell est interactive en < 1 seconde en mode Offline (NFR-02)
**And** le score Lighthouse Performance mobile > 90 (NFR-01)

### Story 1.3 : Détection Réseau & Indicateur Offline

En tant qu'utilisateur en forêt,
Je veux savoir immédiatement si je suis connecté ou non,
Afin d'adapter mon usage de l'application.

**Acceptance Criteria:**

**Given** l'application est chargée
**When** le réseau devient indisponible
**Then** un pill discret "Offline" s'affiche en haut de l'écran (UX-09, FR-02)
**And** le pill affiche "Offline • Zone Downloaded" si un pack secteur est présent
**When** le réseau redevient disponible
**Then** le pill disparaît avec une animation fluide
**And** l'état réseau est accessible globalement via un hook `useNetworkStatus()`

### Story 1.4 : Dark Mode & Toggle

En tant qu'utilisateur,
Je veux basculer entre mode clair et mode sombre,
Afin d'adapter l'affichage à mes conditions d'éclairage.

**Acceptance Criteria:**

**Given** l'application est chargée
**When** je clique sur le toggle Dark Mode dans le header
**Then** l'interface bascule entre les thèmes clair (Surface Light White) et sombre (Zinc-950) (UX-12)
**And** la préférence est persistée dans `localStorage`
**And** le mode système (`prefers-color-scheme`) est respecté au premier chargement
**And** le contraste AAA (ratio 7:1) est maintenu dans les deux modes (UX-11)

### Story 1.5 : Monitoring & Error Tracking

En tant que développeur,
Je veux que les erreurs et les Core Web Vitals soient tracés automatiquement,
Afin de détecter les régressions de performance et les bugs en production.

**Acceptance Criteria:**

**Given** l'application est déployée sur Vercel
**When** une erreur JavaScript survient
**Then** elle est capturée et envoyée à Sentry (ARCH-11)
**And** Vercel Analytics collecte les Core Web Vitals automatiquement
**And** les erreurs incluent le contexte utilisateur (anonymisé) et la stack trace

## Epic 2 : Exploration & Découverte

L'utilisateur peut explorer la carte vectorielle, filtrer les blocs, rechercher par nom, et consulter les fiches détaillées avec topos.

### Story 2.1 : Integation Carte Vectorielle (MapLibre + Protomaps)

En tant qu'utilisateur,
Je veux naviguer sur une carte interactive fluide et précise,
Afin de me repérer dans la forêt et visualiser les secteurs.

**Acceptance Criteria:**

**Given** l'application est chargée sur la vue Carte
**When** je navigue (pan/zoom) sur la carte
**Then** l'affichage est fluide (60fps) même avec des clusters (NFR-03)
**And** les tuiles vectorielles sont chargées depuis la source Protomaps (PMTiles) (ARCH-04)
**And** le niveau de zoom détermine l'affichage (Forêt -> Secteur -> Blocs)
**And** les blocs sont regroupés en clusters interactifs aux zooms intermédiaires
**And** le style de carte (couleurs, polices) respecte le Design System (UX-03)

### Story 2.2 : Filtrage des Blocs

En tant qu'utilisateur,
Je veux filtrer les blocs affichés sur la carte,
Afin de ne voir que ceux qui correspondent à mon niveau ou mes envies.

**Acceptance Criteria:**

**Given** je suis sur la vue Carte avec des blocs affichés
**When** j'ouvre le panneau de filtres
**And** je sélectionne "Circuit Orange" et "À l'ombre"
**Then** la carte se met à jour instantanément pour n'afficher que les blocs correspondants
**And** le compteur de résultats affiche le nombre de blocs visibles
**And** les filtres actifs sont indiqués visuellement (Badge sur le bouton filtre)
**And** les filtres sont persistés dans le store global (Zustand) lors de la navigation

### Story 2.3 : Recherche Textuelle Secteur/Bloc

En tant qu'utilisateur,
Je veux rechercher un secteur ou un bloc par son nom,
Afin d'y accéder rapidement sans chercher sur la carte.

**Acceptance Criteria:**

**Given** je suis sur la vue Carte
**When** je tape 'Cul de Chien' dans la barre de recherche (FR-12)
**Then** une liste d'autocomplétion s'affiche avec les secteurs et blocs correspondants
**When** je sélectionne le résultat "Secteur Cul de Chien"
**Then** la carte effectue une animation "FlyTo" vers les coordonnées du secteur
**And** le niveau de zoom est ajusté pour englober le secteur
**And** le clavier virtuel se ferme automatiquement

### Story 2.4 : Fiche Détail Bloc (MapSheet Pattern)

En tant qu'utilisateur,
Je veux voir les informations essentielles d'un bloc en cliquant dessus,
Afin de savoir si je veux l'essayer.

**Acceptance Criteria:**

**Given** je vois un marqueur de bloc sur la carte
**When** je clique sur le marqueur
**Then** le composant MapSheet (Bottom Sheet) s'ouvre en position "Half" (UX-06)
**And** l'URL est mise à jour () pour le deep linking
**And** je vois le nom, la cotation, et les icônes de style du bloc
**And** je peux swiper vers le haut pour voir "Full" ou vers le bas pour fermer
**And** la carte reste interactive en arrière-plan (si visible)

### Story 2.5 : Visualiseur de Topo (Photo + SVG)

En tant qu'utilisateur,
Je veux voir le tracé du bloc sur une photo réelle,
Afin de comprendre où passe la ligne.

**Acceptance Criteria:**

**Given** la fiche détail d'un bloc est ouverte
**When** je consulte la section topo
**Then** la photo du bloc s'affiche avec un placeholder "BlurHash" pendant le chargement
**And** le tracé vectoriel (SVG) est superposé avec précision à la photo (UX-07)
**And** la ligne de départ est indiquée par un cercle et l'arrivée par une flèche
**And** je peux zoomer/panner dans l'image pour voir les détails (Pinch-to-zoom)
**And** le rendu respecte le code couleur du circuit (ex: Orange pour AD)

## Epic 3 : Authentification & Profil Utilisateur

L'utilisateur peut créer un compte, se connecter, gérer son profil et ses préférences, et exercer ses droits GDPR.

### Story 3.1 : Inscription & Connexion (Supabase Auth)

En tant que nouvel utilisateur,
Je veux créer un compte sécurisé ou utiliser mon compte Google,
Afin de pouvoir sauvegarder mes progrès et contribuer.

**Acceptance Criteria:**

**Given** je suis sur la page de connexion
**When** je clique sur "Continuer avec Google"
**Then** je suis redirigé via OAuth et connecté automatiquement (FR-30)
**And** si c'est ma première fois, un profil "Anonyme" est créé avec mon avatar Google
**When** je choisis "Email/Mot de passe"
**Then** je reçois un email de confirmation (Double Opt-in)
**And** une fois connecté, mon token de session (JWT) est stocké de manière sécurisée (HttpOnly cookie ou Storage sécurisé)
**And** je reste connecté même après rafraîchissement (Persistent Session)

### Story 3.2 : Gestion du Profil Public

En tant qu'utilisateur connecté,
Je veux personnaliser mon profil visible par la communauté,
Afin d'être reconnu par mes amis grimpeurs.

**Acceptance Criteria:**

**Given** je suis connecté
**When** j'accède à "Mon Profil"
**Then** je peux modifier mon "Nom d'affichage" et mon "Avatar" (Upload ou Choix prédéfini) (FR-35)
**And** je peux définir mon "Niveau max à vue" (ex: 7a) pour calibrer les suggestions
**And** les changements sont sauvegardés via Server Action avec validation Zod
**And** mon profil affiche mes statistiques sommaires (Nombre de croix, points de contribution)

### Story 3.3 : Conformité GDPR (Export & Suppression)

En tant qu'utilisateur soucieux de mes données,
Je veux pouvoir télécharger ou supprimer toutes mes informations,
Afin d'exercer mon droit à l'oubli et à la portabilité.

**Acceptance Criteria:**

**Given** je suis dans les paramètres de mon compte
**When** je clique sur "Télécharger mes données"
**Then** un fichier JSON contenant tout mon historique (Croix, Contributions, Profil) est généré et téléchargé (NFR-07)
**When** je clique sur "Supprimer mon compte" et confirme via une modale de danger
**Then** toutes mes données personnelles sont effacées de la base (Hard Delete)
**And** mes contributions publiques (Secteurs, Blocs) sont anonymisées ("Utilisateur supprimé") mais conservées
**And** je suis déconnecté immédiatement

### Story 3.4 : Visualisation du Trust Score

En tant que contributeur,
Je veux connaître mon statut dans la communauté,
Afin de savoir si mes modifications sont publiées directement.

**Acceptance Criteria:**

**Given** je suis sur mon profil
**Then** un badge indique mon rôle actuel (ex: "Contributeur" ou "Trusted") (FR-45)
**And** une barre de progression indique combien de points il me manque pour le niveau suivant
**And** une info-bulle explique les privilèges de mon niveau (ex: "Vos ajouts de blocs sont validés instantanément")
**And** l'affichage est cohérent avec la colonne trust_score en base de données

## Epic 4 : Carnet de Croix & Progression

L'utilisateur peut loguer ses ascensions, gérer ses listes (Projets/Favoris), visualiser ses stats et annoter sa timeline.

### Story 4.1 : Logger une Ascension ("Croix")

En tant que grimpeur,
Je veux enregistrer mes ascensions avec date, style, et notes,
Afin de suivre ma progression personnelle.

**Acceptance Criteria:**

**Given** je consulte la fiche d'un bloc
**When** je clique sur "Logger une croix"
**Then** un formulaire apparaît avec les champs Date, Style (Flash/À vue/Travaillé), et Note personnelle (FR-31)
**And** je peux sélectionner un style via des boutons visuels (icônes + couleur)
**When** je valide le formulaire
**Then** l'ascension est sauvegardée avec une animation de feedback "Confetti + Haptique" (UX-13)
**And** la croix apparaît dans mon historique personnel
**And** le bloc est marqué visuellement comme "Fait" sur la carte (badge vert)
**And** le formulaire utilise React Hook Form + Zod pour la validation

### Story 4.2 : Gestion des Listes de Blocs

En tant qu'utilisateur organisé,
Je veux créer et gérer des listes de blocs (Projets, Favoris),
Afin de planifier mes sessions futures.

**Acceptance Criteria:**

**Given** je consulte la fiche d'un bloc
**When** je clique sur l'icône "Ajouter à une liste"
**Then** un menu s'ouvre listant mes listes existantes + "Créer une nouvelle liste" (FR-32)
**When** je sélectionne "Projets"
**Then** le bloc est ajouté à ma liste "Projets" avec feedback optimiste (Optimistic UI)
**And** l'icône change d'état (remplie) pour indiquer l'appartenance
**When** je consulte ma page "Mes Listes"
**Then** je vois toutes mes listes avec le nombre de blocs et aperçu photo
**And** je peux renommer, supprimer, ou réorganiser mes listes par drag&drop
**And** chaque liste est accessible via une URL dédiée pour partage (/lists/[id])

### Story 4.3 : Visualisation des Statistiques

En tant que grimpeur motivé,
Je veux voir mes progrès sous forme de graphiques,
Afin de comprendre mon évolution dans le temps.

**Acceptance Criteria:**

**Given** je suis sur ma page "Statistiques"
**Then** je vois un graphique temporel de mes ascensions par mois (FR-33)
**And** un diagramme en barres affiche la répartition par cotation (6a, 6b, 6c, etc.)
**And** un camembert montre la proportion Flash/À vue/Travaillé
**And** le nombre total de blocs uniques est affiché en grand (Metric Card)
**And** les graphiques sont générés avec une bibliothèque moderne (ex: Recharts)
**And** les données sont chargées via TanStack Query avec cache intelligent

### Story 4.4 : Annotations Timeline

En tant qu'utilisateur expérimenté,
Je veux annoter ma timeline de progression,
Afin de marquer les événements clés (blessure, stage, etc.).

**Acceptance Criteria:**

**Given** je consulte mes statistiques
**When** je clique sur "Ajouter une annotation" à une date précise
**Then** un champ texte court (max 100 caractères) s'affiche (FR-34)
**When** je saisis "Blessure épaule" et valide
**Then** une épingle apparaît sur la timeline du graphique à cette date
**And** au survol, une info-bulle affiche le texte de l'annotation
**And** je peux modifier ou supprimer l'annotation via un menu contextuel
**And** les annotations sont persistées en base avec référence à l'utilisateur

### Story 4.5 : Prévention de la Sollicitation GPS en Arrière-Plan

En tant qu'utilisateur soucieux de ma batterie,
Je veux que l'app ne consomme pas de GPS en arrière-plan,
Afin de préserver l'autonomie lors de mes sessions outdoor.

**Acceptance Criteria:**

**Given** l'application est en arrière-plan (écran éteint ou autre app active)
**Then** aucune sollicitation GPS n'est active (NFR-04)
**And** le Service Worker ne déclenche pas de tracking de position
**When** je reviens sur l'app et ouvre la carte
**Then** la position GPS est mise à jour uniquement à ce moment
**And** l'utilisateur peut activer explicitement un "Mode Tracking" s'il le souhaite (opt-in)

## Epic 5 : Contribution & Création de Blocs

L'utilisateur authentifié peut créer un bloc avec photo, tracé vectoriel, géolocalisation, et sauvegarder en brouillon local.

### Story 5.1 : Formulaire de Création de Bloc (Métadonnées)

En tant que contributeur,
Je veux créer un nouveau bloc avec ses informations essentielles,
Afin d'enrichir la base de données communautaire.

**Acceptance Criteria:**

**Given** je suis connecté et sur la carte
**When** je clique sur le bouton "Ajouter un bloc" (FAB)
**Then** un formulaire s'ouvre avec les champs obligatoires : Nom, Cotation, Style de grimpe (FR-20)
**And** les champs optionnels : Description, Hauteur, Exposition (Soleil/Ombre), Praticabilité (Poussette)
**And** le formulaire utilise Zod + React Hook Form avec validation temps réel
**And** les contraintes métier sont appliquées (ex: Cotation entre 2a et 9a, Nom unique dans le secteur)
**And** le formulaire est accessible via un Sheet (mobile) ou Dialog (desktop) selon UX-05
**And** tous les champs respectent les validations définies dans ARCH-10

### Story 5.2 : Capture & Upload Photo

En tant que contributeur,
Je veux ajouter une photo du bloc,
Afin que les autres grimpeurs puissent le reconnaître.

**Acceptance Criteria:**

**Given** je suis dans le formulaire de création de bloc
**When** je clique sur "Ajouter une photo"
**Then** je peux choisir entre "Prendre une photo" (caméra) ou "Galerie" (FR-21)
**When** je capture une photo
**Then** elle est redimensionnée automatiquement (max 1920px de largeur) côté client
**And** les métadonnées EXIF sensibles (GPS, Device) sont supprimées (NFR-08)
**And** un BlurHash est généré pour le placeholder
**And** l'upload démarre vers Supabase Storage avec progress bar
**And** la photo est stockée dans un bucket privé `pending-photos` tant que non validée
**And** l'URL de la photo est sauvegardée temporairement dans le state du formulaire

### Story 5.3 : Géolocalisation GPS Précise

En tant que contributeur sur le terrain,
Je veux placer le bloc exactement là où il se trouve,
Afin que les autres puissent le trouver facilement.

**Acceptance Criteria:**

**Given** je suis dans le formulaire de création avec photo uploadée
**When** je clique sur "Localiser le bloc"
**Then** une carte en plein écran s'ouvre avec ma position actuelle (FR-23)
**And** un marqueur draggable est placé à ma position GPS Device
**And** je peux affiner la position en déplaçant le marqueur ou en utilisant le crosshair central
**And** le niveau de zoom est à 18+ (précision < 5 mètres)
**And** les coordonnées GPS (latitude, longitude) sont affichées en temps réel
**When** je valide la position
**Then** les coordonnées sont enregistrées avec précision de 6 décimales (±10cm)
**And** la carte revient au formulaire principal

### Story 5.4 : Éditeur de Tracé Vectoriel (Konva Canvas)

En tant que contributeur,
Je veux dessiner le tracé du bloc sur la photo,
Afin de montrer clairement où passent les prises.

**Acceptance Criteria:**

**Given** j'ai uploadé une photo et localisé le bloc
**When** je clique sur "Dessiner le tracé"
**Then** un éditeur interactif Konva s'ouvre en plein écran avec la photo en fond (FR-22, UX-08)
**And** une toolbar affiche les outils : Ligne libre, Départ (cercle), Arrivée (flèche), Gomme
**And** une loupe déportée (100x100px) suit mon doigt/curseur pour dessiner avec précision
**And** le lissage Bézier est appliqué automatiquement aux lignes (Smoothing)
**And** je peux annuler/refaire mes actions (Undo Stack avec max 20 actions)
**And** la couleur du tracé correspond au circuit sélectionné (ex: Orange pour AD)
**When** je valide le tracé
**Then** les données vectorielles (JSON) sont sauvegardées séparément de l'image
**And** un rendu SVG léger est généré pour l'affichage (UX-07)
**And** le composant Konva est chargé dynamiquement via Code Splitting (lazy load)

### Story 5.5 : Sauvegarde en Brouillon Local (Offline)

En tant que contributeur en forêt sans réseau,
Je veux pouvoir créer un bloc et le sauvegarder localement,
Afin de le soumettre plus tard quand je serai connecté.

**Acceptance Criteria:**

**Given** je suis en mode Offline (pas de réseau)
**When** je complète le formulaire de création et valide
**Then** le bloc est sauvegardé dans IndexedDB (Dexie.js) avec status "draft" (FR-24)
**And** un toast m'informe "Bloc sauvegardé localement • Sera synchronisé au retour du réseau"
**And** la photo est stockée en Blob dans IndexedDB (table `local_photos`)
**When** je reviens en ligne
**Then** le système détecte automatiquement le retour réseau
**And** le brouillon est uploadé automatiquement vers Supabase (Background Sync API)
**And** une notification me confirme "Bloc envoyé pour modération"
**And** le brouillon local est supprimé après succès de l'upload

### Story 5.6 : Suggestion de Modification sur Bloc Existant

En tant que contributeur,
Je veux proposer une correction sur un bloc (cotation, photo, tracé),
Afin d'améliorer la qualité des données collaborativement.

**Acceptance Criteria:**

**Given** je consulte un bloc existant
**When** je clique sur "Suggérer une modification"
**Then** un formulaire pré-rempli avec les données actuelles s'ouvre (FR-25)
**And** je peux modifier n'importe quel champ (Nom, Cotation, Photo, Tracé)
**And** un diff visuel compare l'ancienne et la nouvelle valeur pour les champs textuels
**When** je soumets la suggestion
**Then** elle est enregistrée avec status "pending" et liée à l'ID du bloc original
**And** elle entre dans la file d'attente de modération (Epic 7)
**And** je reçois un toast "Suggestion envoyée • Vous serez notifié du résultat"
**And** je peux consulter mes suggestions en attente dans mon profil

### Story 5.7 : Upload Vidéo de Démonstration

En tant que contributeur,
Je veux ajouter une vidéo du bloc,
Afin d'aider les autres à comprendre la méthode.

**Acceptance Criteria:**

**Given** je suis dans le formulaire de création/édition
**When** je clique sur "Ajouter une vidéo"
**Then** je peux choisir entre "Lien YouTube/Vimeo" ou "Upload Direct" (FR-26)
**When** je colle un lien YouTube valide (ex: https://youtu.be/abc123)
**Then** le système extrait l'ID et affiche un embed preview
**When** je choisis "Upload Direct"
**Then** le fichier est compressé côté client (max 50 MB, H.264)
**And** l'upload démarre vers Supabase Storage avec progress bar détaillée (%)
**And** la vidéo est stockée dans un bucket CDN-optimisé
**And** l'URL ou l'ID YouTube est sauvegardé dans la colonne `video_url`

## Epic 6 : Offline & Synchronisation

L'utilisateur peut télécharger des packs offline, travailler sans réseau, et voir ses données synchronisées automatiquement au retour du réseau.

### Story 6.1 : Téléchargement Pack Secteur

En tant qu'utilisateur prévoyant,
Je veux télécharger toutes les données d'un secteur pour usage offline,
Afin de pouvoir grimper sans réseau en forêt.

**Acceptance Criteria:**

**Given** je consulte un secteur sur la carte
**When** je clique sur "Télécharger pour usage offline" (FR-03)
**Then** un écran de confirmation affiche l'espace requis (ex: "125 MB : 234 blocs, 567 photos, fond de carte")
**When** je confirme le téléchargement
**Then** les données sont téléchargées par batch avec progress bar détaillée
**And** les blocs (métadonnées JSON) sont stockés dans IndexedDB (table `sectors`)
**And** les photos sont stockées en Blob dans IndexedDB (table `photos`)
**And** les tuiles de carte PMTiles sont téléchargées pour la bbox du secteur
**And** un hash de version est sauvegardé pour détecter les mises à jour futures
**And** le téléchargement peut être mis en pause/repris (Resumable Download)
**And** un toast confirme "Secteur Cul de Chien disponible offline"

### Story 6.2 : Synchronisation Automatique en Background

En tant qu'utilisateur,
Je veux que mes données locales se synchronisent automatiquement,
Afin de ne jamais perdre mes contributions ou croix.

**Acceptance Criteria:**

**Given** j'ai créé des brouillons ou loggé des croix en mode Offline
**When** le réseau redevient disponible
**Then** le Service Worker déclenche automatiquement le Background Sync (FR-04)
**And** les données en attente sont uploadées une par une avec retry exponentiel (NFR-05)
**And** en cas d'échec réseau temporaire, le système retente après 1s, 2s, 4s, 8s... (Exponential Backoff)
**And** une notification native "Synchronisation terminée • 3 blocs envoyés" s'affiche
**And** les données synchronisées avec succès sont marquées comme `synced: true`
**And** les données non synchronisées restent visibles dans une section "En attente" du profil

### Story 6.3 : Hard Reset Cache & Resynchronisation

En tant qu'utilisateur avancé,
Je veux pouvoir forcer un nettoyage complet du cache,
Afin de résoudre des problèmes de données corrompues.

**Acceptance Criteria:**

**Given** je suis dans les paramètres de l'app
**When** je clique sur "Vider le cache et resynchroniser" (FR-05)
**Then** une modale de danger confirme "Cela supprimera tous les packs offline et brouillons non synchronisés"
**When** je confirme
**Then** toutes les tables IndexedDB sont vidées (sectors, photos, local_drafts)
**And** le Service Worker est mis à jour (skipWaiting + clients.claim)
**And** les caches de l'app sont supprimés (Cache API)
**And** l'application recharge automatiquement
**And** un toast confirme "Cache vidé • Données à jour"
**And** les données serveur sont rechargées depuis Supabase

### Story 6.4 : Gestion de l'Espace de Stockage

En tant qu'utilisateur,
Je veux voir combien d'espace mes packs offline consomment,
Afin de gérer mon stockage device.

**Acceptance Criteria:**

**Given** je suis dans "Paramètres > Stockage Offline"
**Then** je vois l'espace total utilisé par Bleau-info (ex: "450 MB utilisés") (FR-06)
**And** une liste détaille chaque pack téléchargé avec son poids et sa date
**And** je peux supprimer un pack individuellement via un bouton "Poubelle"
**When** je supprime un pack
**Then** les données correspondantes sont retirées d'IndexedDB
**And** l'espace libéré est affiché avec feedback optimiste
**And** le calcul de l'espace utilise l'API `navigator.storage.estimate()` si disponible

### Story 6.5 : Gestion des Conflits (Last Write Wins + Manual Merge)

En tant qu'utilisateur,
Je veux que mes modifications locales ne soient pas perdues en cas de conflit,
Afin de conserver mon travail même si quelqu'un a modifié le même bloc.

**Acceptance Criteria:**

**Given** j'ai modifié un bloc en mode Offline
**And** ce bloc a aussi été modifié par quelqu'un d'autre en ligne
**When** ma modification est synchronisée
**Then** la stratégie "Last Write Wins" s'applique pour les champs simples (Nom, Cotation) (NFR-06)
**And** les champs géographiques (Latitude, Longitude) déclenchent un "Manual Merge" si l'écart > 10m
**And** un conflit géographique crée une entrée en file de modération avec comparaison Side-by-Side
**And** je reçois une notification "Votre modification nécessite une vérification manuelle"
**And** le modérateur peut choisir quelle version conserver ou créer un merge manuel

### Story 6.6 : Incremental Static Regeneration (ISR)

En tant que développeur,
Je veux que les pages de blocs soient pré-générées et mises en cache,
Afin d'optimiser les performances et le SEO.

**Acceptance Criteria:**

**Given** un bloc est créé ou modifié
**When** la validation est approuvée
**Then** un webhook Supabase déclenche un appel à `/api/revalidate?path=/bloc/[id]` (ARCH-16)
**And** la page SSG du bloc est régénérée avec les nouvelles données
**And** le paramètre `revalidate: 3600` garantit un refresh automatique toutes les heures
**And** les autres utilisateurs voient la mise à jour sans vider leur cache
**And** les pages de secteurs sont aussi revalidées si nécessaire

## Epic 7 : Modération & Qualité

Les modérateurs peuvent gérer les soumissions, comparer les doublons, valider/rejeter, et le système de Trust gère les niveaux d'autorisation.

### Story 7.1 : Détection Automatique des Doublons

En tant que système,
Je veux détecter les blocs potentiellement en double lors de la création,
Afin d'éviter la pollution de la base de données.

**Acceptance Criteria:**

**Given** un utilisateur crée un nouveau bloc avec coordonnées GPS
**When** il valide le formulaire
**Then** une requête PostGIS `ST_DWithin(location, NEW.location, 5)` détecte les blocs dans un rayon de 5 mètres (FR-40)
**And** si au moins 1 doublon potentiel est trouvé
**Then** l'utilisateur voit une alerte "Attention : 1 bloc similaire trouvé à proximité"
**And** une carte Side-by-Side compare sa position avec le bloc existant
**And** il peut choisir "C'est le même bloc" (annule la création) ou "Non, c'est un autre bloc" (continue)
**And** si l'utilisateur continue, la soumission est flaggée `potential_duplicate: true` pour revue manuelle
**And** le modérateur verra cette soumission en priorité dans la file

### Story 7.2 : File d'Attente de Modération

En tant que modérateur,
Je veux voir toutes les soumissions en attente de validation,
Afin de maintenir la qualité de la base de données.

**Acceptance Criteria:**

**Given** je suis connecté en tant que modérateur (role = 'moderator')
**When** j'accède à `/admin/moderation`
**Then** je vois une liste paginée de toutes les soumissions avec status "pending" (FR-41)
**And** les soumissions sont triées par priorité : Doublons potentiels > Nouvelles créations > Modifications
**And** chaque item affiche : Miniature photo, Nom du bloc, Auteur, Date de soumission, Raison de la file
**And** un compteur affiche le nombre total de soumissions en attente (badge header)
**And** je peux filtrer par type (Création/Modification) et par secteur
**And** les données sont chargées via TanStack Query avec infinite scroll

### Story 7.3 : Comparaison Side-by-Side (Diff Visuel)

En tant que modérateur,
Je veux comparer une soumission avec les données existantes,
Afin de prendre une décision éclairée.

**Acceptance Criteria:**

**Given** je consulte une soumission de modification dans la file
**When** je clique sur "Voir les détails"
**Then** un écran split-screen affiche Gauche = Version actuelle, Droite = Version proposée (FR-42)
**And** les champs modifiés sont surlignés en jaune (Diff textuel)
**And** les photos sont affichées côte à côte avec zoom synchronisé
**And** les tracés vectoriels sont superposés en transparence (Rouge = Ancien, Vert = Nouveau)
**And** les coordonnées GPS sont affichées sur une mini-carte avec les deux marqueurs
**And** je peux basculer en vue "Diff unifié" (comme Git) pour les champs textuels

### Story 7.4 : Actions de Modération (Valider/Rejeter/Corrections)

En tant que modérateur,
Je veux pouvoir valider, rejeter, ou demander des corrections,
Afin de gérer efficacement la file d'attente.

**Acceptance Criteria:**

**Given** je consulte une soumission dans la file
**When** je clique sur "Valider"
**Then** la soumission est marquée `status: 'approved'` (FR-43)
**And** les données sont fusionnées avec la base principale (UPSERT)
**And** la photo est déplacée du bucket `pending-photos` vers `public-photos`
**And** l'auteur reçoit une notification "Votre bloc '[Nom]' a été validé !" (FR-44)
**And** le trust_score de l'auteur augmente de +10 points
**When** je clique sur "Rejeter"
**Then** une modale demande de choisir une raison (Doublon/Qualité insuffisante/Spam/Autre)
**And** un champ texte optionnel permet d'ajouter un commentaire explicatif
**And** la soumission est marquée `status: 'rejected'`
**And** l'auteur reçoit une notification avec la raison du rejet
**When** je clique sur "Demander des corrections"
**Then** un champ texte s'affiche pour lister les corrections nécessaires
**And** la soumission reste en file avec `status: 'needs_revision'`
**And** l'auteur reçoit une notification avec les instructions

### Story 7.5 : Auto-Validation pour Trusted Users

En tant que système,
Je veux valider automatiquement les contributions des utilisateurs de confiance,
Afin de réduire la charge de modération.

**Acceptance Criteria:**

**Given** un utilisateur avec `trust_score >= 100` (statut "Trusted") crée un bloc
**When** il soumet sa création
**Then** elle est automatiquement marquée `status: 'approved'` sans passer en file de modération (FR-45)
**And** elle est publiée immédiatement sur la carte
**And** un audit log enregistre l'auto-validation avec raison "trusted_user"
**And** l'utilisateur voit un badge "Publication instantanée" lors de la validation
**And** les modérateurs peuvent quand même consulter l'historique des auto-validations
**And** si l'utilisateur crée un doublon détecté, la soumission passe quand même en file manuellement

### Story 7.6 : Suspension des Droits d'Écriture (Ban)

En tant que modérateur senior,
Je veux pouvoir suspendre les droits de contribution d'un utilisateur malveillant,
Afin de protéger la qualité de la plateforme.

**Acceptance Criteria:**

**Given** je suis modérateur avec rôle "senior_moderator"
**When** je consulte le profil d'un utilisateur problématique
**Then** je vois un bouton "Suspendre les droits d'écriture" (FR-46)
**When** je clique dessus
**Then** une modale de danger demande de confirmer avec une raison obligatoire
**When** je confirme
**Then** la colonne `write_permissions` est mise à `false` pour cet utilisateur
**And** toutes ses soumissions en attente sont automatiquement rejetées
**And** il reçoit une notification expliquant la suspension et les modalités de recours
**And** s'il tente de créer un bloc, il voit une erreur "Droits de contribution suspendus"
**And** un log d'audit enregistre l'action avec l'ID du modérateur et la raison
**And** un modérateur senior peut réactiver les droits via "Réhabiliter l'utilisateur"

### Story 7.7 : Modération Collaborative en Temps Réel

En tant que modérateur,
Je veux voir si un autre modérateur est en train de traiter une soumission,
Afin d'éviter les doublons de travail.

**Acceptance Criteria:**

**Given** plusieurs modérateurs sont connectés
**When** l'un d'eux ouvre une soumission pour la traiter
**Then** les autres modérateurs voient un badge "En cours de revue par [Nom]" sur cette soumission (ARCH-15)
**And** Supabase Realtime notifie tous les clients connectés de l'ouverture de la soumission
**And** si un modérateur prend une décision (Valider/Rejeter), les autres voient la soumission disparaître instantanément
**And** la liste de la file se met à jour en temps réel sans refresh manuel
**And** un indicateur de présence montre combien de modérateurs sont actifs en ce moment

---

## Epic Summary

| Epic | Stories | Status |
|------|---------|--------|
| Epic 1: Fondation & App Shell PWA | 5 | ✅ Completed |
| Epic 2: Exploration & Découverte | 5 | ✅ Completed |
| Epic 3: Authentification & Profil | 4 | ✅ Completed |
| Epic 4: Carnet de Croix & Progression | 5 | ✅ Completed |
| Epic 5: Contribution & Création de Blocs | 7 | ✅ Completed |
| Epic 6: Offline & Synchronisation | 6 | ✅ Completed |
| Epic 7: Modération & Qualité | 7 | ✅ Completed |
| **Total** | **39 Stories** | **✅ Ready for Implementation** |

## Next Steps

1. **Story Refinement**: Each story should be refined with the development team to estimate complexity and identify technical blockers
2. **Prioritization**: Determine implementation order (suggested: Epic 1 → Epic 2 → Epic 3 → Epic 6 → Epic 4 → Epic 5 → Epic 7)
3. **Sprint Planning**: Group stories into 2-week sprints based on team capacity
4. **Technical Spikes**: Identify stories requiring technical investigation (ex: Konva performance, Background Sync browser support)
5. **Design Handoff**: Ensure UX mockups exist for all user-facing stories before development starts
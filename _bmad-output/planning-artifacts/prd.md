---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
inputDocuments: [
  "_bmad-output/planning-artifacts/product-brief-Bleau-info-2026-01-20.md"
]
workflowType: 'prd'
---

# Product Requirements Document - Bleau-info

**Author:** Sdion
**Date:** 2026-01-20

## Success Criteria

### User Success
- **Gratification Immédiate :** L'utilisateur ressent un accomplissement tangible lors du log d'une ascension (Feedback visuel "Magnésie" + Haptique).
- **Confiance Totale :** L'utilisateur n'hésite jamais à utiliser l'app en zone blanche (Offline), certain que ses données seront synchronisées.
- **Réactivité Contribution :** L'ouvreur voit son travail validé et publié sous 48h maximum.

### Business Success
- **Qualité de Donnée :** Taux de rollback (blocs rejetés post-publication) inférieur à 2%.
- **Engagement Communautaire :** Taux de conversion des contributeurs vers le statut "Trusted User" (Indicateur de maturité).
- **Adoption Modération :** Temps moyen de traitement d'une soumission < 5 minutes pour les modérateurs.

### Technical Success
- **Performance PWA :** Score Lighthouse Performance > 90 sur mobile.
- **Vitesse de Chargement :** Time to Interactive (TTI) < 2s en 4G.
- **Fiabilité Sync :** 0% de perte de données sur les brouillons locaux lors de la reconnexion réseau.

### Measurable Outcomes
- **Metric Clé :** % de sessions utilisateur incluant une interaction "Utile" (Ajout Liste, Croix, Note, Média) vs simple consultation passive.

## Product Scope

### MVP - Minimum Viable Product
- **PWA Core :** Shell applicatif offline-first, Service Worker robuste.
- **Exploration :** Carte Vectorielle interactive, Liste Secteurs/Blocs, Filtres essentiels.
- **Fiche Bloc :** Affichage riche (Photo annotée, Vidéo), Description, Cotation.
- **Contribution :** Création de bloc (Photo + GPS), Mode Draft Local.
- **Compte :** Carnet de croix, Listes, Profil simple.
- **Modération :** Back-office de validation des soumissions.

### Growth Features (Post-MVP)
- **Gamification :** Badges "Gardiens de Secteur", Leaderboards locaux.
- **Social :** Chat privé, Sorties garoupes, Commentaires riches.
- **Outils Pro :** Dashboard analytique pour les ouvreurs (stats de répétition de leurs blocs).

### Vision (Future)
Devenir l'OS de la forêt de Fontainebleau : l'outil unique qui gère de la préparation à la maison jusqu'au guidage GPS précis au pied du bloc, en passant par l'analyse de performance post-session.

## User Journeys

### 1. Lucas (Ouvreur) - Le Parcours "Création Offline" (Contributor Flow)
**Narrative:** Lucas vient de brosser un nouveau 7a au secteur "Rocher Canon", loin de tout réseau. Il veut l'officialiser "à chaud" pour ne pas oublier les détails.
**Étapes Clés :**
1.  Ouvre l'app > "Nouveau Bloc". Le GPS fixe sa position exacte (±3m) sans internet.
2.  Prend une photo du bloc. Dessine la ligne de départ et d'arrivée directement sur l'écran.
3.  Saisit "Nom provisoire", "7a" et sélectionne obligatoirement le Style (ex: "Dévers"). L'app sauvegarde en "Brouillon Local".
4.  De retour chez lui (Wi-Fi), il complète la description et envoie.
**Requirements Revealed:** Geolocation API, Local Storage (Canvas/Image), Vector Drawing Tool (Overlay), Mandatory Tagging System.

### 2. Famille Martin - Le Parcours "Safe Logistics" (Discovery Flow)
**Narrative:** Les Martin préparent leur dimanche depuis Paris. Ils ne veulent pas galérer avec la poussette.
**Étapes Clés :**
1.  Filtre la carte : "Circuit Jaune" + "Poussette" + "Zone Sable".
2.  Identifie le secteur "Isatis". Télécharge le "Pack Secteur" (Topos + Carte + Secours).
3.  Sur place, utilise le GPS pour trouver le parking et l'approche poussette.
4.  En cas de bobo, un bouton "SOS" affiche instantanément le point de secours le plus proche (déjà en cache).
**Requirements Revealed:** Advanced Filtering, Offline Pack Download, Emergency Data Layer, Routing.

### 3. Marc (Modérateur) - Le Parcours "Gardien de la Qualité" (Admin Flow)
**Narrative:** Marc veille à ce que la base reste propre et sans doublons.
**Étapes Clés :**
1.  Ouvre le Dashboard Modération.
2.  Inspecte le bloc de Lucas. Le système affiche un "Cercle d'incertitude GPS" pour aider à repérer les doublons potentiels alentour.
3.  Marc compare les photos side-by-side. C'est bien une nouvelle variante.
4.  Il valide le bloc.
**Requirements Revealed:** Admin Dashboard, Spatial Proximity Check with Uncertainty Radius, Diff/Comparison Tool.

### 4. Sarah (Perf Seeker) - Le Parcours "Quantified Self" (Retention Flow)
**Narrative:** Sarah veut analyser sa saison pour progresser.
**Étapes Clés :**
1.  Accède à "Mon Profil > Stats".
2.  Visualise un graphe comparatif "Volume de blocs" intégrant ses annotations textuelles.
3.  Remarque une baisse annotée "Blessure".
4.  Filtre par style (donnée garantie par la saisie obligatoire) et identifie ses faiblesses.
**Requirements Revealed:** Data Visualization/Charts with Annotation Overlay, Temporal Data Queries, Strict Schema Validation (Tags).

### Journey Requirements Summary
- **Offline First Core:** Vital pour Lucas & Famille Martin.
- **Rich Media & Vector Tools:** Nécessaire pour Lucas (Création pérenne/éditable).
- **Compulsory Data Metadata:** Les tags obligatoires (Style) alimentent directement la valeur des Stats (Sarah).
- **Admin Tools & Geography:** Gestion fine du GPS et de l'incertitude pour la modération (Marc).

## Innovation & Novel Patterns

### Detected Innovation Areas
- **Vector-Based Media Layer:** Application de tracés vectoriels (SVG) interactifs par-dessus les photos de blocs. Permet le redimensionnement, l'édition future et une légèreté de stockage, redéfinissant le standard "Topo Numérique".
- **Distributed Trust Model:** Un système de modération qui évolue du "Superviseur Unique" vers un réseau de "Trusted Users" qualifiés par leurs pairs (Trust Score), afin de scaler la validation sans perdre la qualité.
- **Zero-Latency PWA (Offline-First):** Une architecture technique qui supprime la distinction "En ligne / Hors-ligne" pour l'utilisateur. L'app fonctionne intégralement sur le cache local et synchronise silencieusement, comblant le fossé entre Web et Native.

### Market Context & Competitive Landscape
Les concurrents (27 Crags, Topo Guru) reposent souvent sur des apps natives lourdes ou des sites web inopérants sans réseau. Bleau-info se différencie par son accessibilité universelle (Web) combinée à une résilience totale (Offline), spécifiquement adaptée aux zones blanches de la forêt.

### Validation Approach
- **Tech Prototype:** POC immédiat sur l'outil de dessin vectoriel sur photo avant tout développement backend.
- **Field Testing:** Sessions de test "Mode Avion" obligatoires pour toute nouvelle feature critique.
- **Beta Modération:** Lancement pilote du Back-office avec 5 "Sages" actuels pour calibrer les règles de "Trust".

### Risk Mitigation
- **Risque Vectoriel:** Si le rendu SVG sur photo est trop complexe/lent sur vieux mobiles -> Fallback : "Bake" du tracé en image JPG optimisée côté serveur.
- **Risque Qualité:** Si les "Trusted Users" valident des erreurs -> Lock temporaire des privilèges et retour à la validation centralisée pour ré-entraînement.

## Web App (PWA) Specific Requirements

### Project-Type Overview
Bleau-info est une Progressive Web App (PWA) "Offline-First" qui doit offrir une expérience quasi-native. Elle combine une accessibilité publique forte (SEO) pour la découverte avec des fonctionnalités privées (Contribution/Log) nécessitant une authentification.

### Technical Architecture Considerations (Browser & OS)

**Browser Support Matrix:**
- **Primary targets:** Chrome (Android/Desktop), Safari (iOS/MacOS), Firefox (Desktop).
- **Engine constraint:** Support complet des APIs modernes (Service Worker, IndexedDB, File System Access API si dispo).
- **Legacy Policy:** Pas de support officiel pour les vieux OS (Support des versions "Evergreen" uniquement - ex: iOS 16+, Android 12+ recommandé pour la stabilité PWA).

**SEO Strategy (Hybrid Rendering):**
- **Public Content (SSG/ISR):** Les pages "Secteur", "Bloc" et "Circuit" doivent être pré-rendues (Server-Side ou Static) pour être indexées par Google. Les meta-tags (OpenGraph, Schema.org pour 'ExercisePlan' ou 'Place') sont critiques.
- **Private Content (CSR):** Les features "Ajout de croix", "Edition", "Profil privé" sont en Client-Side Rendering derrière un Auth Wall.

### Implementation Considerations

**Offline Capabilities (Critical):**
- **Architecture:** "Offline-First" via Service Worker (Workbox).
- **Cache Strategy:**
    - App Shell (UI/JS/CSS): Cache-first.
    - Données "Pack Secteur" (JSON + Images Vector): Cache-first (téléchargement explicite par l'user).
    - Map Tiles: Cache dynamique ou téléchargement de zone.
- **Sync:** Background Sync API pour envoyer les contributions (logs, nouveaux blocs) dès le retour du réseau.

**Device Features:**
- **Geolocation:** High Accuracy nécessaire. Gestion UX du "Cercle d'incertitude".
- **Camera:** Input direct pour la photo de bloc (via `<input type="file" capture>`).
- **Haptic:** Feedback vibratoire lors de la validation ("Magnésie").

**Accessibility (A11y):**
- Standard WCAG 2.1 AA (Focus sur le contraste en extérieur/soleil et la taille des touch targets).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** "Core Utility First". L'objectif est de fournir une valeur utilitaire immédiate (Topo Offline supérieur au papier) avant de construire la couche sociale.
**Resource Requirements:** Équipe resserrée (1 Fullstack JS + 1 UX/UI) pour une itération rapide sur le Core Product.

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
- Lucas (Création Offline)
- Famille Martin (Logistique & Découverte)
- Marc (Modération Basique - Back-office)

**Must-Have Capabilities:**
- Progressive Web App installable (Manifest, Service Worker).
- Carte Vectorielle interactive & Recherche (Algolia/Local).
- Fiche Bloc riche (Média Vectoriel).
- Gestion de compte (Auth, Carnet de croix, Listes).
- Contribution : Outil de tracé vectoriel sur photo.
- **Spike Tech (Phase 0):** Prototypage moteur vectoriel.

### Post-MVP Features

**Phase 2 (Growth - V1.5):**
- **Trust System:** Déploiement du score de confiance et de la modération distribuée.
- **Analytics:** Dashboard "Sarah" (Stats, Annotations, Progression).
- **Gamification Light:** Badges simples.

**Phase 3 (Expansion - V2.0):**
- **Social Core:** Chat, Commentaires, Groupes.
- **Gamification Advanced:** Gardiens de secteur, Leaderboards.
- **API Publique:** Pour partenaires Outdoor.

### Risk Mitigation Strategy
**Technical Risks (Vector Engine):** L'édition vectorielle sur mobile est complexe.
*Mitigation:* **Phase 0 (Spike Tech)** de 1 semaine dédiée exclusivement au prototypage du composant "Canvas Vector Overlay" pour valider la faisabilité UX/Perf avant le reste.

**Market Risks (Adoption):** Risque que les ouvreurs ne migrent pas.
*Mitigation:* Le MVP se focalise sur l'outil de *création* (Lucas) pour s'assurer que les contributeurs clés sont séduits par l'expérience "Meilleure que 27 Crags".

## Functional Requirements

### FR Area 1: Core & Offline Architecture
- FR-01: L'utilisateur peut installer l'application sur son device (PWA A2HS - Add to Home Screen).
- FR-02: L'application détecte automatiquement le statut réseau (Online/Offline) et adapte l'UI.
- FR-03: L'utilisateur peut télécharger explicitement un "Pack Secteur" (Données + Images + Fond de carte) pour usage offline.
- FR-04: Le système synchronise automatiquement les données locales vers le serveur lorsque le réseau est disponible (Background Sync).
- FR-05: L'utilisateur peut vider manuellement les caches et forcer une resynchronisation complète (Hard Reset pour débogage).
- FR-06: L'utilisateur peut consulter l'espace de stockage utilisé et supprimer des packs offline individuellement.

### FR Area 2: Exploration & Discovery
- FR-10: L'utilisateur peut visualiser une carte vectorielle interactive des secteurs et blocs.
- FR-11: L'utilisateur peut filtrer les blocs par critères multiples (Niveau, Style, Séchage, Poussette).
- FR-12: L'utilisateur peut rechercher un secteur ou un bloc par son nom (Recherche texte).
- FR-13: L'utilisateur peut consulter la fiche détaillée d'un bloc (Photo annotée, Description, Cotation, Historique).
- FR-14: L'utilisateur peut visualiser les tracés de départ/arrivée sur la photo du bloc.

### FR Area 3: Contribution & Edition
- FR-20: L'utilisateur authentifié peut créer un nouveau bloc (Nom, Cotation, Style obligatoire).
- FR-21: L'utilisateur peut capturer ou uploader une photo pour le bloc.
- FR-22: L'utilisateur peut dessiner des annotations vectorielles (Ligne, Départ, Sortie) sur la photo. (Fallback: Image raster si limitation technique détectée).
- FR-23: L'utilisateur peut géolocaliser le bloc avec précision (GPS Device) et affiner la position sur la carte.
- FR-24: Le système sauvegarde les créations en "Brouillon Local" si offline.
- FR-25: L'utilisateur peut suggérer une modification sur un bloc existant (Wiki-like).
- FR-26: L'utilisateur peut uploader une vidéo de démonstration (Externe: YouTube/Vimeo Link ou Upload Direct compressé).

### FR Area 4: Account & Progression
- FR-30: L'utilisateur peut créer un compte et se connecter (Email/Password + Social Auth).
- FR-31: L'utilisateur peut loguer une ascension ("Croix") avec date, style, et note personnelle.
- FR-32: L'utilisateur peut gérer des listes de blocs (Projets, Faits, Favoris).
- FR-33: L'utilisateur peut visualiser ses statistiques de progression (Graphiques temporels).
- FR-34: L'utilisateur peut ajouter des annotations textuelles sur sa timeline de stats (ex: "Blessure").
- FR-35: L'utilisateur peut configurer ses préférences de profil (Nom, Avatar, Niveau max à vue auto-déclaré).
- FR-36: L'utilisateur peut supprimer son compte et exporter ses données personnelles (Conformité GDPR).

### FR Area 5: Quality & Moderation
- FR-40: Le système détecte et signale les doublons potentiels (Proximité géographique < 5m) lors de la création.
- FR-41: Le modérateur peut visualiser une file d'attente des nouvelles soumissions.
- FR-42: Le modérateur peut comparer les soumissions avec l'existant (Diff visuel Side-by-Side).
- FR-43: Le modérateur peut Valider, Rejeter, ou Demander des corrections sur une soumission.
- FR-44: Le système notifie l'auteur du statut de sa soumission (Validé/Rejeté).
- FR-45: Les utilisateurs "Trusted Users" (Score de confiance élevé) voient leurs modifications validées automatiquement.
- FR-46: Le modérateur peut suspendre les droits d'écriture d'un utilisateur malveillant (Ban).

## Non-Functional Requirements

### Performance
- **NFR-01 (Lighthouse Performance):** Le score Lighthouse Performance sur mobile (émulation 4G) doit être supérieur à 90.
- **NFR-02 (Cold Start Offline):** L'application (App Shell) doit être interactive en moins de 1 seconde en mode Offline (démarrage depuis le cache).
- **NFR-03 (Map Smoothness):** La navigation sur la carte (pan/zoom) doit maintenir 50 FPS minimum avec 500 marqueurs affichés.
- **NFR-04 (Battery Efficiency):** L'application ne doit pas solliciter le GPS en arrière-plan (Background Location) sans action explicite de tracking, pour préserver la batterie.

### Reliability & Data Integrity
- **NFR-05 (Sync Reliability):** Le mécanisme de synchronisation doit inclure un "Exponential Backoff Retry". Aucune donnée utilisateur (Croix, Création d'un bloc) ne doit être perdue silencieusement en cas d'échec réseau.
- **NFR-06 (Conflict Resolution):** Stratégie "Last Write Wins" pour les champs simples, et "Manual Merge" (Modération) pour les conflits géographiques ou structurels.

### Security & Privacy
- **NFR-07 (Data Portability):** L'utilisateur doit pouvoir télécharger une archive JSON de toutes ses données (Contributions, Logs, Profil) sous 24h (GDPR).
- **NFR-08 (Input Sanitization):** Tous les uploads (Photos, Vidéos) et textes riches doivent être nettoyés (Sanitized) pour prévenir les attaques XSS et les métadonnées EXIF sensibles (si non désirées).

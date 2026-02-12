---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-01-20
author: Sdion
---

# Product Brief: Bleau-info

## Executive Summary

Bleau-info est une refonte technique et UX majeure de la référence existante (bleau.info), migrant d'une architecture PHP vieillissante vers une application moderne en React (PWA). L'objectif est de revitaliser la communauté de Fontainebleau en transformant une base de données statique en une plateforme visuelle et interactive. Le projet met l'accent sur l'enrichissement média "intelligent" (méthodes annotées), la reconnaissance des ouvreurs (gardiens de secteurs), et une expérience utilisateur fluide 100% hors-ligne, tout en garantissant la qualité des données via un système de modération gamifié.

---

## Core Vision

### Problem Statement

L'écosystème actuel manque d'un moyen intuitif et visuel pour documenter et explorer les blocs. La plateforme existante, bien que rapide, est techniquement obsolète, limitant le partage de médias (photos/vidéos) et la découverte interactive (cartes). Les ouvreurs ne peuvent pas valoriser facilement leurs créations, et les grimpeurs manquent d'informations visuelles cruciales.

### Problem Impact

- **Pour les Ouvreurs :** Frustration de ne pas pouvoir référencer ou illustrer correctement leurs ouvertures (photos manquantes, processus lourd).
- **Pour les Grimpeurs :** Expérience de recherche austère, manque de "beta" visuelle, difficultés d'usage en forêt (réseau).
- **Pour la Communauté :** Perte de dynamisme et d'engagement due à une interface datée.

### Why Existing Solutions Fall Short

La solution actuelle privilégie la légèreté au détriment de l'expérience utilisateur et de la richesse fonctionnelle moderne. Elle n'est pas adaptée aux usages mobiles actuels (pas de cartes interactives performantes) et rend la contribution média complexe, freinant l'aspect collaboratif.

### Proposed Solution

Une application web React PWA (Progressive Web App) centrée sur l'expérience "Page Bloc" enrichie :

1.  **Contribution Visuelle & Méthodes :** Galeries photos/vidéos annotables pour montrer les différentes méthodes de passage.
2.  **Expérience Terrain (Offline) :** Cartographie et bases de données accessibles sans réseau au fond de la forêt.
3.  **Reconnaissance & Gamification :** Pages dédiées aux ouvreurs, badges de fiabilité pour les contributeurs, et statut de "Gardien de Secteur".
4.  **Social & Gestion :** Listes personnelles (envies, croix), profils publics/privés.

### Key Differentiators

- **Approche "Media-First" Annotée :** La photo n'est pas juste une illustration, c'est un outil pédagogique (tracés de voies).
- **Fiabilité Gamifiée :** Un système de validation qui récompense les experts locaux (Fast-track) pour garantir la qualité.
- **Offline-Ready :** Conçu techniquement pour l'usage réel en forêt (zones blanches).
- **Focus Ouvreur :** Valorisation spécifique des créateurs de lignes, gardiens de l'histoire de la forêt.

---

## Target Users

### Primary Users

**1. Lucas, l'Ouvreur Connecté (20-45 ans)**
- **Profil :** Passionné local ou habitué, il ouvre régulièrement de nouvelles lignes.
- **Frustration actuelle :** Le processus archaïque par email (envoi manuel de descriptions/cotations/photos) qui prend des jours et manque de fluidité.
- **Besoin :** Un outil de soumission "terrain" (Draft sur place avec GPS/Photo) et un suivi de statut.
- **Vision du succès :** "J'ouvre un bloc, je le rentre dans l'app, et 24h après il est officiel avec ma photo."

**2. Sarah & Tom, les Performance Seekers**
- **Profil :** Elle est locale, lui est touriste international (NL/UK/DE). Ils cherchent des projets spécifiques ou des secteurs calmes.
- **Besoin :** Localisation précise, méthodes visuelles (vidéo/photo annotée), et fonction "Offline" robuste pour ne jamais se perdre.

**3. La Famille Martin (Loisir & Circuits)**
- **Profil :** Venant de Paris ou d'ailleurs, avec enfants (poussette/bas âge). Ils suivent les circuits de couleur.
- **Besoin "Logistique" (Vital) :** Trouver un secteur avec "Poussette OK", "Sable pour jouer", "Ombre".
- **Besoin Sécurité :** Accès immédiat aux numéros d'urgence et point de secours (Offline) en cas de "bobo".
- **Mode d'usage :** Préparation forte en amont (Maison/Wi-Fi) pour une journée "Zéro Stress" sur place.

### Secondary Users

**Marc, le "Sage" de la Forêt (Superviseur/Modérateur)**
- **Rôle :** Garant de la base de données et de l'histoire.
- **Enjeu :** Éviter les doublons (blocs déjà ouverts), vérifier la véracité des "Premières Ascensions", et arbitrer les conflits.
- **Besoin :** Outils de comparaison (doublons potentiels proximité GPS) et flux de validation efficace (Inbox de modération).

### User Journey : La Contribution de Lucas (Offline-First)

1.  **Terrain (Offline) :** Lucas vient de brosser un nouveau 7a au fin fond d'un secteur sans réseau. Il ouvre l'app, prend une photo, le point GPS est auto-capturé. Il rentre le nom provisoire et la cotation. L'app sauvegarde en "Brouillon Local".
2.  **Sync (Maison) :** De retour au chaud (Wi-Fi), l'app lui suggère de finaliser. Il ajoute la description, dessine la ligne sur la photo, et clique "Soumettre".
3.  **Validation :** Marc (Superviseur) reçoit une notif. L'outil lui indique "Aucun autre bloc dans un rayon de 5m". Il valide la cohérence.
4.  **Succès :** Lucas reçoit "Votre bloc est en ligne !". Il partage le lien à ses potes. Sarah le voit dans le flux "Nouveautés" et l'ajoute à sa "Liste d'envies".

---

## Success Metrics

### User Success Metrics

-   **Le "Wow" du Grimpeur (Effet Magnésie) :** Feedback visuel immédiat (tap rapide) lors de la validation d'une croix, avec une animation de "poudre de magnésie" qui marque le bloc comme réalisé. Pas de long-press (trop lent), priorité à l'instantanéité.
-   **La Fierté de l'Ouvreur (Tampon Officiel) :** Notification visuelle forte ("Tampon Officiel" apposé numériquement sur le topo) reçue sous 48h max après validation.
-   **Confiance :** Perception immédiate du "Label Qualité" sur les données vérifiées.

### Business Objectives

-   **Objectif Principal :** Devenir la référence absolue en termes de **Qualité de Donnée** (Vérité terrain) et non de quantité/croissance.
-   **Objectif Communautaire :** Créer un cercle vertueux de contributeurs de confiance (Trusted Users) qui s'auto-régulent.
-   **Efficacité Opérationnelle :** Réduire drastiquement la friction administrative pour les bénévoles/modérateurs.

### Key Performance Indicators (KPIs)

1.  **Time-to-Publish :** 90% des nouveaux blocs validés en < 48h (vs jours actuellement).
2.  **Taux de "Trusted Users" :** % de blocs validés semi-automatiquement grâce au statut de confiance (Indicateur de maturité de la communauté).
3.  **Qualité / Rollback Rate :** Moins de 1% de blocs devant être supprimés/modifiés *après* validation publique (Preuve que le filtre amont fonctionne).

---

## MVP Scope

### Core Features (V1)
1.  **Exploration (React PWA) :** Carte interactive, listes de secteurs/blocs, recherche filtrée (Niveau, Poussette...), mode Offline.
2.  **Contribution "Terrain" :** Soumission de nouveaux blocs avec géolocalisation, photos, et brouillons locaux (sans réseau).
3.  **Carnet de Croix :** Enregistrement des répétitions avec l'effet visuel "Magnésie" (Feedback immédiat).
4.  **Gestion Compte :** Profil grimpeur simple, listes (Envies / Réalisations).
5.  **Back-Office Modération :** Interface pour Marc (Superviseur) pour valider/rejeter les soumissions et gérer les signalements.

### Out of Scope for MVP (Reporté à la V2)
-   **Messagerie / Chat :** Pas de social direct entre membres pour l'instant.
-   **Gamification Avancée :** Le système de "Gardiens de Secteur" et badges complexes attendra que la communauté mûrisse.
-   **Import de Masse :** Pas de migration automatique de tout l'historique bl.info. Test éventuel sur 1 secteur pilote, mais pas de "Big Bang" data.

### MVP Success Criteria
-   **Adoption Modération :** Les superviseurs valident les soumissions sans friction (<2 min/bloc).
-   **Fiabilité Offline :** 0 perte de données (brouillons) lors du retour en zone couverte.
-   **Engagement :** Les utilisateurs cliquent sur "Ajouter à ma liste" ou "Croix" régulièrement (preuve d'utilité).

### Future Vision
Une plateforme communautaire complète où les "Gardiens" gèrent leurs secteurs en autonomie, avec des features sociales (chat, sorties groupes) et une couverture exhaustive de la forêt, devenant l'outil par défaut du grimpeur bleausard.

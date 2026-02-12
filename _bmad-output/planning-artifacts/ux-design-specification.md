---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response, step-05-inspiration, step-06-design-system, step-07-defining-experience, step-08-visual-foundation, step-09-design-directions, step-10-user-journeys, step-11-component-strategy, step-12-ux-patterns, step-13-responsive-accessibility]
inputDocuments: 
  - "_bmad-output/planning-artifacts/product-brief-Bleau-info-2026-01-20.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "Figma: https://www.figma.com/design/BYQ01RksjUoC6TF5Jvyjlf/Bleau.info?node-id=0-1&m=dev"
---

# UX Design Specification - Bleau-info

**Author:** Sdion
**Date:** 2026-01-20

---

## Executive Summary

### Project Vision
**Bleau-info** est le "Google Maps du Grimpeur" : une PWA qui fusionne la fiabilité d'un topo papier avec la puissance du numérique (Vecteur, Recherche, Social). L'expérience doit être fluide ("Zero-Latency"), robuste (Offline-First) et visuellement éclatante mais fonctionnelle en forêt.

### Target Users
- **Lucas (Contributeur):** Besoin d'outils de création précis et rapides sur mobile.
- **Famille Martin (Explorateur):** Besoin de clarté, de filtres simples et de réassurance (Secours).
- **Sarah (Analyste):** Besoin de data viz claire et lisible sur petit écran.

### Key Design Challenges
1.  **Outdoor Readability (Le défi "Plein Soleil"):** L'interface doit rester lisible avec une luminosité ambiante forte. Le contraste est la priorité n°1.
    *   **Stratégie Map:** Le mode "Clair" (Light Mode High Contrast) est le défaut pour l'usage diurne afin de combattre les reflets. Le "Dark Mode" est conservé pour la préparation nocturne ou l'économie d'énergie.
2.  **Vector Interaction (Le défi "Gros Doigts"):** Dessiner des traits précis sur un écran de 6 pouces demande une UX tolérante (loupe, snap-to-grid, undo).
3.  **Trust & Status (Le défi "Modération"):** Visualiser clairement qui est "Trusted" sans alourdir l'UI avec trop de badges.

### Design Opportunities
- **"High Contrast" System:** Une palette de couleurs vibrante (Orange sécurité / Bleu électrique) qui "pop" sur les fonds de carte et les photos de rocher gris.
- **Micro-Interactions "Satisfying" :** Feedback haptique et visuel fort lors du log d'une croix (Explosion de particules style "Magnésie").

## Core User Experience

### Defining Experience (The Forest Log)
L'expérience centrale est la capacité "Zero-Friction" de contribuer ou consommer du contenu au cœur de la forêt. L'utilisateur sort son téléphone, l'app est immédiatement prête (pas de loading), géolocalisée sur le bon secteur. Il peut tracer une ligne vectorielle ou loguer une ascension en moins de 60 secondes, avec une seule main disponible si besoin.

### Platform Strategy
- **Primary:** Mobile PWA (iOS/Android). Usage vertical, tactile, extérieur.
- **Secondary:** Desktop Web. Usage "Préparation" (Planification) et "Analyse" post-session (Grand écran pour les stats).
- **Constraint:** Pas de store natif obligatoire (distribution web directe), mais UX "App-like" exigée (Gestures, Transitions fluides).

### Effortless Interactions
- **Invisible Sync:** La synchronisation des données (Upload/Download) est totalement transparente. Pas de bouton "Sync", pas de barre de progression bloquante. L'app gère la complexité réseau en arrière-plan.
- **Smart Location:** L'ouverture de l'app zoome automatiquement sur le secteur pertinent via Geofencing local, éliminant l'étape fastidieuse de recherche/zoom manuel.

### Critical Success Moments
- **The "Fat Finger" Test:** L'outil de dessin vectoriel doit tolérer l'imprécision tactile (Magnésie, Doigts froids). L'assistance logicielle (Snap-to-grip, Lissage) est vitale pour éviter la frustration.
- **Survival Check:** En cas d'urgence, l'accès aux infos de secours (Point SOS) doit se faire en < 3 taps, même sans réseau.

### Experience Principles
1.  **Confidence in Constraints:** L'interface communique clairement et positivement l'état des données ("Saved Locally") pour rassurer l'utilisateur en zone blanche.
2.  **Legibility is Safety:** Le design graphique ne doit jamais sacrifier la lisibilité (Contraste, Taille de police) au profit de l'esthétique pure.
3.  **Speed implies Quality:** Toute interaction > 200ms doit avoir un feedback immédiat. La sensation de vitesse construit la confiance technique.

## Desired Emotional Response

### Primary Emotional Goals
**Unstoppable Flow:** L'émotion dominante est la fluidité. L'utilisateur se sent "augmenté" par une application qui ne le ralentit jamais. Le manque de réseau n'est pas une barrière. L'outil s'efface devant l'action de grimper.

### Emotional Journey Mapping
1.  **Ouverture (The Relief):** "Ouf, ça marche instantanément même ici." (Sécurité).
2.  **Action (The Flow):** "C'est facile, je ne réfléchis pas." (Compétence).
3.  **Completion (The Pride):** "J'ai laissé ma trace." (Accomplissement).

### Micro-Emotions
- **Trust:** Sentiment constant que les données sont en sécurité (Feedback "Saved").
- **Belonging:** Sentiment de contribuer à un "bien commun" (La qualité de la base de données).

### Design Implications
- **No Spinners:** Remplacer les loaders par des squelettes UI ou des états optimistes immédiats pour maintenir le sentiment de Flow.
- **Celebration:** Feedback visuel riche (Confettis/Haptique) lors de la création d'un bloc, pour renforcer la "Builder Pride".

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis
1.  **Boolder (The Local Gold Standard):** 
    *   *Success:* La hiérarchie visuelle Map-First. On zoome : Forêt > Secteur > Rocher > Ligne. C'est le modèle mental naturel du grimpeur.
    *   *Visuals:* Utilisation parfaite des codes couleurs de circuits (Jaune, Orange, Bleu) en pointillés sur la carte.
2.  **Strava (The Social Flow):**
    *   *Success:* La "Bottom Sheet" fluide qui affiche le détail sans couper le contexte cartographique. Le sentiment de "Flow" et de célébration de l'effort.
3.  **Linear (The Snappy Feel):**
    *   *Success:* L'**Optimistic UI**. Tout est instantané. La synchronisation est un détail d'implémentation invisible pour l'utilisateur.
4.  **AllTrails (The Accessible Outdoors):**
    *   *Success:* Les "Chips" de filtrage (Tags) immédiatement accessibles pour rassurer les familles (Chien autorisé, Facile, etc.).

### Transferable UX Patterns
*   **Hierarchical Map Zoom (Boolder):** Adoption du comportement de zoom progressif pour révéler la densité d'information sans surcharger (Clusters de secteurs > Rochers individuels).
*   **Contextual Bottom Sheets (Strava):** Affichage des détails du bloc dans un volet glissant, gardant la carte visible pour l'orientation.
*   **Smart Filter Chips (AllTrails):** Barre de filtres horizontale pour les critères contextuels (Séchage, Poussette).

### Anti-Patterns to Avoid
*   **Tabular Contribution (27 Crags):** Forcer l'utilisateur à remplir des formulaires/listes textuelles pour créer un bloc. C'est une rupture cognitive par rapport au terrain. La création doit se faire *sur la photo* ou *sur la carte*.
*   **Blocking Modals:** Usage de popups bloquantes en plein "Flow".

### Design Inspiration Strategy
**Adopt:** L'architecture de navigation cartographique de Boolder (C'est ce que les users attendent).
**Adapt:** Le système de "Trust" de StackOverflow/Waze, simplifié pour le contexte outdoor (Badges simples).
**Avoid:** La lourdeur "Admin" des bases de données classiques. Tout doit ressembler à un jeu ou une exploration.

## Design System Foundation

### 1.1 Design System Choice
**Tailwind CSS + Shadcn/UI (Radix Primitives)**

### Rationale for Selection
1.  **Zero-Runtime Performance:** Tailwind génère du CSS statique, crucial pour minimiser le JS parsing sur les mobiles outdoor (Batterie/Perf).
2.  **Offline-Ready:** Pas de chargement dynamique de styles. L'App Shell est léger et immédiat.
3.  **Accessible by Default:** Shadcn (via Radix) garantit que les composants interactifs (Dialogues, Sliders) sont 100% accessibles, un pré-requis du projet.
4.  **High Contrast Control:** Tailwind permet une gestion fine et atomique des palettes de couleurs pour le mode "Plein Soleil".

### Implementation Approach
- **Utility-First:** Styling via classes utilitaires pour la rapidité d'itération.
- **Component Ownership:** On copie le code des composants Shadcn dans le projet (`/components/ui`), ce qui permet une personnalisation totale (ex: agrandir les zones de touch pour l'usage extérieur) sans dépendre d'une lib tierce opaque.
- **Dark Mode:** Utilisation de la stratégie `class="dark"` de Tailwind pour gérer le mode nuit.

### Customization Strategy
- **Typography:** **Onest** (Google Fonts). Une sans-serif moderne et géométrique, choisie pour son caractère distinctif et sa lisibilité.
- **Colors:** Définition de tokens sémantiques `bg-outdoor-high-contrast` pour les éléments critiques.
- **Radius:** Arrondis prononcés (`rounded-xl`) pour un feel "Friendly/Moderne".

## Defining Core Experience
### Defining Experience (The Vector Log)
L'interaction signature est le "Vector Log" : le tracé digital d'une ligne d'escalade sur une photo réelle. C'est l'équivalent du "Graffiti Digital". L'utilisateur ne "remplit" pas une base de données, il "dessine" sur le monde réel.

### User Mental Model
*   **Model:** "Doigt dans le sable". L'utilisateur s'attend à une interaction directe 1:1. Là où je mets mon doigt, la ligne apparaît.
*   **Expectation:** Tolérance à l'erreur. Pas besoin d'être un graphiste. Le système doit "embellir" mon geste maladroit (lissage).

### Success Criteria
*   **Speed:** Photo -> Ligne validée en < 10 secondes.
*   **Accuracy:** 90% de réussite du premier coup (pas besoin d'effacer/recommencer) grâce à l'assistance logicielle.
*   **Flow:** Aucune modale bloquante pendant le dessin.

### Novel UX Patterns
*   **Touch-Down Magnifier:** Une "Loupe déportée" apparaît dans un coin de l'écran (et non sous le doigt) dès que l'utilisateur touche la photo, permettant de voir précisément le point de contact sans que le doigt ne masque l'action.
*   **Smart Smoothing:** Le trait brut est instantanément lissé (Bézier simplifié) pour donner un aspect "Pro" au gribouillage.

### Experience Mechanics
1.  **Initiation:** Bouton flottant "Tracer Ligne" sur l'écran "Photo Preview".
2.  **Interaction:** 
    *   *Touch:* Apparition Loupe.
    *   *Drag:* Tracé du trait rouge vif.
    *   *Release:* Fin du tracé, le trait devient solide/blanc (ou couleur cotation).
3.  **Feedback:** Haptique vibration légère à chaque point anguleux ou "Snap".
4.  **Completion:** Un mini-popup non-modal demande confirmation de la cotation.

## Visual Design Foundation

### Color System
*   **Primary Action (Safety Orange):** `#FF6B00` (Orange Bleau Historique). Un orange haute visibilité pour les actions principales (Fab, Save) et le balisage des circuits.
*   **Surface Light:** `Pure White` (#FFFFFF) pour un contraste maximal en plein soleil.
*   **Surface Dark:** `Zinc-950` (#09090B) ou équivalent. **Pas de True Black** (#000000) pour éviter le "Black Smearing" sur OLED et réduire la fatigue oculaire, tout en restant très contrasté.
*   **Semantic Colors:**
    *   *Circuit Jaune:* Post-it Yellow (Visible sur fond sombre).
    *   *Circuit Bleu:* Sky Blue.
    *   *Circuit Rouge:* Danger Red.

### Typography System
*   **Font Family:** **Onest** (Google Fonts). Une sans-serif moderne, géométrique mais avec du caractère ("Smart & Modern"), moins générique qu'Inter.
*   **Base Size:** `16px` (Body). Focus absolu sur la lisibilité extérieure.
*   **Heading:** `Bold` et serré pour les titres de blocs.

### Spacing & Layout Foundation
*   **Spacing Unit:** Base `4px`.
*   **Touch Targets:** Minimum `48px` pour toutes les zones cliquables (Standard Apple/Google dépassé de 4px pour assurer le confort "Gros Doigts").
*   **Layout:** "Airy". Pas de listes compactes. Chaque élément respire.

### Accessibility Considerations
*   **Contrast Ratios:** Vérification stricte AAA pour les textes sur fond orange (souvent problématique, l'orange sera utilisé en background uniquement avec texte noir ou en bouton large).
*   **Dark Mode:** Support natif complet, activable via un toggle rapide dans le header (pas enfoui dans les settings).

## Design Direction Decision

### Design Directions Explored
1.  **Map-First Utility:** Carte plein écran 100%, tout en overlay. Focus vitesse.
2.  **Immersive Guide:** Focus visuel/magazine, carte secondaire.
3.  **Hybrid Sheet:** Carte persistante + Bottom Sheets interactives pour le contenu riche.

### Chosen Direction
**Direction 3: Hybrid Sheet "Google Maps Style"**

### Design Rationale
*   **Best of Both Worlds:** Maintient le contexte géographique (Orientation) tout en offrant une surface riche pour le contenu (Topos/Photos) via les volets extensibles.
*   **One-Handed Ergonomics:** Les Bottom Sheets sont naturellement accessibles au pouce, idéal pour l'usage forêt.
*   **Familiarity:** Patterns standards (Google Maps, Strava) réduisant la charge cognitive.

### Implementation Approach
*   **Interactive Sheet:** 3 états (Peek = Nom, Half = Infos clés, Full = Détails complets).
*   **Map Interaction:** Le touch sur la carte réduit automatiquement la sheet à l'état "Peek".

## User Journey Flows

### Journey 1: La Création "Flash" (Lucas)
Objectif : Ajouter un bloc repéré en < 1 minute sur le terrain.
**Optimization:** Remplacement du Long Press par un FAB "+" explicite pour l'affordance.

```mermaid
graph TD
    A[Map View] -->|Tap FAB (+)| B{Mode Selection}
    B -->|Nouvelle Ligne| C[Camera View]
    C -->|Snap Photo| D[Photo Preview]
    D -->|Tap 'Dessiner'| E[Interaction Dessin]
    E -->|Touch| F[Loupe Appraît]
    E -->|Drag| G[Tracé Assisté]
    E -->|Release| H[Ligne Validée]
    H -->|Tap 'Save'| I[Minimal Form]
    I -->|Select Cotation| J[Valider]
    J -->|Confetti Feedback| A
```

### Journey 2: L'Exploration "Entonnoir" (Famille Martin)
Objectif : Trouver un bloc adapté sans être noyé sous l'information.
pattern: **Progressive Disclosure**.

```mermaid
graph TD
    A[Global Map] -->|Zoom In| B[Secteurs Clusters]
    B -->|Tap Cluster| C[Zoom Secteur]
    C -->|Affichage Rochers| D[Map Detail]
    D -->|Tap Rocher| E[Bottom Sheet (Peek)]
    E -->|Affiche Nom/Cotation| E
    E -->|Pull Up| F[Bottom Sheet (Half)]
    F -->|Affiche Liste Voies| F
    F -->|Tap Voie| G[Bottom Sheet (Full)]
    G -->|Affiche Topo/Photo| G
```

### Journey 3: Le "Tick" Rapide (Sarah)
Objectif : Marquer une réussite sans friction.
**Safety:** Swipe gestuel pour la rapidité + Undo Toast pour l'erreur.

```mermaid
graph LR
    A[Bloc Details Card] -->|Swipe Right| B[Action 'Tick']
    B -->|Feedback Haptique| C[Toast 'Réussite Ajoutée']
    C -->|Tap Undo (3s)| D[Annuler Action]
    C -->|Wait 3s| E[Sync Background]
```

### Journey 4: The "Pre-load" (Offline Prep)
Objectif : Garantir l'expérience offline avant le départ.

```mermaid
graph TD
    A[Home Wifi] -->|App Launch| B{Check Offline Status}
    B -->|Zone Non-Downloaded| C[Banner 'Save Area?']
    C -->|Tap Download| D[Download Manager (Background)]
    D -->|Complete| E[Notification 'Ready for Forest']
    E -->|User Arrives Forest| F[Auto-Switch Offline Mode]
```

### Journey Patterns
*   **Navigation:** Map-Centric. Toujours un moyen de revenir à la carte en 1 tap (ou swipe down sheet).
*   **Feedback:** "Optimistic UI" partout. On valide l'action visuellement avant la confirmation serveur.
*   **Error Recovery:** "Toast Undo" plutôt que "Are you sure?" modal.

### Flow Optimization Principles
1.  **Bottom Sheet Physics:** L'interaction avec les volets doit être élastique et naturelle (Spring animations).
2.  **Context Preservation:** Ne jamais masquer totalement la carte si ce n'est pas nécessaire.

## Component Strategy

### Design System Components (Shadcn/UI Base)
We leverage standard components for 80% of the UI:
*   **Dialogs & Drawers:** Base pour les modales bloquantes (Settings, Login).
*   **Forms:** Inputs, Selects, Switches pour l'édition de profil/filtres.
*   **Feedback:** Toasts pour les notifications (Undo, validations).

### Custom Components (The "Core 20%")

#### 1. `MapSheet` (Interactive Drawer)
*   **Purpose:** The main content container that lives *over* the map without blocking it.
*   **Tech Stack:** **Vaul** (React Library) for native-like iOS drawer physics.
*   **States:**
    *   *Peek:* Affiche juste le nom du rocher (Map reste interactive).
    *   *Half:* Affiche la liste des voies (Scrollable).
    *   *Full:* Affiche le topo complet (Immersive).

#### 2. `TopoViewer` (Display)
*   **Purpose:** Affichage performant des lignes sur la Map/Cards.
*   **Tech:** SVG léger superposé à l'image. Pas de logic d'édition.
*   **Optimization:** Lazy-loading.

#### 3. `TopoEditor` (Interaction)
*   **Purpose:** L'interface de création "Vector Log".
*   **Features:** Canvas interactif, Loupe déportée, Smoothing de tracé, Undo stack.
*   **Load:** Chargé uniquement à la demande (Code Splitting).

#### 4. `OfflineStatus` (System Feedback)
*   **Purpose:** Rassurer l'utilisateur sur son état de connexion et les données disponibles.
*   **UI:** "Pill" discret en haut d'écran (ex: "Offline • Zone Downloaded").

### Component Implementation Strategy
*   **Touch Targets:** Override global des styles Shadcn pour garantir `min-height: 48px` sur tous les boutons (Outdoor usage).
*   **Accessibility:** Gestion stricte du "Focus Trap" dans le `MapSheet` (Active uniquement en mode Half/Full).

### Implementation Roadmap
1.  **Phase 1 (Exploration):** `MapSheet` + `TopoViewer` + `OfflineStatus`. Permet de naviguer et voir le contenu.
2.  **Phase 2 (Creation):** `TopoEditor`. Permet de contribuer.

## UX Consistency Patterns

### Button Hierarchy (Law of Thick Thumb)
*   **Rule:** Minimum touch target `48x48px` pour TOUS les éléments interactifs.
*   **Implication:** Padding vertical forcé sur les listes et inputs Shadcn (`py-4`).
*   **Primary:** Orange Solide (Fab, Save).
*   **Secondary:** Ghost/Outline (Cancel, Back).
*   **Tertiary:** Text-only (Links).

### Feedback Patterns (Law of Optimistic Feedback)
*   **Rule:** Zero-latency UI. On n'attend pas le serveur.
*   **Implementation:**
    1.  User clique "Tick".
    2.  UI met à jour le compteur + Confetti (Immédiat).
    3.  Requete réseau en background.
    4.  Si échec réseau -> Toast discret "Saved offline".

### Modal Patterns (Law of Context Preservation)
*   **Rule:** Ne jamais bloquer la vue Carte inutilement.
*   **Preference:** `Sheet` (Bottom/Side) > `Dialog` (Center Modal).
*   **Exceptions:** Login critique, Delete confirmation (si critique), Settings globaux.

### Error Recovery (Law of Safe Undo)
*   **Rule:** "Toast Undo" > "Confirm Modal".
*   **Scenario:** Suppression d'une croix.
    *   *Avant:* Popup "Are you sure?".
    *   *Après:* Suppression immédiate + Toast "Croix supprimée. [Annuler]".

## Responsive Design & Accessibility

### Responsive Strategy

#### Multi-Device Adaptation
*   **Mobile (Priority #1):** Pattern "Map + Bottom Sheet". Tout est contrôlable au pouce. L'interface est superposée à la carte pour maximiser la surface visible.
*   **Desktop (Admin/Explore):** Pattern "Map + Side Panel".
    *   **Layout:** La carte occupe 100% de l'écran. Le contenu riche (Listes, Topos) s'ouvre dans un **Panneau Latéral à Droite** (Largeur fixe ~400px ou 30% viewport), surmontant la carte.
    *   **Rationale:** Le panneau à droite est demandé spécifiquement (préférence utilisateur vs standard Google Maps à gauche).

#### Breakpoint Strategy
*   **Mobile:** < 768px (`md`). Interface Bottom Sheet.
*   **Tablet/Desktop:** >= 768px. Interface Side Panel (Right).
*   **Orientation:** En mode paysage mobile, la Bottom Sheet bascule automatiquement en Side Panel à Droite pour éviter de masquer toute la hauteur de la carte.

### Accessibility Strategy

#### The "Outdoor" Standard (AAA Focus)
*   **Contrast:** Exigence AAA (Ratio 7:1) pour tout texte critique. On privilégie le noir pur sur blanc pur ou sur orange vif.
*   **No Grey Text:** Le gris clair (`text-zinc-400`) est interdit pour les informations essentielles (illisible au soleil). On utilise du `zinc-600` minimum.

#### Colorblind Support (Circuits)
*   **Problem:** En forêt, distinguer un balisage rouge d'un bleu peut être dur pour les daltoniens.
*   **Solution:** **Double Codage**. Chaque couleur de circuit est associée à une forme géométrique unique sur la carte et l'UI.
    *   🟡 Jaune = Triangle
    *   🔵 Bleu = Rond
    *   🔴 Rouge = Carré
    *   ⚪️ Blanc = Losange

### Testing Strategy
*   **Real World Test:** Tests obligatoires en extérieur par temps ensoleillé (simulateur de luminosité max).
*   **Fat Finger Validation:** Test des zones de clique avec des gants fins (usage hivernal).

### Implementation Guidelines
*   **Touch Targets:** `min-height: 48px` et `min-width: 48px` forcés sur tous les éléments interactifs via CSS global.
*   **Focus Management:** Le focus clavier doit être piégé dans le Side Panel/Sheet quand il est ouvert pour la navigation au clavier/lecteur d'écran.

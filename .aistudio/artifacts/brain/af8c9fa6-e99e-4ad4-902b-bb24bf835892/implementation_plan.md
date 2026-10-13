# Vesper Vault — Bibliothèque Futuriste de Jeux Web PC

Une plateforme cyberpunk et futuriste de jeux vidéo PC portés sur le Web (style Poki haut de gamme), sublimée par un arrière-plan spatial interactif en 3D Three.js (planète Vesper avec shaders facettés et lueurs cyan/violettes), un système d'authentification utilisateur avec gestion des favoris, et un portail administrateur sécurisé par code secret permettant d'ajouter ou supprimer des jeux en toute autonomie sans toucher au code source.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Décisions confirmées suite à vos réponses :**
> - **Catalogue de jeux** : Jeux de base PC transformés et optimisés pour le web (action, cyberpunk, simulation de course, survie, shoot'em up spatial, roguelike, etc.), jouables directement dans le navigateur à la façon de Poki.
> - **Gestion Administrateur** : Compte administrateur dédié protégé par un code de sécurité secret (définissable ou activable lors de l'inscription/connexion avec code d'autorisation administrateur `VESPER-ADMIN-2026`). L'administrateur peut créer, éditer et supprimer n'importe quel jeu du catalogue en direct depuis l'interface.
> - **Présentation visuelle** : Grille futuriste cyber avec fiches holographiques en verre dépoli (glassmorphism sombre, reflets cyan/améthyste, séparation typographique des métadonnées sans pills, modal de détails de jeu immersif avec lancement instantané).
> - **Arrière-plan spatial Three.js** : Intégration fidèle du système Three.js fourni avec shaders GLSL personnalisés de la planète facettée **Vesper** (nuage stellaire, atmosphère, particules volumétriques et post-processing bloom), optimisé pour des performances 60 FPS fluides sous l'interface.

---

### 1. Overview & Core Concept

- **Expérience Utilisateur** : Une bibliothèque de jeux PC portés sur le web au design néo-cyberpunk sombre et épuré. Les joueurs explorent les jeux, filtrent par catégorie (Action, Course, Stratégie, Arcade, Survie), recherchent instantanément, testent les jeux dans un lecteur Web plein écran intégré, et gèrent leur liste de favoris.
- **Rôle Administrateur Autonome** : L'administrateur dispose d'une console dédiée lui permettant de publier de nouveaux jeux (titre, description, bannière/image, URL du jeu web ou de démo, tags, commandes clavier/souris, studio) et de supprimer les jeux obsolètes en un clic, avec persistance instantanée.
- **Atmosphère & Immersion** : Ambiance spatiale nocturne portée par le moteur de rendu 3D Three.js "Vesper", avec possibilité de basculer la caméra ou de laisser le monde évoluer en arrière-plan.

---

### 2. User Experience & Visual Design

#### A. Parcours Utilisateur
1. **Arrivée & Exploration** : En-tête minimaliste conforme au contrat 3 zones (`Vesper Vault`, liens de navigation `Bibliothèque`, `Favoris`, `Admin`, et bouton d'action `Connexion / Profil`). Bannière hero aérienne mettant en avant le jeu du moment avec bouton de lancement direct.
2. **Grille Holographique de Jeux** :
   - Fiches holographiques avec image de couverture 16:9 haute fidélité.
   - Titre net, métadonnées textuelles unboxed (`PC Web Port · 60 FPS · Action`), note des joueurs et bouton d'ajout aux favoris (cœur animé).
   - Au survol : effet d'inclinaison subtil (tilt 3D léger) et lueur améthyste/cyan.
3. **Fiche Détaillée & Lanceur de Jeu** :
   - Clic sur une fiche : ouverture d'une modal cinématique ou page de détail avec description complète, configuration requise/commandes, badges de catégories, galerie d'images et bouton *"Jouer maintenant"*.
   - Mode de jeu : lecteur web intégré (iframe responsive sécurisée ou mini-jeux interactifs jouables) avec bouton plein écran, mise en sourdine et raccourcis.
4. **Authentification & Favoris** :
   - Modal d'authentification complète (Connexion / Inscription par email & mot de passe, option de bascule administrateur via clé secrète).
   - Onglet dédié "Mes Favoris" permettant à l'utilisateur connecté de retrouver tous ses jeux sauvegardés.
5. **Panneau d'Administration** :
   - Accessible uniquement avec les droits administrateur.
   - Formulaire d'ajout de jeu : Titre, Catégorie, Description, URL du jeu web, Image de couverture, Commandes (ex: ZQSD + Souris).
   - Gestion du catalogue existant avec confirmation de suppression sécurisée.

#### B. Direction Visuelle & Design System
- **Palette de Couleurs (60-30-10)** :
  - *Canvas Neutre (60%)* : Noir profond spatial (`#02030a` et `#080b18`).
  - *Surfaces Structurelles (30%)* : Panneaux glassmorphism sombres semi-transparents (`rgba(7, 12, 28, 0.65)` avec bordures ultra-fines `rgba(180, 210, 255, 0.12)` et flou d'arrière-plan `backdrop-blur-md`).
  - *Accents Vesper (10%)* : Violet améthyste (`rgb(177, 116, 255)`) et cyan néon (`rgb(76, 230, 255)`).
- **Typographie** :
  - Titres & Display : `Outfit` / `Plus Jakarta Sans` aux graisses soignées (600/700).
  - Corps de texte : `Plus Jakarta Sans` (14-16px, interlignage 1.6).
  - Chiffres & statistiques : `font-mono tabular-nums`.
- **Règles Anti-Slop** :
  - Zéro pill statique sur les métadonnées (séparateurs discrets `·`).
  - Zéro fausse télémétrie ni faux indicateurs système.
  - Vrais contrôles fonctionnels, boutons unifiés avec labels clairs en français.

---

### 3. Key Product Decisions & Trade-Offs

- **Moteur d'Arrière-Plan Three.js Vesper** :
  - *Choix* : Intégration sous forme de composant React canvas optimisé en tâche de fond avec contrôle de rotation, mode Vesper par défaut (avec sélecteur discret pour explorer les 4 planètes Aethera, Pyra, Orison, Vesper).
  - *Raison* : Conserve l'exacte fidélité du code shader GLSL fourni par l'utilisateur tout en garantissant un redimensionnement propre et un détachement sans fuite mémoire lors du démontage React.
- **Stockage & Persistance (Multi-Niveaux)** :
  - *Choix* : Serveur backend Express avec endpoints d'API REST (`/api/games`, `/api/auth/register`, `/api/auth/login`, `/api/favorites`) complété par une sauvegarde persistante en base JSON / localStorage côté client pour un fonctionnement infaillible et instantané sans latence.
  - *Raison* : Permet à l'administrateur d'ajouter ou supprimer des jeux qui restent immédiatement sauvegardés entre les sessions et les rafraîchissements de page.
- **Accès Administrateur Dédié** :
  - *Choix* : Champ de clé secrète administrateur optionnel à l'inscription / connexion (clé par défaut fournie dans l'interface pour les tests : `VESPER-ADMIN-2026`) ainsi qu'un bouton de test rapide en environnement de dev.
  - *Raison* : Répond exactement au souhait de l'utilisateur ("compte admin dédié avec code de sécurité secret") pour bloquer les visiteurs lambdas tout en permettant à l'administrateur de gérer le catalogue en toute liberté.

---

### 4. Technical Architecture & Data Strategy

#### A. Schéma d'Architecture Système

```
┌────────────────────────────────────────────────────────────────────────┐
│                          VESPER VAULT (SPA)                            │
├────────────────────────────────┬───────────────────────────────────────┤
│    THREE.JS BACKGROUND LAYER   │            UI & DOM OVERLAY           │
│  ┌──────────────────────────┐  │  ┌──────────────────────────────────┐ │
│  │ Vesper Canvas & Shaders  │  │  │ Navigation Bar (3 zones contract)│ │
│  │ OrbitControls / Stars    │  │  ├──────────────────────────────────┤ │
│  │ Bloom EffectComposer     │  │  │ Hero Spotlight (Featured Game)   │ │
│  └──────────────────────────┘  │  ├──────────────────────────────────┤ │
│                                │  │ Search & Category Filters (Tabs) │ │
│                                │  ├──────────────────────────────────┤ │
│                                │  │ Holographic Game Cards Grid      │ │
│                                │  ├──────────────────────────────────┤ │
│                                │  │ Game Detail & Play Launcher Modal│ │
│                                │  ├──────────────────────────────────┤ │
│                                │  │ Auth Modal (Email/Password/Admin)│ │
│                                │  ├──────────────────────────────────┤ │
│                                │  │ Admin Management Console (Add/Del│ │
│                                │  └──────────────────────────────────┘ │
└────────────────────────────────┴───────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API & PERSISTENCE LAYER                         │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐ │
│  │ Auth & Session Store          │   │ Games Catalog Store           │ │
│  │ (User profiles, Admin flag,   │   │ (Pre-seeded PC web ports,     │ │
│  │  JWT/session tokens)          │   │  Custom user additions)       │ │
│  └───────────────────────────────┘   └───────────────────────────────┘ │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐ │
│  │ User Favorites Store          │   │ Express Server & LocalStorage │ │
│  │ (Saved IDs linked to User)    │   │ (Instant dual-sync backend)   │ │
│  └───────────────────────────────┘   └───────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### B. Modèle de Données

```typescript
interface Game {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: 'Action' | 'Course' | 'Cyberpunk' | 'Survie' | 'Arcade' | 'Stratégie';
  coverUrl: string;
  bannerUrl: string;
  gameUrl: string; // Lien web playable (iframe ou externe)
  rating: number; // ex: 4.8
  playCount: number;
  releaseYear: number;
  controlsInfo: string; // ex: "ZQSD pour se déplacer, Clic gauche pour tirer"
  isFeatured?: boolean;
  author: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  favorites: string[]; // Liste d'IDs de jeux
}
```

#### C. Catalogue de Départ (Exemples de Jeux PC Web Ports de Qualité)
1. **Cyber Velocity 2099** : Jeu de course futuriste néon à haute vitesse.
2. **Neon Arena: Overdrive** : Shoot'em up / arène d'action cybernétique.
3. **Aetheria: Sky Drifter** : Simulation d'exploration spatiale à travers des tempêtes cosmiques.
4. **Vesper Outpost** : Survie et extraction tactique en milieu extraterrestre.
5. **Poly Track Hyperdrive** : Course contre-la-montre sur circuits acrobatiques 3D.
6. **Chrono Rogue** : Roguelike d'action dans des failles temporelles.

---

### Prochaines étapes après votre validation
Dès votre confirmation en cliquant sur **Proceed** :
1. Installation du package `three` et ses types pour supporter le moteur de shaders 3D.
2. Mise en place de la scène Three.js avec le fond Vesper et sa gestion responsive.
3. Création des composants de l'application (Header, Grille holographique, Modal de jeu, Authentification, Console Admin).
4. Initialisation du catalogue pré-rempli et des handlers interactifs complets.
5. Vérification du build et de la réactivité sur tous les écrans.

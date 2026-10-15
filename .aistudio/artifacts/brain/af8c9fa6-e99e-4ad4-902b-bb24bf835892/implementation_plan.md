# Mode Privé/Public, ID Firebase Admin, Code HTML Lourd Dédié, Sauvegardes Cloud Automatiques & Suivi du Temps de Jeu

Système complet permettant à l'administrateur de gérer la visibilité des jeux (publics ou privés pour tests), de visualiser et copier les identifiants Firebase de chaque jeu, d'intégrer des codes HTML très volumineux (comme les builds Unity WebGL Cuphead) via un fichier dédié sans limite de caractères, d'intercepter automatiquement les téléchargements de sauvegardes pour les stocker sur le compte utilisateur avec un tiroir de gestion, et de suivre le temps de jeu cumulé de chaque utilisateur connecté.

---

### Décisions Validées & Choix Utilisateur

> [!IMPORTANT]
> Les options suivantes ont été confirmées lors de la phase de clarification :
> - **Code HTML lourd** : Fichier dédié `src/data/customEmbeddedGames.ts` avec variable exportée `CUSTOM_GAME_HTML_CODE` et indication exacte de la ligne où coller le code.
> - **Gestion des sauvegardes** : Tiroir dédié (drawer latéral) intégré dans le lecteur de jeu affichant l'historique des sauvegardes horodatées, le téléchargement direct et l'import manuel.
> - **Affichage du temps de jeu** : Affiché en priorité sur chaque carte de jeu du catalogue et dans la fenêtre de détails pour tout utilisateur connecté.

---

### 1. Vue d'Ensemble & Fonctionnalités

1. **Mode Public / Privé (Tests Admin exclusifs)** :
   - Ajout d'un statut `isPrivate` (ou `visibility: 'public' | 'private'`) dans le modèle `Game` et Firestore.
   - Les visiteurs et utilisateurs standards ne voient que les jeux publics.
   - L'administrateur connecté (`galtiergabin76@gmail.com`) voit tous les jeux, avec un badge distinctif `Privé · Test Admin` et un commutateur de filtre rapide (Tous / Publics / Privés) pour tester ses jeux en conditions réelles sans perturber le public.

2. **Affichage de l'ID Firebase Document pour l'ADMIN uniquement** :
   - Uniquement visible lorsque `currentUser?.isAdmin` est vrai.
   - Présent sur les cartes de jeu, dans la fenêtre de détails et dans l'onglet de gestion de la console Admin.
   - Bouton de copie rapide au clic avec notification toast immédiate.

3. **Fichier Source Dédié pour le Code HTML Lourd (Jeux WebGL / Cuphead)** :
   - Fichier créé : `src/data/customEmbeddedGames.ts`.
   - Emplacement numéroté et documenté avec précision (Ligne 6) pour coller le code HTML complet (même de plusieurs mégaoctets) sans risque de tronquage Firestore.
   - Le lecteur de jeu vérifie automatiquement la présence du code local pour le jeu concerné (ex: `qsdsqdqds`) et l'exécute de façon fluide via Blob URL sécurisée.

4. **Interception des Sauvegardes & Tiroir Cloud Automatique** :
   - Injection d'un intercepteur léger dans l'environnement iframe : capture des événements de téléchargement déclenchés par le jeu (`<a download>`, `URL.createObjectURL`, blobs générés).
   - Transmission sécurisée par `postMessage` vers l'application parente.
   - Pour les utilisateurs connectés, enregistrement automatique de la sauvegarde dans Firestore / Profil utilisateur (`fileName`, `fileData`, `fileSize`, `timestamp`, `gameId`).
   - Tiroir latéral interactif accessible d'un clic sur l'icône de disquette/sauvegarde dans le lecteur : permet de voir toutes les sauvegardes horodatées, de les retélécharger à tout moment pour les réinjecter dans le jeu, ou d'en importer manuellement.

5. **Suivi du Temps de Jeu Cumulé (Playtime Tracker)** :
   - Chronomètre de session actif pendant que le jeu tourne.
   - Synchronisation périodique et à la fermeture de la session dans Firestore (`user_playtimes` / profil utilisateur).
   - Formatage lisible (`45 min`, `2h 15m`).
   - Affichage direct sur la carte du jeu et dans le panneau de détails du jeu dès que l'utilisateur est connecté.

---

### 2. Expérience Utilisateur & Design

- **Esthétique Cyber/Vesper** : Respect strict de la palette existante (fond sombre ardoise/noir `#030612`, reflets cyan `#4ce6ff` et violet `#a855f7`, typographies `Outfit` et `Plus Jakarta Sans`).
- **Discipline Anti-Slop** : Typographie soignée, badges unboxed pour les métadonnées, chiffres tabulaires pour le temps de jeu (`tabular-nums`), zéro élément clignotant superflu.
- **Tiroir de Sauvegardes** : Panneau coulissant élégant depuis la droite du lecteur avec fond sombre translucide, liste propre des fichiers de sauvegarde avec date relative ("Il y a 10 minutes", "Hier à 18h30") et boutons de téléchargement direct.

---

### 3. Schéma Technique & Flux de Données

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HOUSE GAME ECOSYSTEM                          │
├────────────────────────────────┬───────────────────────────────────────┤
│    Catalogue & Admin Controls  │       Playable Game Environment       │
│                                │                                       │
│  ┌──────────────────────────┐  │  ┌─────────────────────────────────┐  │
│  │ GameCard & DetailsModal  │  │  │ PlayablePlayerModal             │  │
│  │ - Public/Privé Badge     │  │  │ - Iframe Game Runner            │  │
│  │ - Firebase ID (Admin)    │  │  │ - Download Interceptor Bridge   │  │
│  │ - Mon Temps de Jeu (User)│  │  │ - Playtime Live Tracker (Timer) │  │
│  └─────────────┬────────────┘  │  └───────────────┬─────────────────┘  │
│                │               │                  │                    │
│                │               │      ┌───────────▼───────────────┐    │
│                │               │      │ Saves Drawer (Cloud Sync) │    │
│                │               │      │ - Horodatage & Fichier    │    │
│                │               │      │ - Téléchargement & Import │    │
│                │               │      └───────────┬───────────────┘    │
│                ▼               │                  ▼                    │
│  ┌──────────────────────────┐  │  ┌───────────────────────────────┐    │
│  │ Local Code Bridge        │  │  │ Firebase Firestore Sync       │    │
│  │ customEmbeddedGames.ts   │  │  │ - games (avec isPrivate)      │    │
│  │ (Code HTML géant Ligne 6)│  │  │ - users/{uid}/saves           │    │
│  └──────────────────────────┘  │  │ - users/{uid}/playtimes       │    │
│                                │  └───────────────────────────────┘    │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

### 4. Plan de Modifications par Composants

1. **Modèle de Données (`src/types/index.ts`)** :
   - Ajout de `isPrivate?: boolean` sur `Game`.
   - Ajout des interfaces `GameSave` (`id`, `gameId`, `userId`, `fileName`, `fileData`, `fileSize`, `createdAt`) et `PlaytimeRecord`.

2. **Fichier Source Dédié (`src/data/customEmbeddedGames.ts`)** :
   - Création du fichier avec gabarit prêt à l'emploi et instructions explicites.

3. **Services de Stockage & Firebase (`src/services/firebase.ts` & `src/services/storage.ts`)** :
   - Mise à jour de `subscribeGames`, `addGame`, `updateGame` pour supporter `isPrivate`.
   - Ajout des méthodes de persistance pour les sauvegardes de jeu (`saveGameSave`, `getGameSaves`, `deleteGameSave`).
   - Ajout des méthodes de suivi et cumul du temps de jeu (`recordPlaytime`, `getUserPlaytime`, `subscribeUserPlaytimes`).

4. **Lecteur & Intercepteur de Téléchargements (`src/components/PlayablePlayerModal.tsx`)** :
   - Résolution du code HTML local depuis `customEmbeddedGames.ts` en priorité si présent.
   - Script d'interception de téléchargement inséré dans la balise HTML pour détecter l'envoi de fichier au client.
   - Suivi en temps réel de la durée de session avec synchronisation automatique.
   - Composant tiroir (Drawer) pour consulter et retélécharger ses fichiers de sauvegarde.

5. **Interface Catalogue & Cartes (`src/components/GameCard.tsx`, `GameDetailsModal.tsx`, `AdminModal.tsx`, `App.tsx`)** :
   - Filtrage des jeux privés pour les utilisateurs réguliers ; affichage pour l'Admin avec badge distinctif.
   - Affichage de l'ID Firebase avec bouton Copier pour l'Admin.
   - Affichage du temps de jeu personnel de l'utilisateur sur les cartes et la fiche détaillée.

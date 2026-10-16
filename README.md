# House Game — Vesper Vault (Plateforme de Jeux Web & Portage Cyberpunk)

<img src="https://i.pinimg.com/736x/c1/3f/85/c13f854557df99c40db566435a599515.jpg" alt="image du site">

> **Prototype & Bibliothèque Cyberpunk de jeux vidéo PC portés sur le Web**, doté d'une synchronisation en temps réel avec Firebase Firestore, d'un espace administrateur sécurisé, d'un suivi précis du temps de jeu, d'une interception intelligente des fichiers de sauvegarde, et d'analyses de données interactives avec **Recharts**.

---

## 🚀 Fonctionnalités & Mises à Jour (Historique Complet)

### 📌 v1.9 (Dernière Mise à Jour)
- **Réseau d'Amis ONL (`FriendsModal`)** : Recherche en direct de joueurs par pseudo/email dans Firebase Firestore, gestion de la liste d'amis, statuts de présence temps réel (En ligne, En jeu avec le titre en cours, Absent, Hors-ligne).
- **Personnalisation de Profil ONL (`ProfileSettingsModal`)** : Choix d'avatars personnalisés ou d'URL externe, sélection de bannières cyberpunk HD, citation/bio de profil et sélection de jeux favoris pour la vitrine publique.
- **Vitrine ONL Publique (`PublicProfileModal`)** : Affichage immersif du profil joueur avec vitrine de jeux préférés, niveau de joueur, compteurs de statistiques et bouton de lancement rapide.
- **Statistiques Hebdomadaires Réelles (Recharts)** : Remplacement des données simulées par un décompte réel stocké par jour de la semaine (`Lun` à `Dim`), avec jour le plus actif, moyenne quotidienne et cumul précis.
- **Renommage & Suppression des Sauvegardes** : Possibilité d'éditer le libellé de chaque sauvegarde (importée ou interceptée) directement dans le tiroir du lecteur et suppression définitive sans blocage.

### 📌 v1.8
- **Visualisation de Données avec Recharts** : Intégration d'un graphique interactif en bâtonnets (`BarChart`) dans la modale de détails (`GameDetailsModal`) pour visualiser le temps de jeu cumulé et hebdomadaire de l'utilisateur.
- **Export des Logs Administrateur (JSON)** : Ajout d'une fonctionnalité dans la console `AdminModal` permettant à l'administrateur d'exporter instantanément l'ensemble des activités récentes, statistiques des jeux et événements système au format JSON pour une analyse hors-ligne.
- **Documentation Complète (README.md)** : Refonte exhaustive du fichier README avec l'image d'illustration d'origine et récapitulatif technique de toutes les versions.

### 📌 v1.7
- **Journal des Mises à Jour (ChangelogModal)** : Ajout d'un système complet et accessible via la barre de navigation et le pied de page permettant de consulter l'historique détaillé de toutes les versions depuis le début du projet.
- **Suivi Précis du Temps de Jeu** : Enregistrement automatique des sessions de jeu pour les utilisateurs connectés, synchronisé en temps réel avec Firebase Firestore.

### 📌 v1.6
- **Interception des Sauvegardes de Jeux** : Système intelligent détectant les téléchargements de fichiers de sauvegarde générés par les jeux WebGL/HTML5, les enregistrant dans le profil utilisateur avec horodatage et permettant un téléchargement/restauration facile à chaque relance.

### 📌 v1.5
- **Modes Public & Privé (Tests Admin)** : L'administrateur peut basculer n'importe quel jeu en mode privé (accessible uniquement pour ses tests personnels) ou en mode public.
- **Affichage Sécurisé de l'ID Firebase** : Seul l'administrateur connecté (`galtiergabin76@gmail.com`) peut visualiser et copier l'identifiant unique du document Firebase Firestore correspondant à chaque jeu.

### 📌 v1.4
- **Intégration HTML Directe (`qsdsqdqds` & Portages)** : Injection transparente de code HTML brut, balises `<base>`, scripts et canvas pour les jeux nécessitant un rendu embarqué direct sans limitation de caractères.

### 📌 v1.3
- **Proxy Pinterest & Affiches HD** : Résolution automatique des liens Pinterest haute définition via un proxy sécurisé `/api/resolve-pinterest`.

### 📌 v1.2
- **Authentification & Synchronisation Cloud** : Connexion par compte administrateur ou joueurs avec synchronisation bidirectionnelle instantanée sur Firestore.

### 📌 v1.0 & v1.1
- **Lancement de Vesper Vault** : Catalogue de jeux inspiré de l'esthétique cyberpunk, recherche instantanée, filtres par genres (Action, Course, Cyberpunk, Survie, Arcade, Stratégie), gestion des favoris et lecteur immersif plein écran.

---

## 🛠️ Stack Technique & Architecture

- **Framework Frontend** : React 19 avec TypeScript (Vite).
- **Styling** : Tailwind CSS v4 (`@import "tailwindcss";`) avec palette cyberpunk (néons cyan, violet, pourpre et fond sombre `#02030a`).
- **Graphiques & Visualisations** : **Recharts** pour les graphiques analytiques de temps de jeu, **Lucide React** pour la charte iconographique.
- **Effets 3D** : **Three.js** pour les animations de canvas de fond et scènes immersives.
- **Backend & Base de Données** : Serveur Express (`server.ts`) avec intégration **Firebase Firestore** (persistance des jeux, profils, scores, temps de jeu) et **Firebase Authentication**.
- **Outils de Build** : TypeScript (`tsc`), Vite, tsx.

---

## 📂 Structure du Code Source

```text
├── server.ts                 # Serveur Express & middleware API (proxy Pinterest)
├── src/
│   ├── App.tsx               # Composant principal, gestion des états globaux & modals
│   ├── main.tsx              # Point d'entrée React
│   ├── types/                # Définitions TypeScript (Game, User, GameSave, etc.)
│   ├── data/                 # Données initiales et changelog structuré
│   │   ├── defaultGames.ts   # Catalogue des jeux par défaut (dont qsdsqdqds)
│   │   └── changelog.ts      # Historique des versions et modifications
│   ├── services/
│   │   ├── firebase.ts       # Service Firebase Firestore & Auth en temps réel
│   │   └── storage.ts        # Gestionnaire de stockage local (localStorage fallback)
│   └── components/
│       ├── Navbar.tsx        # Barre de navigation responsive & badge versions
│       ├── GameCard.tsx      # Cartes de jeux avec indicateurs de temps de jeu & tags
│       ├── GameDetailsModal.tsx # Modale de détails avec graphique Recharts & ID Firebase
│       ├── PlayablePlayer.tsx # Lecteur de jeux WebGL, HTML brut et gestion de sauvegardes
│       ├── AdminModal.tsx    # Console admin (ajout, édition, bascule privé/public, export JSON)
│       ├── AuthModal.tsx     # Modale de connexion / inscription
│       ├── ChangelogModal.tsx # Visualiseur de l'historique des mises à jour
│       └── GameArtwork.tsx   # Générateur artistique d'affiches cyberpunk
```

---

## 🔐 Accès Administrateur

- **Email Admin** : `galtiergabin76@gmail.com`
- **Mot de passe** : `111111`
- **Privilèges** :
  - Accès aux options de test en mode **Privé**.
  - Visualisation des **IDs Firebase Firestore** pour chaque jeu.
  - Ajout, modification et suppression de jeux en direct dans la base Cloud.
  - **Export des logs d'activité et statistiques au format JSON** depuis la console d'administration.

---

## 🚀 Lancement & Compilation

1. **Installer les dépendances** :
   ```bash
   npm install
   ```
2. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
3. **Compiler pour la production** :
   ```bash
   npm run build
   ```

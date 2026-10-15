export interface ChangelogItem {
  version: string;
  title: string;
  date: string;
  badge: 'Majeur' | 'Nouveau' | 'Amélioration' | 'Correctif' | 'Admin' | 'Fondation';
  category: 'Jeux & WebGL' | 'Admin & Visibilité' | 'Sauvegardes' | 'Temps de jeu' | 'Déploiement Vercel' | 'Fondation';
  summary: string;
  details: string[];
  tips?: string;
}

export const CHANGELOG_DATA: ChangelogItem[] = [
  {
    version: 'v1.7',
    title: 'Suivi du Temps de Jeu Cumulé (Playtime Tracker)',
    date: 'Mise à jour récente',
    badge: 'Nouveau',
    category: 'Temps de jeu',
    summary: 'Calcul en temps réel du temps passé sur chaque jeu pour les utilisateurs connectés et affichage sur le catalogue et la fiche du jeu.',
    details: [
      'Chronomètre de session actif et précis pendant toute la durée de lancement d\'un jeu.',
      'Synchronisation et cumul automatique du temps de jeu dans Firebase Firestore (collection `users/{uid}/playtimes`) et mise en cache locale.',
      'Affichage élégant du temps cumulé directement sur la carte de chaque jeu avec icône d\'horloge et formatage lisible (ex: "45 min", "2h 15m").',
      'Affichage détaillé dans la modale d\'informations du jeu pour comparer votre investissement de jeu.'
    ],
    tips: 'Le temps de jeu commence à décompter dès que vous lancez un jeu en étant connecté à votre compte.'
  },
  {
    version: 'v1.6',
    title: 'Interception Automatique des Sauvegardes & Tiroir Cloud',
    date: 'Mise à jour récente',
    badge: 'Majeur',
    category: 'Sauvegardes',
    summary: 'Capture automatique des fichiers de sauvegarde déclenchés par les jeux et tiroir cloud dédié pour les retélécharger.',
    details: [
      'Intercepteur JavaScript injecté au sein de l\'environnement de jeu pour capturer les téléchargements automatiques (liens avec attribut download, URL.createObjectURL, blobs).',
      'Enregistrement instantané de chaque sauvegarde sur le profil de l\'utilisateur connecté dans Firebase et stockage local.',
      'Tiroir latéral « Sauvegardes Cloud » intégré directement dans le lecteur plein écran (bouton disquette en haut à droite).',
      'Historique horodaté avec nom du fichier, taille en Ko/Mo, date relative (ex: "Il y a 5 min"), et bouton de téléchargement instantané d\'un clic pour réinjecter le fichier dans le jeu.',
      'Possibilité d\'importer manuellement des fichiers de sauvegarde depuis son ordinateur.'
    ],
    tips: 'Lorsque vous cliquez sur "Sauvegarder" dans un jeu WebGL, la sauvegarde est capturée sans quitter la partie et stockée sur votre compte.'
  },
  {
    version: 'v1.5',
    title: 'Code HTML Lourd Dédié & Port WebGL (Cuphead / Unity)',
    date: 'Mise à jour récente',
    badge: 'Nouveau',
    category: 'Jeux & WebGL',
    summary: 'Création d\'un fichier dédié dans le code source pour intégrer des jeux WebGL très volumineux sans contrainte de limite de caractères.',
    details: [
      'Création du fichier `src/data/customEmbeddedGames.ts` pour accueillir le code source HTML complet des gros jeux (ex: builds Unity WebGL de Cuphead avec gestion des parts multipart).',
      'Emplacement numéroté et documenté à la Ligne 6 du fichier pour y coller directement le code HTML.',
      'Exécution automatique et transparente pour le jeu cible (ex: identifiant `qsdsqdqds`) via un Blob URL sécurisé.',
      'Permet de contourner les limites de taille de documents Firestore (1 Mo max) pour les jeux contenant des scripts ou assets embarqués volumineux.'
    ],
    tips: 'Pour insérer votre gros code HTML, ouvrez le fichier src/data/customEmbeddedGames.ts et collez votre code à la Ligne 6.'
  },
  {
    version: 'v1.4',
    title: 'Mode Public / Privé & ID Firebase pour l\'Admin',
    date: 'Mise à jour récente',
    badge: 'Admin',
    category: 'Admin & Visibilité',
    summary: 'Gestion de la visibilité des jeux pour tester en secret avant mise en ligne, et affichage des identifiants Firestore pour l\'administrateur.',
    details: [
      'Ajout du statut `isPrivate` : les utilisateurs publics ne voient que les jeux vérifiés et mis en public.',
      'L\'administrateur connecté (`currentUser.isAdmin`) a accès exclusif aux jeux privés pour les tester en conditions réelles.',
      'Filtre rapide dans le catalogue réservé à l\'admin : Tous / Publics uniquement / Privés pour tests.',
      'Badge violet distinctif `Privé · Test Admin` sur les cartes de jeu en mode privé.',
      'Affichage et copie rapide en 1 clic de l\'identifiant Firebase Firestore (`firebaseId`) pour chaque jeu sur sa carte et dans ses détails.'
    ],
    tips: 'Vous pouvez basculer un jeu en public ou privé à tout moment depuis la Console d\'administration.'
  },
  {
    version: 'v1.3',
    title: 'Déploiement Vercel & Optimisation du Build',
    date: 'Mise à jour précédente',
    badge: 'Correctif',
    category: 'Déploiement Vercel',
    summary: 'Correction complète des erreurs de compilation Vercel (react-scripts / vite 127) et configuration serverless.',
    details: [
      'Résolution de l\'erreur Vercel `react-scripts : commande non trouvée` en forçant le framework preset Vite.',
      'Résolution de l\'erreur `vite: commande non trouvée` (code 127) en spécifiant le build command standard `npm run build` et le dossier de sortie `dist`.',
      'Résolution des conflits de versions `esbuild` dans devDependencies.',
      'Ajout du fichier `.npmrc` avec `legacy-peer-deps=true` pour sécuriser l\'installation npm automatisée sur Vercel.',
      'Configuration de `vercel.json` avec règles de réécriture pour `/api/(.*)` (proxy d\'images) et fallback SPA `index.html`.'
    ],
    tips: 'Le projet se déploie maintenant instantanément sur Vercel avec le preset Vite.'
  },
  {
    version: 'v1.2',
    title: 'Support Hybride : URLs Directes & Balises HTML WebGL',
    date: 'Mise à jour précédente',
    badge: 'Majeur',
    category: 'Jeux & WebGL',
    summary: 'Possibilité d\'insérer soit une URL web classique, soit une balise ou code HTML complet pour exécuter le jeu.',
    details: [
      'Ajout d\'un commutateur dans le formulaire d\'ajout/édition de jeu entre « URL du jeu » et « Balise / Code HTML personnalisé ».',
      'Prise en charge de balises `<!DOCTYPE html>`, balises `<base href>`, balises `<canvas>` et scripts de loaders (Unity WebGL, Godot, Phaser).',
      'Génération dynamique d\'un conteneur sécurisé `iframe` avec Blob URL pour exécuter le code HTML personnalisé comme une vraie page web.',
      'Validation automatique du type d\'intégration pour un lancement sans accroc.'
    ]
  },
  {
    version: 'v1.1',
    title: 'Synchronisation Cloud Firebase & Console Admin',
    date: 'Mise à jour précédente',
    badge: 'Majeur',
    category: 'Fondation',
    summary: 'Connexion en direct à Firebase Firestore et Firebase Auth avec console de gestion complète.',
    details: [
      'Synchronisation en temps réel de tous les jeux du catalogue via Firebase Firestore.',
      'Authentification Firebase avec gestion des comptes utilisateurs, profils, avatars personnalisés et déconnexion.',
      'Console d\'administration complète (`AdminModal`) pour ajouter, modifier, supprimer des jeux ou réinitialiser les données.',
      'Proxy d\'images et résolveur Pinterest (`/api/resolve-pinterest`, `/api/proxy-image`) pour afficher de superbes jaquettes sans blocage CORS.',
      'Gestion des jeux mis en avant ("Featured / En vedette") avec mise en lumière dans le carrousel Spotlight.'
    ]
  },
  {
    version: 'v1.0',
    title: 'Lancement de Vesper Vault / House Game',
    date: 'Version initiale',
    badge: 'Fondation',
    category: 'Fondation',
    summary: 'Création de la plateforme de jeux web futuriste avec catalogue interactif, lecteur immersif et favoris.',
    details: [
      'Interface utilisateur futuriste Cyberpunk & Midnight Slate (tons sombres `#02030a`, reflets néons cyan et violet).',
      'Système de filtrage instantané par catégories : Action, Course, Cyberpunk, Survie, Arcade, Stratégie.',
      'Moteur de recherche rapide en direct par titre, mots-clés, description et tags.',
      'Lecteur de jeu web plein écran avec bouton d\'agrandissement, rechargement rapide et raccourcis clavier.',
      'Système de favoris sauvegardés pour marquer et retrouver ses jeux préférés en un clic.',
      'Architecture réactive sur mesure adaptée au mobile, tablette et grand écran.'
    ]
  }
];

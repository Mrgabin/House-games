import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  getDocFromServer,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Game, User } from '../types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with configured firestoreDatabaseId (CRITICAL)
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Test Firestore connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client hors-ligne, reprise automatique dès reconnexion.");
    }
  }
}
testFirestoreConnection();

export const FirebaseService = {
  // Subscribe to real-time updates from Firebase 'games' collection
  // If the user adds, edits or deletes a document directly in Firebase,
  // this listener immediately reflects the change on the live site!
  subscribeGames(onUpdate: (games: Game[]) => void): () => void {
    const gamesCollection = collection(db, 'games');

    const unsubscribe = onSnapshot(
      gamesCollection,
      (snapshot) => {
        const loadedGames: Game[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedGames.push({
            id: docSnap.id,
            title: data.title || 'Sans titre',
            slug: data.slug || docSnap.id,
            tagline: data.tagline || 'Portage web PC haute fidélité.',
            description: data.description || '',
            category: data.category || 'Action',
            coverGradient: data.coverGradient || 'from-violet-950 via-purple-900 to-indigo-950',
            coverPattern: data.coverPattern || 'radial-gradient(circle at 75% 25%, rgba(177, 116, 255, 0.4) 0%, transparent 60%)',
            coverIcon: data.coverIcon || 'Gamepad2',
            coverUrl: data.coverUrl || undefined,
            bannerUrl: data.bannerUrl || undefined,
            gameUrl: data.gameUrl || 'https://polytrack-game.com',
            embedCode: data.embedCode || undefined,
            rating: typeof data.rating === 'number' ? data.rating : 5.0,
            playCount: typeof data.playCount === 'number' ? data.playCount : 0,
            releaseYear: typeof data.releaseYear === 'number' ? data.releaseYear : new Date().getFullYear(),
            controlsInfo: data.controlsInfo || 'ZQSD / Flèches : Contrôles · Espace / Clic : Action',
            performanceBadge: data.performanceBadge || 'PC Port · 60 FPS',
            studio: data.studio || 'Studio Indé',
            tags: Array.isArray(data.tags) ? data.tags : [data.category || 'Action', 'Web Port'],
            isFeatured: Boolean(data.isFeatured),
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        // Sort by creation date descending
        loadedGames.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(loadedGames);
      },
      (error) => {
        console.error('Erreur lecture Firestore collection games:', error);
      }
    );

    return unsubscribe;
  },

  // Add game to Firestore
  async addGame(gameData: Partial<Game> & { title: string; category: Game['category']; description: string }): Promise<string> {
    const newDocRef = doc(collection(db, 'games'));
    const slug = gameData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const record = {
      title: gameData.title.trim(),
      slug,
      tagline: gameData.tagline?.trim() || 'Portage web PC haute fidélité.',
      description: gameData.description.trim(),
      category: gameData.category,
      coverGradient: gameData.coverGradient || 'from-violet-950 via-purple-900 to-indigo-950',
      coverPattern: 'radial-gradient(circle at 75% 25%, rgba(177, 116, 255, 0.4) 0%, transparent 60%)',
      coverIcon: gameData.coverIcon || 'Gamepad2',
      coverUrl: gameData.coverUrl?.trim() || '',
      bannerUrl: gameData.bannerUrl?.trim() || '',
      gameUrl: gameData.gameUrl?.trim() || 'https://polytrack-game.com',
      embedCode: gameData.embedCode?.trim() || '',
      rating: gameData.rating || 5.0,
      playCount: gameData.playCount || 1,
      releaseYear: gameData.releaseYear || new Date().getFullYear(),
      controlsInfo: gameData.controlsInfo?.trim() || 'ZQSD : Déplacement · Clic : Action · Espace : Saut',
      performanceBadge: gameData.performanceBadge || 'PC Port · 60 FPS',
      studio: gameData.studio?.trim() || 'House Game Studio',
      tags: gameData.tags && gameData.tags.length > 0 ? gameData.tags : [gameData.category, 'Web Port', 'PC Game'],
      isFeatured: Boolean(gameData.isFeatured),
      createdAt: new Date().toISOString()
    };

    await setDoc(newDocRef, record);
    return newDocRef.id;
  },

  // Delete game directly from Firestore
  async deleteGame(gameId: string): Promise<void> {
    await deleteDoc(doc(db, 'games', gameId));
  },

  // Update game in real-time in Firestore
  async updateGame(gameId: string, updatedData: Partial<Game>): Promise<void> {
    const gameDocRef = doc(db, 'games', gameId);
    const cleanUpdate: Record<string, any> = {};

    if (updatedData.title !== undefined) cleanUpdate.title = updatedData.title.trim();
    if (updatedData.tagline !== undefined) cleanUpdate.tagline = updatedData.tagline.trim();
    if (updatedData.description !== undefined) cleanUpdate.description = updatedData.description.trim();
    if (updatedData.category !== undefined) cleanUpdate.category = updatedData.category;
    if (updatedData.coverUrl !== undefined) cleanUpdate.coverUrl = updatedData.coverUrl.trim();
    if (updatedData.bannerUrl !== undefined) cleanUpdate.bannerUrl = updatedData.bannerUrl.trim();
    if (updatedData.gameUrl !== undefined) cleanUpdate.gameUrl = updatedData.gameUrl.trim();
    if (updatedData.embedCode !== undefined) cleanUpdate.embedCode = updatedData.embedCode.trim();
    if (updatedData.rating !== undefined) cleanUpdate.rating = Number(updatedData.rating);
    if (updatedData.playCount !== undefined) cleanUpdate.playCount = Number(updatedData.playCount);
    if (updatedData.releaseYear !== undefined) cleanUpdate.releaseYear = Number(updatedData.releaseYear);
    if (updatedData.controlsInfo !== undefined) cleanUpdate.controlsInfo = updatedData.controlsInfo.trim();
    if (updatedData.studio !== undefined) cleanUpdate.studio = updatedData.studio.trim();
    if (updatedData.isFeatured !== undefined) cleanUpdate.isFeatured = Boolean(updatedData.isFeatured);
    if (updatedData.tags !== undefined) cleanUpdate.tags = updatedData.tags;
    if (updatedData.coverGradient !== undefined) cleanUpdate.coverGradient = updatedData.coverGradient;
    if (updatedData.coverIcon !== undefined) cleanUpdate.coverIcon = updatedData.coverIcon;
    cleanUpdate.updatedAt = new Date().toISOString();

    await updateDoc(gameDocRef, cleanUpdate);
  },

  // User Profile & Favorites in Firestore
  async syncUserProfile(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        favorites: user.favorites,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Sync profil Firestore échoué:", e);
    }
  },

  // Google Login popup
  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    if (!fbUser) return null;

    // Seul galtiergabin76@gmail.com est Administrateur
    const isAdmin = Boolean(fbUser.email && fbUser.email.toLowerCase() === 'galtiergabin76@gmail.com');
    const user: User = {
      id: fbUser.uid,
      email: fbUser.email || 'joueur@housegame.com',
      username: fbUser.displayName || fbUser.email?.split('@')[0] || (isAdmin ? 'Gabin Galtier' : 'Joueur'),
      isAdmin,
      favorites: [],
      avatarBg: isAdmin ? 'bg-purple-600' : 'bg-cyan-600',
      createdAt: new Date().toISOString()
    };

    await this.syncUserProfile(user);
    return user;
  },

  // Listen to Firebase Auth state in real time
  subscribeAuthState(onAuthChanged: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Seul galtiergabin76@gmail.com est Administrateur
        const isAdmin = Boolean(fbUser.email && fbUser.email.toLowerCase() === 'galtiergabin76@gmail.com');
        const user: User = {
          id: fbUser.uid,
          email: fbUser.email || 'joueur@housegame.com',
          username: fbUser.displayName || fbUser.email?.split('@')[0] || (isAdmin ? 'Gabin Galtier' : 'Joueur'),
          isAdmin,
          favorites: [],
          avatarBg: isAdmin ? 'bg-purple-600' : 'bg-cyan-600',
          createdAt: new Date().toISOString()
        };
        onAuthChanged(user);
      } else {
        onAuthChanged(null);
      }
    });
  }
};

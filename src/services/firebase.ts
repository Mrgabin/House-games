import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  getDoc,
  getDocFromServer,
  updateDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Game, User, GameSave, DayPlaytimeBreakdown } from '../types';
import { getWeekdayKey } from './storage';

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
            isPrivate: Boolean(data.isPrivate),
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
      isPrivate: Boolean(gameData.isPrivate),
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
    if (updatedData.isPrivate !== undefined) cleanUpdate.isPrivate = Boolean(updatedData.isPrivate);
    if (updatedData.tags !== undefined) cleanUpdate.tags = updatedData.tags;
    if (updatedData.coverGradient !== undefined) cleanUpdate.coverGradient = updatedData.coverGradient;
    if (updatedData.coverIcon !== undefined) cleanUpdate.coverIcon = updatedData.coverIcon;
    cleanUpdate.updatedAt = new Date().toISOString();

    await updateDoc(gameDocRef, cleanUpdate);
  },

  // === USER PROFILE, CUSTOMIZATION & FRIENDS ===
  async syncUserProfile(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        favorites: user.favorites || [],
        avatarUrl: user.avatarUrl || '',
        avatarBg: user.avatarBg || 'bg-cyan-600',
        bannerUrl: user.bannerUrl || '',
        bio: user.bio || '',
        featuredGameIds: user.featuredGameIds || [],
        friends: user.friends || [],
        status: user.status || 'online',
        currentGameTitle: user.currentGameTitle || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Sync profil Firestore échoué:", e);
    }
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const cleanUpdates: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (updates.username !== undefined) cleanUpdates.username = updates.username.trim();
      if (updates.avatarUrl !== undefined) cleanUpdates.avatarUrl = updates.avatarUrl.trim();
      if (updates.avatarBg !== undefined) cleanUpdates.avatarBg = updates.avatarBg;
      if (updates.bannerUrl !== undefined) cleanUpdates.bannerUrl = updates.bannerUrl.trim();
      if (updates.bio !== undefined) cleanUpdates.bio = updates.bio.trim();
      if (updates.featuredGameIds !== undefined) cleanUpdates.featuredGameIds = updates.featuredGameIds;
      if (updates.friends !== undefined) cleanUpdates.friends = updates.friends;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.currentGameTitle !== undefined) cleanUpdates.currentGameTitle = updates.currentGameTitle;

      await setDoc(userRef, cleanUpdates, { merge: true });
    } catch (e) {
      console.warn("Mise à jour profil Firestore échouée:", e);
    }
  },

  async searchUsers(searchTerm: string): Promise<User[]> {
    if (!searchTerm || !searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    try {
      const snap = await getDocs(collection(db, 'users'));
      const results: User[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const username = (data.username || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        if (username.includes(term) || email.includes(term)) {
          results.push({
            id: d.id,
            email: data.email || '',
            username: data.username || 'Joueur',
            isAdmin: Boolean(data.isAdmin),
            favorites: data.favorites || [],
            avatarUrl: data.avatarUrl || undefined,
            avatarBg: data.avatarBg || 'bg-cyan-600',
            bannerUrl: data.bannerUrl || undefined,
            bio: data.bio || '',
            featuredGameIds: data.featuredGameIds || [],
            friends: data.friends || [],
            status: data.status || 'online',
            currentGameTitle: data.currentGameTitle || '',
            createdAt: data.createdAt || new Date().toISOString()
          });
        }
      });
      return results;
    } catch (e) {
      console.warn("Recherche utilisateurs Firestore échouée:", e);
      return [];
    }
  },

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        id: snap.id,
        email: data.email || '',
        username: data.username || 'Joueur',
        isAdmin: Boolean(data.isAdmin),
        favorites: data.favorites || [],
        avatarUrl: data.avatarUrl || undefined,
        avatarBg: data.avatarBg || 'bg-cyan-600',
        bannerUrl: data.bannerUrl || undefined,
        bio: data.bio || '',
        featuredGameIds: data.featuredGameIds || [],
        friends: data.friends || [],
        status: data.status || 'online',
        currentGameTitle: data.currentGameTitle || '',
        createdAt: data.createdAt || new Date().toISOString()
      };
    } catch (e) {
      console.warn("Lecture profil utilisateur Firestore échouée:", e);
      return null;
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
      avatarUrl: fbUser.photoURL || undefined,
      bannerUrl: undefined,
      bio: 'Membre ONL',
      featuredGameIds: [],
      friends: [],
      status: 'online',
      createdAt: new Date().toISOString()
    };

    await this.syncUserProfile(user);
    return user;
  },

  // Listen to Firebase Auth state in real time
  subscribeAuthState(onAuthChanged: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isAdmin = Boolean(fbUser.email && fbUser.email.toLowerCase() === 'galtiergabin76@gmail.com');
        let profile = await FirebaseService.getUserProfile(fbUser.uid);
        if (!profile) {
          profile = {
            id: fbUser.uid,
            email: fbUser.email || 'joueur@housegame.com',
            username: fbUser.displayName || fbUser.email?.split('@')[0] || (isAdmin ? 'Gabin Galtier' : 'Joueur'),
            isAdmin,
            favorites: [],
            avatarBg: isAdmin ? 'bg-purple-600' : 'bg-cyan-600',
            avatarUrl: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString()
          };
          await FirebaseService.syncUserProfile(profile);
        }
        onAuthChanged(profile);
      } else {
        onAuthChanged(null);
      }
    });
  },

  // === CLOUD SAVES MANAGEMENT (CREATE, RENAME, DELETE) ===
  async saveGameSave(saveData: Omit<GameSave, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<string> {
    const savesCollection = collection(db, 'users', saveData.userId, 'saves');
    const newSaveRef = saveData.id ? doc(savesCollection, saveData.id) : doc(savesCollection);
    const record = {
      gameId: saveData.gameId,
      gameTitle: saveData.gameTitle,
      userId: saveData.userId,
      fileName: saveData.fileName,
      customName: saveData.customName || saveData.fileName,
      fileData: saveData.fileData,
      fileSize: saveData.fileSize,
      createdAt: saveData.createdAt || new Date().toISOString()
    };
    await setDoc(newSaveRef, record, { merge: true });
    return newSaveRef.id;
  },

  subscribeGameSaves(userId: string, gameId: string, onUpdate: (saves: GameSave[]) => void): () => void {
    if (!userId) {
      onUpdate([]);
      return () => {};
    }
    const savesCollection = collection(db, 'users', userId, 'saves');
    return onSnapshot(
      savesCollection,
      (snapshot) => {
        const loadedSaves: GameSave[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          if (!gameId || d.gameId === gameId) {
            loadedSaves.push({
              id: snap.id,
              gameId: d.gameId,
              gameTitle: d.gameTitle,
              userId: d.userId,
              fileName: d.fileName,
              customName: d.customName || d.fileName,
              fileData: d.fileData,
              fileSize: d.fileSize || 0,
              createdAt: d.createdAt || new Date().toISOString()
            });
          }
        });
        loadedSaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(loadedSaves);
      },
      (error) => {
        console.warn('Erreur abonnement sauvegardes Firebase:', error);
      }
    );
  },

  async updateGameSaveName(userId: string, saveId: string, customName: string): Promise<void> {
    if (!userId || !saveId) return;
    try {
      const saveRef = doc(db, 'users', userId, 'saves', saveId);
      await updateDoc(saveRef, {
        customName: customName.trim(),
        fileName: customName.trim(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Erreur renommage sauvegarde Firebase:', e);
    }
  },

  async deleteGameSave(userId: string, saveId: string): Promise<void> {
    if (!userId || !saveId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'saves', saveId));
    } catch (e) {
      console.warn('Erreur suppression sauvegarde Firebase:', e);
    }
  },

  // === REAL PLAYTIME & WEEKLY BREAKDOWN IN FIRESTORE ===
  async recordPlaytime(userId: string, gameId: string, additionalSeconds: number): Promise<void> {
    if (!userId || !gameId || additionalSeconds <= 0) return;
    try {
      const playtimeDocRef = doc(db, 'users', userId, 'playtimes', gameId);
      const snap = await getDoc(playtimeDocRef);
      let currentSeconds = 0;
      let dayBreakdown: DayPlaytimeBreakdown = {
        Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0
      };

      if (snap.exists()) {
        const data = snap.data();
        currentSeconds = data.seconds || 0;
        if (data.dayBreakdown) {
          dayBreakdown = { ...dayBreakdown, ...data.dayBreakdown };
        }
      }

      const today = getWeekdayKey();
      dayBreakdown[today] = (dayBreakdown[today] || 0) + additionalSeconds;

      await setDoc(playtimeDocRef, {
        seconds: currentSeconds + additionalSeconds,
        dayBreakdown,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Sync temps de jeu Firebase échoué:', e);
    }
  },

  subscribeUserPlaytimes(userId: string, onUpdate: (playtimes: Record<string, number>, breakdowns?: Record<string, DayPlaytimeBreakdown>) => void): () => void {
    if (!userId) {
      onUpdate({}, {});
      return () => {};
    }
    const playtimesCollection = collection(db, 'users', userId, 'playtimes');
    return onSnapshot(
      playtimesCollection,
      (snapshot) => {
        const map: Record<string, number> = {};
        const breakdownMap: Record<string, DayPlaytimeBreakdown> = {};
        snapshot.forEach((snap) => {
          const d = snap.data();
          map[snap.id] = d.seconds || 0;
          if (d.dayBreakdown) {
            breakdownMap[snap.id] = d.dayBreakdown;
          }
        });
        onUpdate(map, breakdownMap);
      },
      (error) => {
        console.warn('Erreur abonnement temps de jeu Firestore:', error);
      }
    );
  }
};

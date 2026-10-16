import { Game, User, GameSave, DayPlaytimeBreakdown } from '../types';
import { INITIAL_GAMES } from '../data/defaultGames';
import { idbSaves } from './indexedDbSaves';

const STORAGE_KEYS = {
  GAMES: 'vesper_vault_games_v1',
  USERS: 'vesper_vault_users_v1',
  CURRENT_USER: 'vesper_vault_session_v1',
};

export const ADMIN_EMAIL = 'galtiergabin76@gmail.com';
export const ADMIN_PASSWORD = '111111';

// Pre-seeded Users with ONL-style profile showcases
const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-gabin',
    email: ADMIN_EMAIL,
    username: 'Gabin Galtier',
    isAdmin: true,
    favorites: ['game-1', 'game-2'],
    avatarBg: 'bg-violet-600',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    bio: 'Fondateur & Administrateur ONL | Développeur WebGL & Cloud Firestore',
    featuredGameIds: ['game-1', 'game-2', 'game-3'],
    friends: ['user-player-cyber', 'user-player-neo'],
    status: 'online',
    currentGameTitle: 'Polytrack Turbo',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-player-cyber',
    email: 'cyber_runner@onl.io',
    username: 'CyberRunner99',
    isAdmin: false,
    favorites: ['game-1'],
    avatarBg: 'bg-cyan-600',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    bio: 'Fan de jeux de course néon et records de vitesse !',
    featuredGameIds: ['game-1'],
    friends: ['user-admin-gabin'],
    status: 'in-game',
    currentGameTitle: 'Polytrack Turbo',
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'user-player-neo',
    email: 'neo_matrix@onl.io',
    username: 'NeoVesper',
    isAdmin: false,
    favorites: ['game-3', 'game-4'],
    avatarBg: 'bg-emerald-600',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    bio: 'Toujours prêt pour une partie coop en WebGL.',
    featuredGameIds: ['game-3'],
    friends: ['user-admin-gabin'],
    status: 'online',
    currentGameTitle: 'Vesper Survivor',
    createdAt: '2026-02-15T15:30:00Z',
  },
  {
    id: 'user-player-val',
    email: 'valkyrie@onl.io',
    username: 'ValkyrieX',
    isAdmin: false,
    favorites: ['game-2'],
    avatarBg: 'bg-rose-600',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    bio: 'Chasseuse de succès et testeuse de jeux indés.',
    featuredGameIds: ['game-2', 'game-4'],
    friends: [],
    status: 'away',
    createdAt: '2026-03-01T09:00:00Z',
  }
];

// Helper to safely read from localStorage
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[Storage] Erreur lecture clé ${key}:`, e);
    return fallback;
  }
}

// Helper to safely write to localStorage without throwing or crashing on quota limits
function setToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.number === -2147024882) {
      console.warn(`[Storage] Quota localStorage atteint pour '${key}'. Stockage IndexedDB pris en relais.`);
      // If the save key exceeded quota, clear it so other data (favorites, sessions, games) can save freely
      if (key === 'vesper_vault_saves_v1') {
        try {
          localStorage.removeItem(key);
        } catch (_) {}
      }
    } else {
      console.warn(`[Storage] Impossible d'écrire la clé ${key}:`, e);
    }
    return false;
  }
}

// Day of week helper: Lun, Mar, Mer, Jeu, Ven, Sam, Dim
export function getWeekdayKey(): keyof DayPlaytimeBreakdown {
  const dayIndex = new Date().getDay(); // 0 is Dimanche, 1 is Lundi, etc.
  const map: (keyof DayPlaytimeBreakdown)[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return map[dayIndex];
}

export const StorageService = {
  // === GAMES MANAGEMENT ===
  getGames(): Game[] {
    const stored = getFromStorage<Game[] | null>(STORAGE_KEYS.GAMES, null);
    if (!stored || stored.length === 0) {
      setToStorage(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      return INITIAL_GAMES;
    }
    return stored;
  },

  addGame(newGameData: Partial<Game> & { title: string; category: Game['category']; description: string }): Game {
    const games = this.getGames();
    const id = `game-custom-${Date.now()}`;
    const slug = newGameData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newGame: Game = {
      id,
      title: newGameData.title.trim(),
      slug,
      tagline: newGameData.tagline?.trim() || 'Portage web PC haute fidélité.',
      description: newGameData.description.trim(),
      category: newGameData.category,
      coverGradient: newGameData.coverGradient || 'from-violet-950 via-purple-900 to-slate-950',
      coverPattern: 'radial-gradient(circle at 70% 30%, rgba(177, 116, 255, 0.4) 0%, transparent 60%)',
      coverIcon: newGameData.coverIcon || 'Gamepad2',
      coverUrl: newGameData.coverUrl?.trim() || undefined,
      bannerUrl: newGameData.bannerUrl?.trim() || undefined,
      gameUrl: newGameData.gameUrl?.trim() || 'https://polytrack-game.com',
      embedCode: newGameData.embedCode?.trim() || undefined,
      rating: newGameData.rating || 5.0,
      playCount: newGameData.playCount || 1,
      releaseYear: newGameData.releaseYear || new Date().getFullYear(),
      controlsInfo: newGameData.controlsInfo?.trim() || 'ZQSD / Flèches : Contrôles · Clic / Espace : Action',
      performanceBadge: newGameData.performanceBadge || 'PC Web Port · 60 FPS',
      studio: newGameData.studio?.trim() || 'Indie Studio',
      tags: newGameData.tags && newGameData.tags.length > 0 ? newGameData.tags : [newGameData.category, 'Web Port', 'PC Game'],
      isFeatured: !!newGameData.isFeatured,
      isPrivate: !!newGameData.isPrivate,
      createdAt: new Date().toISOString(),
    };

    const updated = [newGame, ...games];
    setToStorage(STORAGE_KEYS.GAMES, updated);
    return newGame;
  },

  updateGame(gameId: string, updatedData: Partial<Game>): Game | null {
    const games = this.getGames();
    const index = games.findIndex(g => g.id === gameId);
    if (index === -1) return null;

    const existing = games[index];
    const updated: Game = {
      ...existing,
      ...updatedData,
      id: existing.id,
      title: updatedData.title?.trim() ?? existing.title,
      description: updatedData.description?.trim() ?? existing.description,
      tagline: updatedData.tagline?.trim() ?? existing.tagline,
      category: updatedData.category ?? existing.category,
      coverUrl: updatedData.coverUrl !== undefined ? updatedData.coverUrl : existing.coverUrl,
      bannerUrl: updatedData.bannerUrl !== undefined ? updatedData.bannerUrl : existing.bannerUrl,
      rating: updatedData.rating !== undefined ? Number(updatedData.rating) : existing.rating,
      playCount: updatedData.playCount !== undefined ? Number(updatedData.playCount) : existing.playCount,
      gameUrl: updatedData.gameUrl?.trim() ?? existing.gameUrl,
      embedCode: updatedData.embedCode !== undefined ? updatedData.embedCode : existing.embedCode,
      controlsInfo: updatedData.controlsInfo?.trim() ?? existing.controlsInfo,
      studio: updatedData.studio?.trim() ?? existing.studio,
      isPrivate: updatedData.isPrivate !== undefined ? Boolean(updatedData.isPrivate) : existing.isPrivate,
    };

    games[index] = updated;
    setToStorage(STORAGE_KEYS.GAMES, games);
    return updated;
  },

  deleteGame(gameId: string): boolean {
    const games = this.getGames();
    const filtered = games.filter(g => g.id !== gameId);
    setToStorage(STORAGE_KEYS.GAMES, filtered);

    // Also remove from all users' favorites
    const users = this.getUsers();
    const updatedUsers = users.map(u => ({
      ...u,
      favorites: u.favorites.filter(fid => fid !== gameId)
    }));
    setToStorage(STORAGE_KEYS.USERS, updatedUsers);

    // Update current session if needed
    const current = this.getCurrentUser();
    if (current && current.favorites.includes(gameId)) {
      const updatedCurrent = {
        ...current,
        favorites: current.favorites.filter(fid => fid !== gameId)
      };
      setToStorage(STORAGE_KEYS.CURRENT_USER, updatedCurrent);
    }

    return true;
  },

  resetDefaultGames(): Game[] {
    setToStorage(STORAGE_KEYS.GAMES, INITIAL_GAMES);
    return INITIAL_GAMES;
  },

  // === USERS & AUTH MANAGEMENT ===
  getUsers(): User[] {
    const stored = getFromStorage<User[] | null>(STORAGE_KEYS.USERS, null);
    if (!stored || stored.length === 0) {
      setToStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    return stored;
  },

  getCurrentUser(): User | null {
    return getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    const updatedUser: User = {
      ...users[index],
      ...updates
    };

    users[index] = updatedUser;
    setToStorage(STORAGE_KEYS.USERS, users);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      setToStorage(STORAGE_KEYS.CURRENT_USER, updatedUser);
    }
    return updatedUser;
  },

  searchUsers(searchTerm: string): User[] {
    if (!searchTerm || !searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    const users = this.getUsers();
    return users.filter(u => 
      u.username.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
  },

  addFriend(userId: string, friendId: string): User | null {
    if (!userId || !friendId || userId === friendId) return null;
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const currentFriends = user.friends || [];
    if (!currentFriends.includes(friendId)) {
      const updatedFriends = [...currentFriends, friendId];
      return this.updateUserProfile(userId, { friends: updatedFriends });
    }
    return user;
  },

  removeFriend(userId: string, friendId: string): User | null {
    if (!userId || !friendId) return null;
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const currentFriends = user.friends || [];
    const updatedFriends = currentFriends.filter(id => id !== friendId);
    return this.updateUserProfile(userId, { friends: updatedFriends });
  },

  register(email: string, password?: string, username?: string): { user?: User; error?: string } {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { error: 'Un compte existe déjà avec cette adresse email.' };
    }

    let isAdmin = false;
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      if (password !== ADMIN_PASSWORD) {
        return { error: 'Mot de passe incorrect pour le compte administrateur. (Attendu: 111111)' };
      }
      isAdmin = true;
    }

    const bgColors = ['bg-violet-600', 'bg-cyan-600', 'bg-purple-600', 'bg-emerald-600', 'bg-rose-600'];
    const avatarBg = isAdmin ? 'bg-purple-600' : bgColors[Math.floor(Math.random() * bgColors.length)];

    const newUser: User = {
      id: isAdmin ? 'user-admin-gabin' : `user-${Date.now()}`,
      email: normalizedEmail,
      username: username?.trim() || (isAdmin ? 'Gabin Galtier' : normalizedEmail.split('@')[0]),
      isAdmin,
      favorites: [],
      avatarBg,
      avatarUrl: undefined,
      bannerUrl: undefined,
      bio: 'Membre de ONL',
      featuredGameIds: [],
      friends: [],
      status: 'online',
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users.filter(u => u.email !== normalizedEmail), newUser];
    setToStorage(STORAGE_KEYS.USERS, updatedUsers);
    setToStorage(STORAGE_KEYS.CURRENT_USER, newUser);
    return { user: newUser };
  },

  login(email: string, password?: string): { user?: User; error?: string } {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if trying to login as admin
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      if (password !== ADMIN_PASSWORD) {
        return { error: 'Mot de passe incorrect pour le compte administrateur.' };
      }
      const adminUser: User = {
        id: 'user-admin-gabin',
        email: ADMIN_EMAIL,
        username: 'Gabin Galtier',
        isAdmin: true,
        favorites: this.getCurrentUser()?.favorites || [],
        avatarBg: 'bg-purple-600',
        avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        bio: 'Fondateur & Administrateur ONL | Développeur WebGL',
        featuredGameIds: ['game-1', 'game-2'],
        friends: ['user-player-cyber'],
        status: 'online',
        createdAt: new Date().toISOString()
      };
      setToStorage(STORAGE_KEYS.CURRENT_USER, adminUser);
      return { user: adminUser };
    }

    // Normal player account
    let existing = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!existing) {
      // Auto-register normal player if first time
      return this.register(email, password, normalizedEmail.split('@')[0]);
    }

    // Ensure normal player does NOT have admin rights unless matched
    existing = { ...existing, isAdmin: false };
    setToStorage(STORAGE_KEYS.CURRENT_USER, existing);
    return { user: existing };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // === FAVORITES MANAGEMENT ===
  toggleFavorite(gameId: string): { favorites: string[]; isFavorite: boolean } {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      const guestFavs = getFromStorage<string[]>('vesper_vault_guest_favs', []);
      let updated: string[];
      let isFav: boolean;
      if (guestFavs.includes(gameId)) {
        updated = guestFavs.filter(id => id !== gameId);
        isFav = false;
      } else {
        updated = [...guestFavs, gameId];
        isFav = true;
      }
      setToStorage('vesper_vault_guest_favs', updated);
      return { favorites: updated, isFavorite: isFav };
    }

    let updatedFavorites: string[];
    let isFavorite: boolean;

    if (currentUser.favorites.includes(gameId)) {
      updatedFavorites = currentUser.favorites.filter(id => id !== gameId);
      isFavorite = false;
    } else {
      updatedFavorites = [...currentUser.favorites, gameId];
      isFavorite = true;
    }

    const updatedUser: User = {
      ...currentUser,
      favorites: updatedFavorites,
    };

    setToStorage(STORAGE_KEYS.CURRENT_USER, updatedUser);

    // Sync in global users list
    const users = this.getUsers();
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setToStorage(STORAGE_KEYS.USERS, updatedUsers);

    return { favorites: updatedFavorites, isFavorite };
  },

  getFavorites(): string[] {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      return currentUser.favorites;
    }
    return getFromStorage<string[]>('vesper_vault_guest_favs', []);
  },

  // === GAME SAVES MANAGEMENT (Backed by IndexedDB & Safe LocalStorage) ===
  getGameSaves(gameId?: string, userId?: string): GameSave[] {
    const idbItems = idbSaves.getAll();
    const legacySaves = getFromStorage<GameSave[]>('vesper_vault_saves_v1', []);

    // If legacy saves exist in localStorage, import them to IndexedDB and clear the heavy localStorage key
    if (legacySaves.length > 0) {
      idbSaves.importFromLegacy(legacySaves);
      try {
        localStorage.removeItem('vesper_vault_saves_v1');
      } catch (_) {}
    }

    // Merge in-memory / IndexedDB items with legacy
    const map = new Map<string, GameSave>();
    legacySaves.forEach(s => map.set(s.id, s));
    idbItems.forEach(s => map.set(s.id, s));

    const allSaves = Array.from(map.values());

    return allSaves.filter(s => {
      if (userId && s.userId !== userId) return false;
      if (gameId && s.gameId !== gameId) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  saveGameSave(saveData: Omit<GameSave, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): GameSave {
    const newSave: GameSave = {
      ...saveData,
      id: saveData.id || `save-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: saveData.createdAt || new Date().toISOString()
    };

    // 1. Save to high-capacity IndexedDB (handles large multi-MB saves with ease)
    idbSaves.save(newSave);

    // 2. Safe fallback to localStorage only if size is small (< 80KB) and never throw
    try {
      if (newSave.fileData && newSave.fileData.length < 80000) {
        const allSaves = getFromStorage<GameSave[]>('vesper_vault_saves_v1', []);
        const updated = [newSave, ...allSaves.filter(s => s.id !== newSave.id)];
        setToStorage('vesper_vault_saves_v1', updated);
      }
    } catch (_) {}

    return newSave;
  },

  updateGameSaveName(saveId: string, customName: string): boolean {
    const trimmed = customName.trim();
    idbSaves.updateName(saveId, trimmed);

    try {
      const allSaves = getFromStorage<GameSave[]>('vesper_vault_saves_v1', []);
      const index = allSaves.findIndex(s => s.id === saveId);
      if (index !== -1) {
        allSaves[index] = {
          ...allSaves[index],
          customName: trimmed,
          fileName: trimmed || allSaves[index].fileName
        };
        setToStorage('vesper_vault_saves_v1', allSaves);
      }
    } catch (_) {}

    return true;
  },

  deleteGameSave(saveId: string, fileName?: string, gameId?: string): boolean {
    idbSaves.delete(saveId);

    try {
      const allSaves = getFromStorage<GameSave[]>('vesper_vault_saves_v1', []);
      const filtered = allSaves.filter(s => {
        if (s.id === saveId) return false;
        if (fileName && s.fileName === fileName && (!gameId || s.gameId === gameId)) return false;
        return true;
      });
      setToStorage('vesper_vault_saves_v1', filtered);
    } catch (_) {}

    return true;
  },

  // === REAL USER PLAYTIME & WEEKLY BREAKDOWN TRACKING ===
  recordPlaytime(userId: string, gameId: string, additionalSeconds: number): { totalSeconds: number; dayBreakdown: DayPlaytimeBreakdown } {
    if (!userId || !gameId || additionalSeconds <= 0) {
      return { totalSeconds: 0, dayBreakdown: { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 } };
    }

    const playtimesKey = `vesper_vault_playtime_${userId}`;
    const playtimes = getFromStorage<Record<string, number>>(playtimesKey, {});
    const current = playtimes[gameId] || 0;
    const updated = current + additionalSeconds;
    playtimes[gameId] = updated;
    setToStorage(playtimesKey, playtimes);

    // Track real day breakdown:
    const breakdownKey = `vesper_vault_breakdown_${userId}_${gameId}`;
    const currentBreakdown = getFromStorage<DayPlaytimeBreakdown>(breakdownKey, {
      Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0
    });
    const currentDay = getWeekdayKey();
    currentBreakdown[currentDay] = (currentBreakdown[currentDay] || 0) + additionalSeconds;
    setToStorage(breakdownKey, currentBreakdown);

    return { totalSeconds: updated, dayBreakdown: currentBreakdown };
  },

  getUserPlaytimeRecord(userId: string, gameId: string): { totalSeconds: number; dayBreakdown: DayPlaytimeBreakdown } {
    if (!userId || !gameId) {
      return { totalSeconds: 0, dayBreakdown: { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 } };
    }
    const playtimesKey = `vesper_vault_playtime_${userId}`;
    const playtimes = getFromStorage<Record<string, number>>(playtimesKey, {});
    const total = playtimes[gameId] || 0;

    const breakdownKey = `vesper_vault_breakdown_${userId}_${gameId}`;
    const currentBreakdown = getFromStorage<DayPlaytimeBreakdown>(breakdownKey, {
      Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0
    });

    // If total exists but breakdown was empty (from before update), assign to today so user sees real data immediately
    const sumBreakdown = Object.values(currentBreakdown).reduce((a, b) => a + b, 0);
    if (total > 0 && sumBreakdown === 0) {
      const today = getWeekdayKey();
      currentBreakdown[today] = total;
      setToStorage(breakdownKey, currentBreakdown);
    }

    return { totalSeconds: total, dayBreakdown: currentBreakdown };
  },

  getUserPlaytimes(userId: string): Record<string, number> {
    if (!userId) return {};
    const playtimesKey = `vesper_vault_playtime_${userId}`;
    return getFromStorage<Record<string, number>>(playtimesKey, {});
  }
};

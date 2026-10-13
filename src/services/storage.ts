import { Game, User } from '../types';
import { INITIAL_GAMES } from '../data/defaultGames';

const STORAGE_KEYS = {
  GAMES: 'vesper_vault_games_v1',
  USERS: 'vesper_vault_users_v1',
  CURRENT_USER: 'vesper_vault_session_v1',
};

export const ADMIN_EMAIL = 'galtiergabin76@gmail.com';
export const ADMIN_PASSWORD = '111111';

// Pre-seeded Users
const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-gabin',
    email: ADMIN_EMAIL,
    username: 'Gabin Galtier',
    isAdmin: true,
    favorites: [],
    avatarBg: 'bg-violet-600',
    createdAt: '2026-01-01T00:00:00Z',
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

// Helper to safely write to localStorage
function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] Erreur écriture clé ${key}:`, e);
  }
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

    // Ensure normal player does NOT have admin rights
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
      // Guest favorites stored in guest session
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
  }
};

export type GameCategory = 
  | 'Tous'
  | 'Cyberpunk'
  | 'Course'
  | 'Action'
  | 'Survie'
  | 'Arcade'
  | 'Stratégie';

export interface Game {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: Exclude<GameCategory, 'Tous'>;
  coverGradient: string;
  coverPattern: string;
  coverIcon: string;
  coverUrl?: string;
  bannerUrl?: string;
  gameUrl: string; // URL web playable
  embedCode?: string; // Balise HTML / Code embed / Code source web port (ex: <!DOCTYPE html>...)
  rating: number; // ex: 4.9
  playCount: number;
  releaseYear: number;
  controlsInfo: string;
  performanceBadge: string; // ex: "60 FPS · WebGL 2.0"
  studio: string;
  tags: string[];
  isFeatured?: boolean;
  isPrivate?: boolean; // Mode privé réservé aux tests de l'ADMIN
  createdAt: string;
}

export interface GameSave {
  id: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  fileName: string;
  customName?: string; // Nom personnalisé ou renommé par l'utilisateur
  fileData: string; // Base64 data URL ou contenu texte
  fileSize: number; // en octets
  createdAt: string;
}

export interface DayPlaytimeBreakdown {
  Lun: number; // en secondes
  Mar: number;
  Mer: number;
  Jeu: number;
  Ven: number;
  Sam: number;
  Dim: number;
}

export interface UserPlaytime {
  gameId: string;
  seconds: number;
  dayBreakdown?: DayPlaytimeBreakdown;
  lastPlayedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  favorites: string[]; // Game IDs
  avatarBg?: string;
  avatarUrl?: string; // Avatar d'image personnalisé
  bannerUrl?: string; // Bannière de profil personnalisée
  bio?: string; // Bio / citation / slogan de profil
  featuredGameIds?: string[]; // Vitrine publique des jeux préférés
  friends?: string[]; // Liste des IDs des amis
  status?: 'online' | 'in-game' | 'away' | 'offline';
  currentGameTitle?: string;
  createdAt: string;
}

export type ActiveView = 'catalog' | 'favorites' | 'admin' | 'friends' | 'profile';

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
  fileData: string; // Base64 data URL ou contenu texte
  fileSize: number; // en octets
  createdAt: string;
}

export interface UserPlaytime {
  gameId: string;
  seconds: number;
  lastPlayedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  favorites: string[]; // Game IDs
  avatarBg?: string;
  createdAt: string;
}

export type ActiveView = 'catalog' | 'favorites' | 'admin';

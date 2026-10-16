import { GameSave } from '../types';

const DB_NAME = 'vesper_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'game_saves';

class IndexedDbSavesStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;
  private cache: Map<string, GameSave> = new Map();
  private listeners: Set<() => void> = new Set();
  public isReady = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isReady = true;
      return null;
    }
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('gameId', 'gameId', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
          }
        };

        request.onsuccess = async (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          await this.loadAllToCache();
          this.isReady = true;
          this.notify();
          resolve(this.db);
        };

        request.onerror = (err) => {
          console.warn('[IndexedDB] Erreur ouverture base de données:', err);
          this.isReady = true;
          resolve(null);
        };
      } catch (e) {
        console.warn('[IndexedDB] Initialisation échouée:', e);
        this.isReady = true;
        resolve(null);
      }
    });

    return this.initPromise;
  }

  private async loadAllToCache(): Promise<void> {
    const db = this.db;
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const saves: GameSave[] = request.result || [];
          saves.forEach((s) => this.cache.set(s.id, s));
          resolve();
        };

        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (_) {}
    });
  }

  public getAll(): GameSave[] {
    return Array.from(this.cache.values());
  }

  public getById(id: string): GameSave | undefined {
    return this.cache.get(id);
  }

  public async save(saveData: GameSave): Promise<void> {
    this.cache.set(saveData.id, saveData);
    this.notify();

    const db = this.db || (await this.init());
    if (!db) return;

    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(saveData);
    } catch (e) {
      console.warn('[IndexedDB] Erreur écriture sauvegarde:', e);
    }
  }

  public async delete(id: string): Promise<void> {
    this.cache.delete(id);
    this.notify();

    const db = this.db || (await this.init());
    if (!db) return;

    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
    } catch (e) {
      console.warn('[IndexedDB] Erreur suppression sauvegarde:', e);
    }
  }

  public async updateName(id: string, newName: string): Promise<void> {
    const existing = this.cache.get(id);
    if (!existing) return;

    const updated: GameSave = {
      ...existing,
      customName: newName,
      fileName: newName || existing.fileName,
    };
    await this.save(updated);
  }

  public async importFromLegacy(saves: GameSave[]): Promise<void> {
    if (!saves || saves.length === 0) return;
    for (const s of saves) {
      if (!this.cache.has(s.id)) {
        await this.save(s);
      }
    }
  }
}

export const idbSaves = new IndexedDbSavesStore();

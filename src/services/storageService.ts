import { Media } from "../types";

const DB_NAME = "ruro_offline_db";
const DB_VERSION = 2;
const STORE_NAME = "offline_videos";
const PARTIAL_STORE_NAME = "partial_videos";

export interface StoredVideo {
  id: string;
  blob: Blob;
  metadata: Media;
  quality: string;
  timestamp: number;
}

class StorageService {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(PARTIAL_STORE_NAME)) {
          db.createObjectStore(PARTIAL_STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async saveVideo(id: string, blob: Blob, metadata: Media, quality: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const storedVideo: StoredVideo = {
      id,
      blob,
      metadata,
      quality,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(storedVideo);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getVideo(id: string): Promise<StoredVideo | null> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDownloadedIds(): Promise<string[]> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
  async savePartialVideo(id: string, blob: Blob, movie: Media, quality: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(PARTIAL_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PARTIAL_STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put({ id, blob, movie, quality, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPartialVideo(id: string): Promise<{ id: string; blob: Blob; movie: Media; quality: string } | null> {
    const db = await this.getDB();
    const transaction = db.transaction(PARTIAL_STORE_NAME, "readonly");
    const store = transaction.objectStore(PARTIAL_STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePartialVideo(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(PARTIAL_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PARTIAL_STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageService = new StorageService();

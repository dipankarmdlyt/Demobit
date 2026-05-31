/**
 * Mossbit Offline-First IndexedDB Local Data Store
 * Built explicitly for the Mossbit PWA sandboxed environment.
 * 
 * Implements type-safe local storage for habits, logs, and synchronization queues.
 */

import { Habit, CompletionLogs } from './types';

const DB_NAME = 'mossbit_db';
const DB_VERSION = 1;

export interface SyncOperation {
  id?: number;
  type: 'SAVE_HABITS' | 'SAVE_LOGS' | 'SET_PREMIUM';
  data: any;
  timestamp: number;
}

/**
 * Initializes the IndexedDB database and object stores.
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for habits list
      if (!db.objectStoreNames.contains('habits')) {
        db.createObjectStore('habits', { keyPath: 'id' });
      }
      
      // Store for daily checkoff logs
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs');
      }
      
      // Store for general system metadata (such as premium status & last synced stamp)
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }

      // Store for unsynced client changes to push when online
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database.'));
    };
  });
}

/**
 * Loads all habits from IndexedDB.
 */
export async function getLocalHabits(): Promise<Habit[] | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('habits', 'readonly');
    const store = tx.objectStore('habits');
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result as Habit[];
      resolve(items.length > 0 ? items : null);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Persists all habits to IndexedDB.
 */
export async function saveLocalHabits(habits: Habit[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('habits', 'readwrite');
    const store = tx.objectStore('habits');
    
    // Clear the existing habits store first
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      let count = 0;
      if (habits.length === 0) {
        resolve();
        return;
      }
      
      for (const habit of habits) {
        const addRequest = store.add(habit);
        addRequest.onerror = () => reject(addRequest.error);
        addRequest.onsuccess = () => {
          count++;
          if (count === habits.length) {
            resolve();
          }
        };
      }
    };

    clearRequest.onerror = () => reject(clearRequest.error);
  });
}

/**
 * Loads completion logs from IndexedDB.
 */
export async function getLocalLogs(): Promise<CompletionLogs | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readonly');
    const store = tx.objectStore('logs');
    const request = store.openCursor();
    const result: CompletionLogs = {};

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        result[cursor.key as string] = cursor.value;
        cursor.continue();
      } else {
        resolve(Object.keys(result).length > 0 ? result : null);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Sets comprehensive completion logs in IndexedDB.
 */
export async function saveLocalLogs(logs: CompletionLogs): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    const clearReq = store.clear();

    clearReq.onsuccess = () => {
      const entries = Object.entries(logs);
      if (entries.length === 0) {
        resolve();
        return;
      }

      let count = 0;
      for (const [key, status] of entries) {
        const putReq = store.put(status, key);
        putReq.onerror = () => reject(putReq.error);
        putReq.onsuccess = () => {
          count++;
          if (count === entries.length) {
            resolve();
          }
        };
      }
    };

    clearReq.onerror = () => reject(clearReq.error);
  });
}

/**
 * Retrieves a single parameter from the metadata store.
 */
export async function getMetadata(key: string): Promise<any> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('metadata')) {
      resolve(null);
      return;
    }
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a parameter in the metadata store.
 */
export async function saveMetadata(key: string, value: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queues a sync operation for backup.
 */
export async function enqueueSync(type: SyncOperation['type'], data: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const op: SyncOperation = {
      type,
      data,
      timestamp: Date.now()
    };
    const request = store.add(op);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets the current backlog of unsynced items.
 */
export async function getSyncQueue(): Promise<SyncOperation[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clears an item or list of items from the sync backlog.
 */
export async function removeSyncItems(ids: number[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');

    let completed = 0;
    if (ids.length === 0) {
      resolve();
      return;
    }

    for (const id of ids) {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length) {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    }
  });
}

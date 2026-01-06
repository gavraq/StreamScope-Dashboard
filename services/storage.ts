import { Channel, WatchedVideo } from '../types';

const DB_NAME = 'StreamScopeDB';
const DB_VERSION = 1;
const STORE_CHANNELS = 'channels';
const STORE_HISTORY = 'history';

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      dbInstance = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_CHANNELS)) {
        db.createObjectStore(STORE_CHANNELS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
    };
  });
};

export const saveChannelsToDB = async (channels: Channel[]): Promise<void> => {
  if (!dbInstance) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance!.transaction([STORE_CHANNELS], 'readwrite');
    const store = transaction.objectStore(STORE_CHANNELS);
    
    // Clear old data to ensure sync (simple approach for this app)
    store.clear();

    channels.forEach(channel => {
      store.put(channel);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadChannelsFromDB = async (): Promise<Channel[]> => {
  if (!dbInstance) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance!.transaction([STORE_CHANNELS], 'readonly');
    const store = transaction.objectStore(STORE_CHANNELS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const saveHistoryToDB = async (history: WatchedVideo[]): Promise<void> => {
  if (!dbInstance) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance!.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    
    // We don't clear here generally, but for full state sync simplicity:
    store.clear();
    
    history.forEach(video => {
      store.put(video);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const loadHistoryFromDB = async (): Promise<WatchedVideo[]> => {
  if (!dbInstance) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance!.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearDB = async (): Promise<void> => {
    if (!dbInstance) await initDB();
    const transaction = dbInstance!.transaction([STORE_CHANNELS, STORE_HISTORY], 'readwrite');
    transaction.objectStore(STORE_CHANNELS).clear();
    transaction.objectStore(STORE_HISTORY).clear();
}
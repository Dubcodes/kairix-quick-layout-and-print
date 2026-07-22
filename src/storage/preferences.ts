import type { StoredPreferences } from '../models/types';
import { RECOMMENDED_PREFERENCES } from '../models/defaults';

const DATABASE_NAME = 'kairix-quick-layout-print';
const STORE_NAME = 'preferences';
const SETTINGS_KEY = 'print-settings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadPreferences(): Promise<StoredPreferences> {
  try {
    const database = await openDatabase();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(SETTINGS_KEY);
      request.onsuccess = () => resolve({ ...RECOMMENDED_PREFERENCES, ...(request.result as Partial<StoredPreferences>) });
      request.onerror = () => reject(request.error);
    });
  } catch {
    return RECOMMENDED_PREFERENCES;
  }
}

export async function savePreferences(preferences: StoredPreferences): Promise<void> {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(preferences, SETTINGS_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // The editor remains usable when storage is blocked or unavailable.
  }
}

export async function restoreRecommendedPreferences(): Promise<StoredPreferences> {
  await savePreferences(RECOMMENDED_PREFERENCES);
  return { ...RECOMMENDED_PREFERENCES };
}

import { openDB } from "idb";
import { applyOfflineMigrations } from "./migrations";
import {
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  type OfflineDbSchema,
} from "./schema";

let offlineDbPromise: ReturnType<typeof openDB<OfflineDbSchema>> | null = null;

export function getOfflineDb() {
  if (!offlineDbPromise) {
    offlineDbPromise = openDB<OfflineDbSchema>(OFFLINE_DB_NAME, OFFLINE_DB_VERSION, {
      upgrade(db, oldVersion) {
        applyOfflineMigrations(db, oldVersion);
      },
    });
  }

  return offlineDbPromise;
}

export async function runOfflineSanityCheck() {
  const db = await getOfflineDb();
  const expectedStores = [
    "session_envelopes",
    "favorites",
    "shopping_items",
    "profile_snapshots",
    "recipe_snapshots",
    "admin_recipe_drafts",
    "admin_snapshots",
    "outbox",
    "conflicts",
  ] as const;

  for (const storeName of expectedStores) {
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Offline DB sanity-check failed for store: ${storeName}`);
    }
  }

  return true;
}

import type { IDBPDatabase } from "idb";
import type { OfflineDbSchema } from "./schema";

type OfflineStoreName =
  | "session_envelopes"
  | "favorites"
  | "shopping_items"
  | "profile_snapshots"
  | "recipe_snapshots"
  | "admin_recipe_drafts"
  | "admin_snapshots"
  | "outbox"
  | "conflicts";

function createStoreIfNeeded(
  db: IDBPDatabase<OfflineDbSchema>,
  name: OfflineStoreName,
  indexes: Array<[string, string, IDBIndexParameters?]>,
) {
  if (db.objectStoreNames.contains(name)) {
    return;
  }

  const store = db.createObjectStore(name) as unknown as {
    createIndex: (indexName: string, keyPath: string, options?: IDBIndexParameters) => void;
  };
  for (const [indexName, keyPath, options] of indexes) {
    store.createIndex(indexName, keyPath, options);
  }
}

export function applyOfflineMigrations(
  db: IDBPDatabase<OfflineDbSchema>,
  oldVersion: number,
) {
  if (oldVersion < 1) {
    createStoreIfNeeded(db, "session_envelopes", [
      ["by_expiresAt", "expiresAt"],
      ["by_lastValidatedAt", "lastValidatedAt"],
      ["by_tenantSlug", "tenantSlug"],
    ]);

    createStoreIfNeeded(db, "favorites", [
      ["by_state", "state"],
      ["by_updatedAt", "updatedAt"],
      ["by_lastOpId", "lastOpId"],
    ]);

    createStoreIfNeeded(db, "shopping_items", [
      ["by_serverId", "serverId"],
      ["by_recipeId", "recipeId"],
      ["by_deleted", "deleted"],
      ["by_updatedAt", "updatedAt"],
      ["by_clientId", "clientId", { unique: true }],
    ]);

    createStoreIfNeeded(db, "profile_snapshots", [
      ["by_lastSyncedAt", "lastSyncedAt"],
      ["by_email", "identity.email"],
    ]);

    createStoreIfNeeded(db, "recipe_snapshots", [
      ["by_slug", "slug", { unique: true }],
      ["by_updatedAt", "updatedAt"],
      ["by_accessTier", "accessTier"],
      ["by_viewedAt", "viewedAt"],
    ]);

    createStoreIfNeeded(db, "admin_recipe_drafts", [
      ["by_serverRecipeId", "serverRecipeId"],
      ["by_tenantSlug", "tenantSlug"],
      ["by_syncState", "syncState"],
      ["by_updatedAt", "updatedAt"],
    ]);

    createStoreIfNeeded(db, "admin_snapshots", [
      ["by_lastSyncedAt", "lastSyncedAt"],
    ]);

    createStoreIfNeeded(db, "outbox", [
      ["by_entity", "entity"],
      ["by_syncState", "syncState"],
      ["by_createdAt", "createdAt"],
      ["by_nextRetryAt", "nextRetryAt"],
    ]);

    createStoreIfNeeded(db, "conflicts", [
      ["by_entity", "entity"],
      ["by_resolutionState", "resolutionState"],
      ["by_detectedAt", "detectedAt"],
    ]);
  }
}

import type { DBSchema } from "idb";
import type { RecipeRecord } from "@/lib/recipes/types";
import type { AdminSessionResponse } from "@/lib/api/adminSession";
import type { UserSession } from "@/lib/api/identity";
import type { FavoriteRecord, ShoppingListItem } from "@/lib/api/interactions";

export const OFFLINE_DB_NAME = "receitasbell_pwa_offline_v1";
export const OFFLINE_DB_VERSION = 1;

export type SessionEnvelopeKind = "user" | "admin";
export type OutboxSyncState = "pending" | "processing" | "failed" | "conflict" | "synced";
export type AdminDraftSyncState = "pending" | "synced" | "failed" | "conflict";
export type ConflictResolutionState = "pending" | "resolved";

export type UserSessionState = Pick<
  UserSession,
  "email" | "tenantId" | "tenantSlug" | "userId" | "role"
>;

export type AdminSessionState = Pick<
  AdminSessionResponse,
  "mode" | "tenant" | "user" | "bootstrapRequired"
>;

export type SessionEnvelopeRecord = {
  kind: SessionEnvelopeKind;
  email?: string | null;
  tenantSlug?: string | null;
  lastValidatedAt: string;
  expiresAt: string;
  deviceBound: boolean;
  restrictedOffline: boolean;
  version: number;
  sessionState: UserSessionState | AdminSessionState;
};

export type FavoriteOfflineRecord = FavoriteRecord & {
  state: "active" | "deleted";
  updatedAt: string;
  syncedAt?: string | null;
  lastOpId?: string | null;
};

export type ShoppingItemOfflineRecord = ShoppingListItem & {
  localId: string;
  clientId: string;
  serverId?: string | null;
  deleted: boolean;
  updatedAt: string;
  syncedAt?: string | null;
  lastOpId?: string | null;
  requiresReview?: boolean;
};

export type ProfileSnapshotRecord = {
  scopeKey: string;
  identity: {
    email: string;
    tenantSlug: string | null;
  };
  favoriteRecords: FavoriteOfflineRecord[];
  shoppingItems: ShoppingItemOfflineRecord[];
  unlockedRecipes: RecipeRecord[];
  purchasedRecipes: RecipeRecord[];
  lastSyncedAt: string;
};

export type RecipeSnapshotRecord = {
  id: string;
  slug: string;
  updatedAt: string;
  accessTier: RecipeRecord["accessTier"];
  data: RecipeRecord;
  viewedAt: string;
};

export type AdminRecipeDraftRecord = {
  draftId: string;
  serverRecipeId?: string | null;
  tenantSlug: string;
  payload: Record<string, unknown>;
  baseServerUpdatedAt?: string | null;
  updatedAt: string;
  syncState: AdminDraftSyncState;
  errorMessage?: string | null;
};

export type AdminSnapshotRecord = {
  tenantSlug: string;
  dashboardSummary?: Record<string, unknown>;
  recipesSummary?: Record<string, unknown>;
  paymentsSummary?: Record<string, unknown>;
  lastSyncedAt: string;
};

export type OutboxRecord = {
  opId: string;
  entity: string;
  action: string;
  payload: Record<string, unknown>;
  baseVersion?: string | null;
  retryCount: number;
  nextRetryAt?: string | null;
  createdAt: string;
  syncState: OutboxSyncState;
  errorMessage?: string | null;
};

export type ConflictRecord = {
  conflictId: string;
  entity: string;
  localPayload: Record<string, unknown>;
  serverPayload: Record<string, unknown>;
  detectedAt: string;
  resolutionState: ConflictResolutionState;
  resolutionChoice?: "local" | "server" | "merge" | null;
};

export interface OfflineDbSchema extends DBSchema {
  session_envelopes: {
    key: SessionEnvelopeKind;
    value: SessionEnvelopeRecord;
    indexes: {
      "by_expiresAt": string;
      "by_lastValidatedAt": string;
      "by_tenantSlug": string;
    };
  };
  favorites: {
    key: string;
    value: FavoriteOfflineRecord;
    indexes: {
      "by_state": string;
      "by_updatedAt": string;
      "by_lastOpId": string;
    };
  };
  shopping_items: {
    key: string;
    value: ShoppingItemOfflineRecord;
    indexes: {
      "by_serverId": string;
      "by_recipeId": string;
      "by_deleted": number;
      "by_updatedAt": string;
      "by_clientId": string;
    };
  };
  profile_snapshots: {
    key: string;
    value: ProfileSnapshotRecord;
    indexes: {
      "by_lastSyncedAt": string;
      "by_email": string;
    };
  };
  recipe_snapshots: {
    key: string;
    value: RecipeSnapshotRecord;
    indexes: {
      "by_slug": string;
      "by_updatedAt": string;
      "by_accessTier": string;
      "by_viewedAt": string;
    };
  };
  admin_recipe_drafts: {
    key: string;
    value: AdminRecipeDraftRecord;
    indexes: {
      "by_serverRecipeId": string;
      "by_tenantSlug": string;
      "by_syncState": string;
      "by_updatedAt": string;
    };
  };
  admin_snapshots: {
    key: string;
    value: AdminSnapshotRecord;
    indexes: {
      "by_lastSyncedAt": string;
    };
  };
  outbox: {
    key: string;
    value: OutboxRecord;
    indexes: {
      "by_entity": string;
      "by_syncState": string;
      "by_createdAt": string;
      "by_nextRetryAt": string;
    };
  };
  conflicts: {
    key: string;
    value: ConflictRecord;
    indexes: {
      "by_entity": string;
      "by_resolutionState": string;
      "by_detectedAt": string;
    };
  };
}

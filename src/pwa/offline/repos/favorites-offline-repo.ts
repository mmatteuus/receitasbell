import { jsonFetch } from "@/lib/api/client";
import type { FavoriteRecord } from "@/lib/api/interactions";
import { getOfflineDb } from "../db/open-db";
import type { FavoriteOfflineRecord } from "../db/schema";
import { emitOfflineDataChanged } from "../events";
import { enqueueOutboxOperation } from "../outbox/enqueue";
import { getOutboxRecord, listOutboxRecords, putOutboxRecord } from "../outbox/outbox-store";
import { requestOutboxReplay } from "../outbox/replay";

function nowIso() {
  return new Date().toISOString();
}

function isOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}

function toFavoriteRecord(record: FavoriteOfflineRecord): FavoriteRecord {
  return {
    id: record.id,
    recipeId: record.recipeId,
    userId: record.userId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

type FavoriteListResponse = {
  items?: Array<FavoriteRecord & { updatedAt?: string }>;
};

async function fetchFavoritesFromServer() {
  const result = await jsonFetch<FavoriteListResponse>("/api/me/favorites");
  return (result.items || []).map((item) => ({
    ...item,
    updatedAt: item.updatedAt || item.createdAt,
  }));
}

async function mergeServerFavorites(serverFavorites: Array<FavoriteRecord & { updatedAt: string }>) {
  const db = await getOfflineDb();
  const pendingOps = await listOutboxRecords();
  const pendingRecipeIds = new Set(
    pendingOps
      .filter((operation) => operation.entity === "favorite")
      .map((operation) => String(operation.payload.recipeId || "")),
  );

  const existing = await db.getAll("favorites");
  const tx = db.transaction("favorites", "readwrite");

  for (const record of existing) {
    if (pendingRecipeIds.has(record.recipeId)) {
      continue;
    }

    const stillActive = serverFavorites.some((favorite) => favorite.recipeId === record.recipeId);
    if (!stillActive) {
      await tx.store.delete(record.recipeId);
    }
  }

  for (const favorite of serverFavorites) {
    if (pendingRecipeIds.has(favorite.recipeId)) {
      continue;
    }

    await tx.store.put({
      ...favorite,
      state: "active",
      syncedAt: nowIso(),
      lastOpId: null,
    }, favorite.recipeId);
  }

  await tx.done;
  emitOfflineDataChanged("favorites");
}

async function coalesceFavoriteOp(recipeId: string, action: "add" | "remove", opId: string) {
  const operations = await listOutboxRecords();
  const conflicting = operations.filter(
    (operation) => operation.entity === "favorite" && String(operation.payload.recipeId) === recipeId,
  );

  for (const operation of conflicting) {
    const db = await getOfflineDb();
    await db.delete("outbox", operation.opId);
  }

  await enqueueOutboxOperation({
    opId,
    entity: "favorite",
    action,
    payload: {
      recipeId,
      opId,
    },
  });
}

export async function listFavoritesOfflineAware() {
  if (isOnline()) {
    try {
      const serverFavorites = await fetchFavoritesFromServer();
      await mergeServerFavorites(serverFavorites);
    } catch {
      // Fall back to local data below.
    }
  }

  const db = await getOfflineDb();
  const records = await db.getAllFromIndex("favorites", "by_state", "active");
  return records
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(toFavoriteRecord);
}

export async function addFavoriteOfflineAware(recipeId: string) {
  const db = await getOfflineDb();
  const current = await db.get("favorites", recipeId);
  const updatedAt = nowIso();
  const next: FavoriteOfflineRecord = {
    id: current?.id || recipeId,
    recipeId,
    userId: current?.userId || "",
    createdAt: current?.createdAt || updatedAt,
    updatedAt,
    state: "active",
    syncedAt: null,
    lastOpId: crypto.randomUUID(),
  };

  await db.put("favorites", next, recipeId);
  await coalesceFavoriteOp(recipeId, "add", next.lastOpId!);
  emitOfflineDataChanged("favorites");

  if (isOnline()) {
    void requestOutboxReplay();
  }

  return toFavoriteRecord(next);
}

export async function deleteFavoriteOfflineAware(recipeId: string) {
  const db = await getOfflineDb();
  const current = await db.get("favorites", recipeId);
  const updatedAt = nowIso();
  const opId = crypto.randomUUID();

  if (current) {
    await db.put("favorites", {
      ...current,
      state: "deleted",
      updatedAt,
      syncedAt: null,
      lastOpId: opId,
    }, recipeId);
  } else {
    await db.put("favorites", {
      id: recipeId,
      recipeId,
      userId: "",
      createdAt: updatedAt,
      updatedAt,
      state: "deleted",
      syncedAt: null,
      lastOpId: opId,
    }, recipeId);
  }

  await coalesceFavoriteOp(recipeId, "remove", opId);
  emitOfflineDataChanged("favorites");

  if (isOnline()) {
    void requestOutboxReplay();
  }
}

export async function replayFavoriteOperation(opId: string, action: string) {
  const record = await getOutboxRecord(opId);
  if (!record) {
    return;
  }

  const recipeId = String(record.payload.recipeId || "");
  if (!recipeId) {
    throw new Error("Favorite operation is missing recipeId.");
  }

  if (action === "add") {
    const result = await jsonFetch<{ item?: FavoriteRecord; favorite?: FavoriteRecord; updatedAt?: string }>("/api/me/favorites", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": opId,
      },
      body: {
        recipeId,
      },
    });

    const favorite = (result.item || result.favorite || {
      id: recipeId,
      recipeId,
      userId: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }) as FavoriteRecord & { updatedAt?: string };

    const db = await getOfflineDb();
    await db.put("favorites", {
      ...favorite,
      updatedAt: favorite.updatedAt || favorite.createdAt,
      state: "active",
      syncedAt: nowIso(),
      lastOpId: opId,
    }, recipeId);
    emitOfflineDataChanged("favorites");
    return;
  }

  if (action === "remove") {
    await jsonFetch<{ success?: boolean }>(`/api/me/favorites?recipeId=${encodeURIComponent(recipeId)}`, {
      method: "DELETE",
      headers: {
        "X-Idempotency-Key": opId,
      },
    });

    const db = await getOfflineDb();
    await db.delete("favorites", recipeId);
    emitOfflineDataChanged("favorites");
    return;
  }

  throw new Error(`Unsupported favorite action: ${action}`);
}

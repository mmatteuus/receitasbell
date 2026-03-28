import { jsonFetch } from "@/lib/api/client";
import type { ShoppingListItem } from "@/lib/api/interactions";
import { getOfflineDb } from "../db/open-db";
import type { ShoppingItemOfflineRecord } from "../db/schema";
import { emitOfflineDataChanged } from "../events";
import { enqueueOutboxOperation } from "../outbox/enqueue";
import {
  deleteOutboxRecord,
  getOutboxRecord,
  listOutboxRecords,
  updateOutboxRecord,
} from "../outbox/outbox-store";
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

function toShoppingItem(record: ShoppingItemOfflineRecord): ShoppingListItem {
  return {
    id: record.serverId || record.localId,
    userId: record.userId,
    recipeId: record.recipeId,
    recipeTitleSnapshot: record.recipeTitleSnapshot,
    text: record.text,
    checked: record.checked,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    clientId: record.clientId,
  };
}

type ShoppingListResponse = {
  items?: Array<ShoppingListItem & { clientId?: string; serverId?: string | null }>;
};

async function fetchShoppingListFromServer() {
  const result = await jsonFetch<ShoppingListResponse>("/api/me/shopping-list");
  return (result.items || []).map((item) => ({
    ...item,
    clientId: item.clientId || item.id,
    serverId: item.serverId || item.id,
  }));
}

async function mergeServerShoppingItems(serverItems: Array<ShoppingListItem & { clientId: string; serverId: string }>) {
  const db = await getOfflineDb();
  const allLocal = await db.getAll("shopping_items");
  const pendingOps = await listOutboxRecords();
  const pendingLocalIds = new Set(
    pendingOps
      .filter((operation) => operation.entity === "shopping")
      .map((operation) => String(operation.payload.localId || "")),
  );

  const tx = db.transaction("shopping_items", "readwrite");

  for (const item of allLocal) {
    if (pendingLocalIds.has(item.localId)) {
      continue;
    }

    const stillExists = serverItems.some((serverItem) => serverItem.clientId === item.clientId);
    if (!stillExists) {
      await tx.store.delete(item.localId);
    }
  }

  for (const item of serverItems) {
    const local = allLocal.find((entry) => entry.clientId === item.clientId);
    if (local && pendingLocalIds.has(local.localId)) {
      continue;
    }

    const localId = local?.localId || item.clientId || item.id;
    await tx.store.put({
      id: item.serverId,
      localId,
      clientId: item.clientId,
      serverId: item.serverId,
      userId: item.userId,
      recipeId: item.recipeId,
      recipeTitleSnapshot: item.recipeTitleSnapshot,
      text: item.text,
      checked: item.checked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deleted: false,
      syncedAt: nowIso(),
      lastOpId: null,
      requiresReview: false,
    }, localId);
  }

  await tx.done;
  emitOfflineDataChanged("shopping_items");
}

export async function listShoppingItemsOfflineAware() {
  if (isOnline()) {
    try {
      const serverItems = await fetchShoppingListFromServer();
      await mergeServerShoppingItems(serverItems);
    } catch {
      // Fall back to local cache.
    }
  }

  const db = await getOfflineDb();
  const items = await db.getAll("shopping_items");
  return items
    .filter((item) => !item.deleted)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(toShoppingItem);
}

async function findPendingCreateOperation(localId: string) {
  const operations = await listOutboxRecords();
  return operations.find(
    (operation) =>
      operation.entity === "shopping"
      && operation.action === "create"
      && String(operation.payload.localId || "") === localId,
  );
}

export async function createShoppingItemsOfflineAware(
  items: Array<{
    recipeId?: string | null;
    recipeTitleSnapshot?: string;
    text: string;
    checked?: boolean;
  }>,
) {
  const db = await getOfflineDb();
  const tx = db.transaction("shopping_items", "readwrite");
  const createdAt = nowIso();
  const createdItems: ShoppingListItem[] = [];

  for (const item of items) {
    const clientId = crypto.randomUUID();
    const localId = clientId;
    const opId = crypto.randomUUID();
    const next: ShoppingItemOfflineRecord = {
      id: localId,
      localId,
      clientId,
      serverId: null,
      userId: "",
      recipeId: item.recipeId ?? null,
      recipeTitleSnapshot: item.recipeTitleSnapshot || "Itens avulsos",
      text: item.text.trim(),
      checked: Boolean(item.checked),
      createdAt,
      updatedAt: createdAt,
      deleted: false,
      syncedAt: null,
      lastOpId: opId,
      requiresReview: false,
    };

    await tx.store.put(next, localId);
    await enqueueOutboxOperation({
      opId,
      entity: "shopping",
      action: "create",
      payload: {
        localId,
        clientId,
        recipeId: next.recipeId,
        recipeTitleSnapshot: next.recipeTitleSnapshot,
        text: next.text,
        checked: next.checked,
        updatedAt: next.updatedAt,
      },
    });
    createdItems.push(toShoppingItem(next));
  }

  await tx.done;
  emitOfflineDataChanged("shopping_items");

  if (isOnline()) {
    void requestOutboxReplay();
  }

  return listShoppingItemsOfflineAware();
}

export async function updateShoppingItemOfflineAware(
  itemId: string,
  patch: Partial<Pick<ShoppingListItem, "text" | "checked">>,
) {
  const db = await getOfflineDb();
  const allItems = await db.getAll("shopping_items");
  const current = allItems.find((item) => item.localId === itemId || item.serverId === itemId || item.id === itemId);
  if (!current) {
    throw new Error("Shopping item not found.");
  }

  const updatedAt = nowIso();
  const next: ShoppingItemOfflineRecord = {
    ...current,
    text: patch.text !== undefined ? patch.text : current.text,
    checked: patch.checked !== undefined ? patch.checked : current.checked,
    updatedAt,
    syncedAt: null,
  };

  await db.put("shopping_items", next, current.localId);

  const pendingCreate = await findPendingCreateOperation(current.localId);
  if (pendingCreate) {
    await updateOutboxRecord(pendingCreate.opId, {
      payload: {
        ...pendingCreate.payload,
        text: next.text,
        checked: next.checked,
        updatedAt,
      },
    });
  } else {
    const opId = crypto.randomUUID();
    await enqueueOutboxOperation({
      opId,
      entity: "shopping",
      action: "update",
      baseVersion: current.updatedAt,
      payload: {
        localId: current.localId,
        serverId: current.serverId,
        clientId: current.clientId,
        text: next.text,
        checked: next.checked,
        updatedAt,
      },
    });
  }

  emitOfflineDataChanged("shopping_items");

  if (isOnline()) {
    void requestOutboxReplay();
  }

  return toShoppingItem(next);
}

export async function deleteShoppingItemOfflineAware(itemId: string) {
  const db = await getOfflineDb();
  const allItems = await db.getAll("shopping_items");
  const current = allItems.find((item) => item.localId === itemId || item.serverId === itemId || item.id === itemId);
  if (!current) {
    return;
  }

  const pendingCreate = await findPendingCreateOperation(current.localId);
  if (pendingCreate) {
    await deleteOutboxRecord(pendingCreate.opId);
    await db.delete("shopping_items", current.localId);
    emitOfflineDataChanged("shopping_items");
    return;
  }

  const opId = crypto.randomUUID();
  await db.put("shopping_items", {
    ...current,
    deleted: true,
    updatedAt: nowIso(),
    syncedAt: null,
    lastOpId: opId,
  }, current.localId);

  await enqueueOutboxOperation({
    opId,
    entity: "shopping",
    action: "delete",
    baseVersion: current.updatedAt,
    payload: {
      localId: current.localId,
      serverId: current.serverId,
      clientId: current.clientId,
    },
  });

  emitOfflineDataChanged("shopping_items");

  if (isOnline()) {
    void requestOutboxReplay();
  }
}

export async function replayShoppingOperation(opId: string, action: string) {
  const record = await getOutboxRecord(opId);
  if (!record) {
    return;
  }

  const db = await getOfflineDb();

  if (action === "create") {
    const result = await jsonFetch<ShoppingListResponse>("/api/me/shopping-list", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": opId,
      },
      body: {
        items: [{
          clientId: record.payload.clientId,
          recipeId: record.payload.recipeId,
          recipeTitleSnapshot: record.payload.recipeTitleSnapshot,
          text: record.payload.text,
          checked: record.payload.checked,
          updatedAt: record.payload.updatedAt,
        }],
      },
    });

    const syncedItem = result.items?.[0];
    if (!syncedItem) {
      throw new Error("Shopping create replay did not return an item.");
    }

    const current = await db.get("shopping_items", String(record.payload.localId || ""));
    if (!current) {
      return;
    }

    await db.put("shopping_items", {
      ...current,
      id: syncedItem.id,
      serverId: syncedItem.id,
      updatedAt: syncedItem.updatedAt,
      createdAt: syncedItem.createdAt,
      syncedAt: nowIso(),
    }, current.localId);
    emitOfflineDataChanged("shopping_items");
    return;
  }

  if (action === "update") {
    const serverId = String(record.payload.serverId || "");
    if (!serverId) {
      throw new Error("Shopping update replay is missing serverId.");
    }

    const result = await jsonFetch<{ item?: ShoppingListItem & { clientId?: string } }>(`/api/me/shopping-list?id=${encodeURIComponent(serverId)}`, {
      method: "PUT",
      headers: {
        "X-Idempotency-Key": opId,
      },
      body: {
        clientId: record.payload.clientId,
        text: record.payload.text,
        checked: record.payload.checked,
        baseVersion: record.baseVersion,
        updatedAt: record.payload.updatedAt,
      },
    });

    const syncedItem = result.item;
    if (!syncedItem) {
      throw new Error("Shopping update replay did not return an item.");
    }

    const localId = String(record.payload.localId || "");
    const current = await db.get("shopping_items", localId);
    if (!current) {
      return;
    }

    await db.put("shopping_items", {
      ...current,
      id: syncedItem.id,
      serverId: syncedItem.id,
      text: syncedItem.text,
      checked: syncedItem.checked,
      updatedAt: syncedItem.updatedAt,
      syncedAt: nowIso(),
      requiresReview: false,
    }, localId);
    emitOfflineDataChanged("shopping_items");
    return;
  }

  if (action === "delete") {
    const serverId = String(record.payload.serverId || "");
    if (!serverId) {
      throw new Error("Shopping delete replay is missing serverId.");
    }

    await jsonFetch<{ success?: boolean }>(`/api/me/shopping-list?id=${encodeURIComponent(serverId)}`, {
      method: "DELETE",
      headers: {
        "X-Idempotency-Key": opId,
      },
    });

    const localId = String(record.payload.localId || "");
    await db.delete("shopping_items", localId);
    emitOfflineDataChanged("shopping_items");
    return;
  }

  throw new Error(`Unsupported shopping action: ${action}`);
}

import { ApiError } from "../shared/http.js";
import { fetchBaserow, BASEROW_TABLES } from "../integrations/baserow/client.js";

type ShoppingListRow = {
  id?: string | number;
  recipeId?: string | null;
  items_json?: string | null;
  tenantId?: string | number;
  userId?: string | number;
};

type ShoppingItemPayload = {
  clientId?: string;
  recipeId?: string | null;
  recipeTitleSnapshot?: string;
  text?: string;
  checked?: boolean;
  updatedAt?: string;
  deletedAt?: string | null;
  lastOpId?: string | null;
};

export type ShoppingListItemRecord = {
  id: string;
  serverId: string;
  clientId: string;
  userId: string;
  recipeId: string | null;
  recipeTitleSnapshot: string;
  text: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function parsePayloads(row: ShoppingListRow): ShoppingItemPayload[] {
  if (!row.items_json) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.items_json);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => {
        if (typeof entry === "string") {
          return {
            text: entry,
          };
        }

        return entry as ShoppingItemPayload;
      });
    }

    if (parsed && typeof parsed === "object") {
      return [parsed as ShoppingItemPayload];
    }
  } catch {
    return [];
  }

  return [];
}

function buildItemId(rowId: string | number, index: number, multiItem: boolean) {
  return multiItem ? `${rowId}:${index}` : String(rowId);
}

function mapRowPayloadToItem(row: ShoppingListRow, payload: ShoppingItemPayload, index: number, total: number): ShoppingListItemRecord {
  const rowId = String(row.id ?? "");
  const clientId = payload.clientId || buildItemId(rowId, index, total > 1);
  const updatedAt = payload.updatedAt || nowIso();
  const createdAt = updatedAt;

  return {
    id: buildItemId(rowId, index, total > 1),
    serverId: rowId,
    clientId,
    userId: String(row.userId ?? ""),
    recipeId: payload.recipeId ?? row.recipeId ?? null,
    recipeTitleSnapshot: payload.recipeTitleSnapshot || "Itens avulsos",
    text: payload.text || "",
    checked: Boolean(payload.checked),
    createdAt,
    updatedAt,
  };
}

export async function listShoppingListItems(tenantId: string | number, userId: string): Promise<ShoppingListItemRecord[]> {
  const data = await fetchBaserow<{ results: ShoppingListRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}`
  );

  return data.results.flatMap((row) => {
    const payloads = parsePayloads(row);
    return payloads
      .filter((payload) => !payload.deletedAt)
      .map((payload, index) => mapRowPayloadToItem(row, payload, index, payloads.length));
  });
}

async function findRowByClientId(tenantId: string | number, userId: string, clientId: string) {
  const data = await fetchBaserow<{ results: ShoppingListRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}&filter__items_json__contains=${encodeURIComponent(clientId)}`
  );
  return data.results[0] || null;
}

export async function createShoppingListItems(
  tenantId: string | number,
  userId: string,
  items: Array<{
    clientId?: string;
    recipeId?: string | null;
    recipeTitleSnapshot?: string;
    text: string;
    checked?: boolean;
    updatedAt?: string;
  }>,
): Promise<ShoppingListItemRecord[]> {
  const created: ShoppingListItemRecord[] = [];

  for (const item of items) {
    const clientId = item.clientId || crypto.randomUUID();
    const existingRow = await findRowByClientId(tenantId, userId, clientId);
    if (existingRow) {
      const existingPayloads = parsePayloads(existingRow);
      const existingIndex = existingPayloads.findIndex((payload) => payload.clientId === clientId);
      if (existingIndex >= 0) {
        created.push(mapRowPayloadToItem(existingRow, existingPayloads[existingIndex], existingIndex, existingPayloads.length));
        continue;
      }
    }

    const payload: ShoppingItemPayload = {
      clientId,
      recipeId: item.recipeId ?? null,
      recipeTitleSnapshot: item.recipeTitleSnapshot || "Itens avulsos",
      text: item.text,
      checked: Boolean(item.checked),
      updatedAt: item.updatedAt || nowIso(),
      deletedAt: null,
      lastOpId: null,
    };

    const row = await fetchBaserow<ShoppingListRow>(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        tenantId,
        userId,
        recipeId: payload.recipeId || "",
        items_json: JSON.stringify(payload),
      }),
    });

    created.push(mapRowPayloadToItem(row, payload, 0, 1));
  }

  return created;
}

function parseCompositeItemId(itemId: string) {
  const [rowId, index] = itemId.split(":");
  return {
    rowId,
    index: index !== undefined ? Number(index) : 0,
    composite: index !== undefined,
  };
}

async function getOwnedRow(tenantId: string | number, userId: string, rowId: string) {
  const row = await fetchBaserow<ShoppingListRow>(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${rowId}/?user_field_names=true`);
  if (String(row.tenantId) !== String(tenantId) || String(row.userId) !== String(userId)) {
    throw new ApiError(404, "Shopping list item not found");
  }
  return row;
}

export async function updateShoppingListItem(
  tenantId: string | number,
  userId: string,
  itemId: string,
  patch: {
    clientId?: string;
    text?: string;
    checked?: boolean;
    baseVersion?: string;
    updatedAt?: string;
  },
): Promise<ShoppingListItemRecord> {
  const { rowId, index } = parseCompositeItemId(itemId);
  const row = await getOwnedRow(tenantId, userId, rowId);
  const payloads = parsePayloads(row);
  const currentPayload = payloads[index] || payloads[0];
  if (!currentPayload) {
    throw new ApiError(404, "Shopping list item not found");
  }

  if (patch.baseVersion && currentPayload.updatedAt && patch.baseVersion !== currentPayload.updatedAt) {
    throw new ApiError(409, "Shopping list conflict detected", {
      server: mapRowPayloadToItem(row, currentPayload, index, payloads.length),
    });
  }

  const nextPayload: ShoppingItemPayload = {
    ...currentPayload,
    clientId: patch.clientId || currentPayload.clientId || buildItemId(rowId, index, payloads.length > 1),
    text: patch.text !== undefined ? patch.text : currentPayload.text,
    checked: patch.checked !== undefined ? patch.checked : currentPayload.checked,
    updatedAt: patch.updatedAt || nowIso(),
  };

  const nextPayloads = [...payloads];
  nextPayloads[index] = nextPayload;

  const updatedRow = await fetchBaserow<ShoppingListRow>(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${rowId}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({
      recipeId: nextPayload.recipeId || "",
      items_json: JSON.stringify(nextPayloads.length === 1 ? nextPayloads[0] : nextPayloads),
    }),
  });

  return mapRowPayloadToItem(updatedRow, nextPayload, index, nextPayloads.length);
}

export async function deleteShoppingListItem(
  tenantId: string | number,
  userId: string,
  itemId: string,
): Promise<void> {
  const { rowId, index } = parseCompositeItemId(itemId);
  const row = await getOwnedRow(tenantId, userId, rowId);
  const payloads = parsePayloads(row);
  const currentPayload = payloads[index] || payloads[0];
  if (!currentPayload) {
    return;
  }

  if (currentPayload.deletedAt) {
    return;
  }

  const nextPayloads = [...payloads];
  nextPayloads[index] = {
    ...currentPayload,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  };

  await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${rowId}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({
      items_json: JSON.stringify(nextPayloads.length === 1 ? nextPayloads[0] : nextPayloads),
    }),
  });
}

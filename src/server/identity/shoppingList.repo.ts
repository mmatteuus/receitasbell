import { fetchBaserow, BASEROW_TABLES } from "../integrations/baserow/client.js";

type ShoppingListRow = {
  id?: string | number;
  recipeId?: string | null;
  items_json?: string | null;
  tenantId?: string | number;
  userId?: string | number;
};

type ShoppingListItemRecord = {
  id: string | number;
  recipeId: string | null;
  items: unknown[];
};

export async function listShoppingListItems(tenantId: string | number, userId: string): Promise<ShoppingListItemRecord[]> {
  const data = await fetchBaserow<{ results: ShoppingListRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}`
  );
  return data.results.map(row => ({
      id: row.id ?? "",
      recipeId: row.recipeId ?? null,
      items: JSON.parse(row.items_json || "[]"),
  }));
}

export async function createShoppingListItems(
  tenantId: string | number,
  userId: string,
  items: Array<Record<string, unknown>>,
): Promise<ShoppingListRow> {
    return await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true`, {
        method: "POST",
        body: JSON.stringify({ tenantId, userId, items_json: JSON.stringify(items) }),
    });
}

export async function updateShoppingListItem(
  tenantId: string | number,
  itemId: string,
  items: Array<Record<string, unknown>>,
): Promise<ShoppingListRow> {
    // Security check: simple ownership verification (fetch row first)
    const existing = await fetchBaserow<ShoppingListRow>(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${itemId}/?user_field_names=true`);
    if (String(existing.tenantId) !== String(tenantId)) {
        throw new Error("Item not found or does not belong to this tenant");
    }

    return await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${itemId}/?user_field_names=true`, {
        method: "PATCH",
        body: JSON.stringify({ items_json: JSON.stringify(items) }),
    });
}

export async function deleteShoppingListItem(tenantId: string | number, userId: string, itemId: string): Promise<void> {
    // Security check: verify ownership (tenant AND userId)
    const existing = await fetchBaserow<ShoppingListRow>(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${itemId}/?user_field_names=true`);
    if (String(existing.tenantId) !== String(tenantId) || String(existing.userId) !== String(userId)) {
        throw new Error("Item not found or does not belong to this user/tenant");
    }

    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${itemId}/`, { method: "DELETE" });
}

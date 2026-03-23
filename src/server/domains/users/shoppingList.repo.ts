import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";

export async function listShoppingListItems(tenantId: string | number, userId: string): Promise<any[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}`
  );
  return data.results.map(row => ({
      id: row.id,
      recipeId: row.recipeId,
      items: JSON.parse(row.items_json || "[]"),
  }));
}

export async function deleteShoppingListItem(tenantId: string | number, userId: string, itemId: string): Promise<void> {
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${itemId}/`, { method: "DELETE" });
}

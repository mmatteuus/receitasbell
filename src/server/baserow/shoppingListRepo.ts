import { fetchBaserow, BASEROW_TABLES } from "./client.js";

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

export async function createShoppingListItems(tenantId: string | number, userId: string, items: any[]): Promise<any> {
    // Implementação simplificada: cria uma entrada por receita ou consolida
    // O router espera uma lista de itens criados
    return []; 
}

export async function updateShoppingListItem(tenantId: string | number, userId: string, itemId: string, input: any): Promise<any> {
    return null;
}

export async function deleteShoppingListItem(tenantId: string | number, userId: string, itemId: string): Promise<void> {
    const data = await fetchBaserow<{ results: any[] }>(
        `/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}&filter__id__equal=${itemId}`
    );
    if (data.results[0]) {
        await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SHOPPING_LIST}/${itemId}/`, { method: "DELETE" });
    }
}

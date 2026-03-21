import { fetchBaserow, BASEROW_TABLES } from "./client.js";

export async function listFavoritesByUserId(tenantId: string | number, userId: string): Promise<any[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}`
  );
  return data.results;
}

export async function createFavorite(tenantId: string | number, userId: string, recipeId: string): Promise<any> {
  return await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        userId,
        recipeId,
        tenantId: String(tenantId),
        created_at: new Date().toISOString(),
      }),
    }
  );
}

export async function deleteFavorite(tenantId: string | number, userId: string, recipeId: string): Promise<void> {
    const data = await fetchBaserow<{ results: any[] }>(
        `/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}&filter__recipeId__equal=${recipeId}`
    );
    if (data.results[0]) {
        await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/${data.results[0].id}/`, { method: "DELETE" });
    }
}

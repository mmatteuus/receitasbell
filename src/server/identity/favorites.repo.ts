import { fetchBaserow, BASEROW_TABLES } from "../integrations/baserow/client.js";

export type FavoriteRow = {
  id?: string | number;
  userId?: string;
  recipeId?: string;
  created_at?: string;
  tenantId?: string | number;
};

export type FavoriteRecord = {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

function mapFavoriteRow(row: FavoriteRow): FavoriteRecord {
  return {
    id: String(row.id ?? row.recipeId ?? ""),
    recipeId: String(row.recipeId ?? ""),
    userId: String(row.userId ?? ""),
    createdAt: row.created_at ?? "",
    updatedAt: row.created_at ?? "",
  };
}

export async function listFavoritesByUserId(tenantId: string | number, userId: string): Promise<FavoriteRecord[]> {
  const data = await fetchBaserow<{ results: FavoriteRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}`
  );
  return data.results.map(mapFavoriteRow);
}

export async function findFavoriteByRecipeId(
  tenantId: string | number,
  userId: string,
  recipeId: string,
) {
  const data = await fetchBaserow<{ results: FavoriteRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}&filter__recipeId__equal=${recipeId}`
  );
  const row = data.results[0];
  return row ? mapFavoriteRow(row) : null;
}

export async function createFavorite(tenantId: string | number, userId: string, recipeId: string): Promise<FavoriteRecord> {
  const existing = await findFavoriteByRecipeId(tenantId, userId, recipeId);
  if (existing) {
    return existing;
  }

  const row = await fetchBaserow<FavoriteRow>(`/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({ userId, recipeId, tenantId: String(tenantId), created_at: new Date().toISOString() }),
  });
  return mapFavoriteRow(row);
}

export async function deleteFavorite(tenantId: string | number, userId: string, recipeId: string): Promise<void> {
  const data = await fetchBaserow<{ results: FavoriteRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__userId__equal=${userId}&filter__recipeId__equal=${recipeId}`
  );
  if (data.results[0]) {
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.FAVORITES}/${data.results[0].id}/`, { method: "DELETE" });
  }
}

import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { nowIso } from "./utils.js";

export interface FavoriteRecord {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: string;
}

function mapFavorite(row: SheetRecord<"favorites">): FavoriteRecord {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export async function listFavoritesByUserId(userId: string) {
  const rows = await readTable("favorites");
  return rows
    .filter((row) => row.user_id === userId)
    .map(mapFavorite)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createFavorite(userId: string, recipeId: string) {
  const existing = await listFavoritesByUserId(userId);
  const found = existing.find((favorite) => favorite.recipeId === recipeId);
  if (found) return found;

  const id = crypto.randomUUID();
  const createdAt = nowIso();

  const rows = await mutateTable("favorites", async (current) => [
    ...current,
    {
      id,
      user_id: userId,
      recipe_id: recipeId,
      created_at: createdAt,
    },
  ]);

  return mapFavorite(rows.find((row) => row.id === id)!);
}

export async function deleteFavorite(userId: string, favoriteId: string) {
  let deleted = false;

  await mutateTable("favorites", async (current) =>
    current.filter((row) => {
      if (row.id === favoriteId && row.user_id === userId) {
        deleted = true;
        return false;
      }
      return true;
    }),
  );

  if (!deleted) {
    throw new ApiError(404, "Favorite not found");
  }
}

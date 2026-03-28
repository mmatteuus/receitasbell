import type { RecipeRecord } from "@/lib/recipes/types";
import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";

export async function upsertRecipeSnapshots(recipes: RecipeRecord[]) {
  if (!recipes.length) {
    return;
  }

  const db = await getOfflineDb();
  const tx = db.transaction("recipe_snapshots", "readwrite");
  const now = new Date().toISOString();

  for (const recipe of recipes) {
    await tx.store.put({
      id: recipe.id,
      slug: recipe.slug,
      updatedAt: recipe.updatedAt,
      accessTier: recipe.accessTier,
      data: recipe,
      viewedAt: now,
    } as never, recipe.id);
  }

  await tx.done;
  emitOfflineDataChanged("recipe_snapshots");
}

export async function getRecipeSnapshotBySlug(slug: string) {
  const db = await getOfflineDb();
  const key = await db.getKeyFromIndex("recipe_snapshots", "by_slug", slug);
  if (!key) {
    return null;
  }
  return db.get("recipe_snapshots", String(key));
}

export async function getRecipeSnapshotsByIds(ids: string[]) {
  if (!ids.length) {
    return [];
  }

  const db = await getOfflineDb();
  const snapshots = await Promise.all(ids.map((id) => db.get("recipe_snapshots", id)));
  return snapshots.filter(Boolean).map((snapshot) => snapshot!.data);
}

export async function listRecentRecipeSnapshots(limit = 12) {
  const db = await getOfflineDb();
  const snapshots = await db.getAll("recipe_snapshots");
  return snapshots
    .sort((left, right) => right.viewedAt.localeCompare(left.viewedAt))
    .slice(0, limit)
    .map((snapshot) => snapshot.data);
}

export async function searchRecipeSnapshots(params: {
  categorySlug?: string;
  q?: string;
  ids?: string[];
}) {
  const db = await getOfflineDb();
  const snapshots = await db.getAll("recipe_snapshots");
  const wantedIds = params.ids?.length ? new Set(params.ids.map(String)) : null;
  const normalizedQuery = params.q?.trim().toLowerCase() || "";

  return snapshots
    .map((snapshot) => snapshot.data)
    .filter((recipe) => {
      if (wantedIds && !wantedIds.has(String(recipe.id))) {
        return false;
      }
      if (params.categorySlug && params.categorySlug !== "all" && recipe.categorySlug !== params.categorySlug) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${recipe.title} ${recipe.slug} ${recipe.description}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }
      return true;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

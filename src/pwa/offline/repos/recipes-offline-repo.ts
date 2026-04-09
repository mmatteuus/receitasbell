import { getRecipeSnapshotBySlug, upsertRecipeSnapshots } from "../cache/recipe-snapshot";
import type { RecipeRecord } from "@/lib/recipes/types";

/**
 * Retorna receita pelo slug usando snapshot local.
 * Retorna null se não houver snapshot disponível.
 */
export async function getRecipeOfflineBySlug(slug: string): Promise<RecipeRecord | null> {
  const snapshot = await getRecipeSnapshotBySlug(slug);
  return snapshot?.data ?? null;
}

/**
 * Persiste receita no snapshot local para uso futuro offline.
 */
export async function saveRecipeSnapshot(recipe: RecipeRecord): Promise<void> {
  await upsertRecipeSnapshots([recipe]);
}

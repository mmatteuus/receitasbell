import { searchRecipeSnapshots } from "../cache/recipe-snapshot";
import type { RecipeRecord } from "@/lib/recipes/types";

export interface OfflineSearchParams {
  q?: string;
  categorySlug?: string;
  tier?: "all" | "free" | "paid";
  tempo?: "all" | "quick" | "medium" | "long";
  ordem?: "latest" | "timeAsc" | "timeDesc";
}

function matchesTier(recipe: RecipeRecord, tier: string | undefined) {
  if (!tier || tier === "all") return true;
  return recipe.accessTier === tier;
}

function matchesTempo(recipe: RecipeRecord, tempo: string | undefined) {
  if (!tempo || tempo === "all") return true;
  const t = recipe.totalTime ?? 0;
  if (tempo === "quick") return t > 0 && t <= 30;
  if (tempo === "medium") return t > 30 && t <= 60;
  if (tempo === "long") return t > 60;
  return true;
}

function sortRecipes(recipes: RecipeRecord[], ordem: string | undefined) {
  const copy = [...recipes];
  if (ordem === "timeAsc") return copy.sort((a, b) => (a.totalTime ?? 0) - (b.totalTime ?? 0));
  if (ordem === "timeDesc") return copy.sort((a, b) => (b.totalTime ?? 0) - (a.totalTime ?? 0));
  // latest
  return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function searchOfflineRecipes(params: OfflineSearchParams): Promise<RecipeRecord[]> {
  const base = await searchRecipeSnapshots({
    q: params.q,
    categorySlug: params.categorySlug,
  });

  const filtered = base.filter(
    (r) => matchesTier(r, params.tier) && matchesTempo(r, params.tempo),
  );

  return sortRecipes(filtered, params.ordem);
}

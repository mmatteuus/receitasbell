import type { Recipe } from "@/types/recipe";
import type { SettingsMap } from "@/types/settings";

function sortByRecency(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => {
    return (b.publishedAt || b.updatedAt || "").localeCompare(a.publishedAt || a.updatedAt || "");
  });
}

export function pickFeaturedRecipes(recipes: Recipe[], settings: SettingsMap) {
  const limit = Math.max(3, Math.min(settings.featuredLimit || 7, 12));
  if (settings.featuredMode === "manual" && settings.featuredRecipeIds.length > 0) {
    const map = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    return settings.featuredRecipeIds.map((id) => map.get(id)).filter((recipe): recipe is Recipe => Boolean(recipe)).slice(0, limit);
  }

  if (settings.featuredMode === "category" && settings.featuredCategorySlug) {
    return recipes.filter((recipe) => recipe.categorySlug === settings.featuredCategorySlug).slice(0, limit);
  }

  if (settings.featuredMode === "featuredFlag") {
    const flagged = recipes.filter((recipe) => recipe.isFeatured);
    if (flagged.length > 0) return flagged.slice(0, limit);
  }

  return sortByRecency(recipes).slice(0, limit);
}

export function pickPremiumRecipes(recipes: Recipe[], featuredRecipes: Recipe[], limit = 4) {
  const featuredIds = new Set(featuredRecipes.map((recipe) => recipe.id));
  return recipes.filter((recipe) => recipe.accessTier === "paid" && !featuredIds.has(recipe.id)).slice(0, limit);
}

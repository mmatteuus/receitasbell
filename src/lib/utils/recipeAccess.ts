import type { Recipe } from "../../types/recipe.js";
import type { CartItem } from "../../types/cart.js";
import type { RecipeRecord } from "../recipes/types.js";

export function isRecipeUnlocked(recipe: Pick<Recipe, "accessTier"> & { hasAccess?: boolean }) {
  return recipe.accessTier === "free" || Boolean(recipe.hasAccess);
}

export function deriveRecipeTeaser(recipe: Pick<Recipe, "fullIngredients" | "fullInstructions">, previewCount = 2) {
  return {
    ingredients: recipe.fullIngredients.slice(0, previewCount),
    instructions: recipe.fullInstructions.slice(0, previewCount),
  };
}

export function buildCartItemFromRecipe(
  recipe: Pick<Recipe | RecipeRecord, "id" | "title" | "slug" | "priceBRL" | "imageUrl">,
): CartItem {
  return {
    recipeId: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    priceBRL: recipe.priceBRL ?? 0,
    imageUrl: recipe.imageUrl || "/placeholder.svg",
  };
}

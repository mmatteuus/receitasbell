import type { CartItem, Recipe } from "@/types/recipe";

export function isRecipeUnlocked(recipe: Pick<Recipe, "accessTier" | "isUnlocked">) {
  return recipe.accessTier === "free" || Boolean(recipe.isUnlocked);
}

export function deriveRecipeTeaser(recipe: Pick<Recipe, "fullIngredients" | "fullInstructions">, previewCount = 2) {
  return {
    ingredients: recipe.fullIngredients.slice(0, previewCount),
    instructions: recipe.fullInstructions.slice(0, previewCount),
  };
}

export function buildCartItemFromRecipe(recipe: Pick<Recipe, "id" | "title" | "slug" | "priceBRL" | "imageUrl" | "image">): CartItem {
  return {
    recipeId: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    priceBRL: recipe.priceBRL ?? 0,
    imageUrl: recipe.imageUrl || recipe.image || "/placeholder.svg",
  };
}

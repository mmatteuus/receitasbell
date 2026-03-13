import type { Recipe } from "@/types/recipe";
import {
  createRecipe,
  deleteRecipe as deleteRecipeRequest,
  getRecipeById as getRecipeByIdRequest,
  getRecipeBySlug as getRecipeBySlugRequest,
  listRecipes,
  type RecipeMutationPayload,
  updateRecipe as updateRecipeRequest,
} from "@/lib/api/recipes";
import { generateSlug } from "@/lib/helpers";

function toPayload(recipe: Partial<Recipe>): RecipeMutationPayload {
  return {
    title: recipe.title || "",
    slug: recipe.slug,
    description: recipe.description || "",
    imageUrl: recipe.imageUrl || recipe.image || "",
    categorySlug: recipe.categorySlug || "salgadas",
    tags: recipe.tags || [],
    status: recipe.status || "draft",
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    servings: recipe.servings || 1,
    accessTier: recipe.accessTier || "free",
    priceBRL: recipe.accessTier === "paid" ? recipe.priceBRL ?? 0 : null,
    fullIngredients: recipe.fullIngredients || [],
    fullInstructions: recipe.fullInstructions || [],
    publishedAt: recipe.publishedAt ?? null,
    createdAt: recipe.createdAt,
    createdByUserId: recipe.createdByUserId ?? null,
    excerpt: recipe.excerpt || "",
    seoTitle: recipe.seoTitle || "",
    seoDescription: recipe.seoDescription || "",
    isFeatured: recipe.isFeatured || false,
  };
}

export async function getRecipes() {
  return listRecipes({ includeDrafts: true });
}

export async function getPublishedRecipes() {
  return listRecipes();
}

export async function getRecipeBySlug(slug: string) {
  return getRecipeBySlugRequest(slug);
}

export async function getRecipeById(id: string) {
  return getRecipeByIdRequest(id);
}

export async function saveRecipe(recipe: Partial<Recipe> & { id?: string }) {
  if (recipe.id) {
    return updateRecipeRequest(recipe.id, toPayload(recipe));
  }
  return createRecipe(toPayload(recipe));
}

export async function deleteRecipe(id: string) {
  return deleteRecipeRequest(id);
}

export function isSlugTaken(slug: string, recipes: Recipe[], excludeId?: string) {
  return recipes.some((recipe) => recipe.slug === slug && recipe.id !== excludeId);
}

export function uniqueSlug(title: string, recipes: Recipe[] = [], excludeId?: string) {
  const base = generateSlug(title) || "receita";
  let slug = base;
  let suffix = 2;

  while (isSlugTaken(slug, recipes, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

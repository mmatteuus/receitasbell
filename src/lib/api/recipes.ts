import type { Recipe } from "@/types/recipe";
import { buildQuery, jsonFetch } from "./client";

export type RecipeMutationPayload = {
  id?: string;
  slug?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  categorySlug: string;
  tags?: string[];
  status?: "draft" | "published";
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  accessTier?: "free" | "paid";
  priceBRL?: number | null;
  fullIngredients?: string[];
  fullInstructions?: string[];
  publishedAt?: string | null;
  createdAt?: string;
  createdByUserId?: string | null;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
};

export async function listRecipes(params: {
  categorySlug?: string;
  q?: string;
  ids?: string[];
  includeDrafts?: boolean;
} = {}) {
  const query = buildQuery({
    categorySlug: params.categorySlug,
    q: params.q,
    ids: params.ids,
  });
  const result = await jsonFetch<{ recipes: Recipe[] }>(`/api/recipes${query}`, {
    admin: Boolean(params.includeDrafts),
  });
  return result.recipes;
}

export async function getRecipeBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const result = await jsonFetch<{ recipe: Recipe }>(`/api/recipes/${encodeURIComponent(slug)}`, {
    admin: Boolean(options.includeDrafts),
  });
  return result.recipe;
}

export async function getRecipeById(id: string) {
  const query = buildQuery({ by: "id" });
  const result = await jsonFetch<{ recipe: Recipe }>(`/api/recipes/${encodeURIComponent(id)}${query}`, {
    admin: true,
  });
  return result.recipe;
}

export async function createRecipe(input: RecipeMutationPayload) {
  const result = await jsonFetch<{ recipe: Recipe }>("/api/recipes", {
    method: "POST",
    admin: true,
    body: input,
  });
  return result.recipe;
}

export async function updateRecipe(id: string, input: RecipeMutationPayload) {
  const result = await jsonFetch<{ recipe: Recipe }>(`/api/recipes/${encodeURIComponent(id)}`, {
    method: "PUT",
    admin: true,
    body: input,
  });
  return result.recipe;
}

export async function deleteRecipe(id: string) {
  await jsonFetch<void>(`/api/recipes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}


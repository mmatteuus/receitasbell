import type { Recipe } from "@/types/recipe";
import { buildQuery, jsonFetch } from "./client";
import { filterInternetRecipes, getInternetRecipes, isInternetFallbackEnabled } from "./internetRecipes";
import { normalizeRecipeForUI } from "@/lib/recipes/presentation";

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
  try {
    const result = await jsonFetch<{ recipes: Recipe[] }>(`/api/recipes${query}`, {
      admin: Boolean(params.includeDrafts),
    });
    return result.recipes.map(normalizeRecipeForUI);
  } catch (error) {
    if (params.includeDrafts || !isInternetFallbackEnabled()) {
      throw error;
    }

    console.warn("API de receitas indisponível. Usando fallback externo controlado.");
    const internetRecipes = await getInternetRecipes();
    return filterInternetRecipes(internetRecipes, params).map(normalizeRecipeForUI);
  }
}

export async function getRecipeBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  try {
    const result = await jsonFetch<{ recipe: Recipe }>(`/api/recipes/${encodeURIComponent(slug)}`, {
      admin: Boolean(options.includeDrafts),
    });
    return normalizeRecipeForUI(result.recipe);
  } catch (error) {
    if (options.includeDrafts || !isInternetFallbackEnabled()) {
      throw error;
    }

    console.warn("API de receita indisponível. Usando fallback externo controlado.");
    const internetRecipes = await getInternetRecipes();
    const fallback = internetRecipes.find((recipe) => recipe.slug === slug);
    if (!fallback) {
      throw error;
    }
    return normalizeRecipeForUI(fallback);
  }
}

export async function getRecipeById(id: string) {
  const query = buildQuery({ by: "id" });
  const result = await jsonFetch<{ recipe: Recipe }>(`/api/recipes/${encodeURIComponent(id)}${query}`, {
    admin: true,
  });
  return normalizeRecipeForUI(result.recipe);
}

export async function createRecipe(input: RecipeMutationPayload) {
  const result = await jsonFetch<{ recipe: Recipe }>("/api/recipes", {
    method: "POST",
    admin: true,
    body: input,
  });
  return normalizeRecipeForUI(result.recipe);
}

export async function updateRecipe(id: string, input: RecipeMutationPayload) {
  const result = await jsonFetch<{ recipe: Recipe }>(`/api/recipes/${encodeURIComponent(id)}`, {
    method: "PUT",
    admin: true,
    body: input,
  });
  return normalizeRecipeForUI(result.recipe);
}

export async function deleteRecipe(id: string) {
  await jsonFetch<void>(`/api/recipes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}

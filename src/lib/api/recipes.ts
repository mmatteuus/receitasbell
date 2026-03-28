import type { ImageFileMeta } from "@/types/recipe";
import type { RecipeRecord } from "@/lib/recipes/types";
import { buildQuery, jsonFetch } from "./client";
import { filterInternetRecipes, getInternetRecipes, isInternetFallbackEnabled } from "./internetRecipes";
import { normalizeRecipeForUI } from "@/lib/recipes/presentation";
import { logger } from "@/lib/logger";
import {
  getRecipeSnapshotBySlug,
  searchRecipeSnapshots,
  upsertRecipeSnapshots,
} from "@/pwa/offline/cache/recipe-snapshot";

export type RecipeMutationPayload = {
  id?: string;
  slug?: string;
  baseServerUpdatedAt?: string | null;
  title: string;
  description?: string;
  imageUrl?: string;
  imageFileMeta?: ImageFileMeta | null;
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

export type PublicRecipeTierFilter = "all" | "free" | "paid";
export type PublicRecipeTempoFilter = "all" | "quick" | "medium" | "long";
export type PublicRecipeOrderFilter = "latest" | "timeAsc" | "timeDesc";

export async function listRecipes(params: {
  categorySlug?: string;
  q?: string;
  ids?: string[];
  includeDrafts?: boolean;
  tier?: PublicRecipeTierFilter;
  tempo?: PublicRecipeTempoFilter;
  ordem?: PublicRecipeOrderFilter;
} = {}) {
  const query = params.includeDrafts
    ? buildQuery({
      categorySlug: params.categorySlug,
      q: params.q,
      ids: params.ids,
    })
    : buildQuery({
      category: params.categorySlug,
      q: params.q,
      ids: params.ids,
      tier: params.tier,
      tempo: params.tempo,
      ordem: params.ordem,
    });

  const path = params.includeDrafts ? `/api/admin/recipes${query}` : `/api/public/catalog${query}`;

  try {
    const result = await jsonFetch<{ recipes?: RecipeRecord[]; items?: RecipeRecord[] }>(path, {
      admin: Boolean(params.includeDrafts),
    });
    const recipes = result.recipes ?? result.items ?? [];
    const normalized = recipes.map(normalizeRecipeForUI);
    if (!params.includeDrafts) {
      void upsertRecipeSnapshots(normalized);
    }
    return normalized;
  } catch (error) {
    if (params.includeDrafts || !isInternetFallbackEnabled()) {
      if (!params.includeDrafts) {
        const cached = await searchRecipeSnapshots(params);
        if (cached.length) {
          return cached.map(normalizeRecipeForUI);
        }
      }
      throw error;
    }

    logger.warn("recipes.api_unavailable", {
      fallback: "internet",
      q: params.q,
      categorySlug: params.categorySlug,
    });
    const internetRecipes = await getInternetRecipes();
    return filterInternetRecipes(internetRecipes, params).map(normalizeRecipeForUI);
  }
}

export async function getRecipeBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  try {
    const path = options.includeDrafts
      ? `/api/admin/recipes${buildQuery({ slug })}`
      : `/api/public/recipes/${encodeURIComponent(slug)}`;
    const result = await jsonFetch<{ recipe?: RecipeRecord; item?: RecipeRecord }>(path, {
      admin: Boolean(options.includeDrafts),
    });
    const recipe = result.recipe ?? result.item;
    if (!recipe) {
      throw new Error("Recipe response payload is missing.");
    }
    const normalized = normalizeRecipeForUI(recipe);
    if (!options.includeDrafts) {
      void upsertRecipeSnapshots([normalized]);
    }
    return normalized;
  } catch (error) {
    if (options.includeDrafts || !isInternetFallbackEnabled()) {
      if (!options.includeDrafts) {
        const cached = await getRecipeSnapshotBySlug(slug);
        if (cached) {
          return normalizeRecipeForUI(cached.data);
        }
      }
      throw error;
    }

    logger.warn("recipe.api_unavailable", {
      fallback: "internet",
      slug,
    });
    const internetRecipes = await getInternetRecipes();
    const fallback = internetRecipes.find((recipe) => recipe.slug === slug);
    if (!fallback) {
      throw error;
    }
    return normalizeRecipeForUI(fallback);
  }
}

export async function getRecipeById(id: string) {
  const result = await jsonFetch<{ recipe?: RecipeRecord; item?: RecipeRecord }>(`/api/admin/recipes${buildQuery({ id })}`, {
    admin: true,
  });
  const recipe = result.recipe ?? result.item;
  if (!recipe) {
    throw new Error("Recipe response payload is missing.");
  }
  return normalizeRecipeForUI(recipe);
}

export async function createRecipe(input: RecipeMutationPayload) {
  const result = await jsonFetch<{ recipe?: RecipeRecord; item?: RecipeRecord }>("/api/admin/recipes", {
    method: "POST",
    admin: true,
    body: input,
  });
  const recipe = result.recipe ?? result.item;
  if (!recipe) {
    throw new Error("Recipe response payload is missing.");
  }
  return normalizeRecipeForUI(recipe);
}

export async function updateRecipe(id: string, input: RecipeMutationPayload) {
  const result = await jsonFetch<{ recipe?: RecipeRecord; item?: RecipeRecord }>(`/api/admin/recipes${buildQuery({ id })}`, {
    method: "PUT",
    admin: true,
    body: input,
  });
  const recipe = result.recipe ?? result.item;
  if (!recipe) {
    throw new Error("Recipe response payload is missing.");
  }
  return normalizeRecipeForUI(recipe);
}

export async function deleteRecipe(id: string) {
  await jsonFetch<void>(`/api/admin/recipes${buildQuery({ id })}`, {
    method: "DELETE",
    admin: true,
  });
}

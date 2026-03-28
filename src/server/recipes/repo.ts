import { fetchBaserow } from "../integrations/baserow/client.js";
import { BASEROW_TABLES } from "../integrations/baserow/tables.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import type { AccessTier, Recipe } from "../../types/recipe.js";

type RecipeRow = {
  id?: string | number;
  slug?: string;
  title?: string;
  description?: string;
  image?: string | null;
  image_file_meta_json?: string | null;
  categoryId?: string;
  tags_json?: string | null;
  status?: string;
  prep_time?: string | number;
  cook_time?: string | number;
  total_time?: string | number;
  servings?: string | number;
  diff?: string | null;
  kcal?: string | number | null;
  videoId?: string | null;
  access_tier?: string | null;
  price_brl?: string | number | null;
  full_ingredients_json?: string | null;
  full_instructions_json?: string | null;
  excerpt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  is_featured?: boolean | number | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  created_by_user_id?: string | number | null;
  tenantId?: string | number;
};

export type RecipeListTier = "all" | "free" | "paid";
export type RecipeListTempo = "all" | "quick" | "medium" | "long";
export type RecipeListOrder = "latest" | "timeAsc" | "timeDesc";

function filterByTempo(recipes: RecipeRecord[], tempo: RecipeListTempo) {
  if (tempo === "quick") {
    return recipes.filter((recipe) => Number(recipe.totalTime || 0) <= 30);
  }

  if (tempo === "medium") {
    return recipes.filter((recipe) => {
      const totalTime = Number(recipe.totalTime || 0);
      return totalTime > 30 && totalTime <= 60;
    });
  }

  if (tempo === "long") {
    return recipes.filter((recipe) => Number(recipe.totalTime || 0) > 60);
  }

  return recipes;
}

function sortRecipes(recipes: RecipeRecord[], order: RecipeListOrder) {
  if (order === "timeAsc") {
    return [...recipes].sort((a, b) => Number(a.totalTime || 0) - Number(b.totalTime || 0));
  }

  if (order === "timeDesc") {
    return [...recipes].sort((a, b) => Number(b.totalTime || 0) - Number(a.totalTime || 0));
  }

  return [...recipes].sort((a, b) => {
    const left = b.publishedAt || b.updatedAt || "";
    const right = a.publishedAt || a.updatedAt || "";
    return left.localeCompare(right);
  });
}

export async function listRecipes(tenantId: string | number, options: { 
  includeDrafts?: boolean;
  categorySlug?: string;
  q?: string;
  ids?: string[];
  tier?: RecipeListTier;
  tempo?: RecipeListTempo;
  ordem?: RecipeListOrder;
} = {}): Promise<RecipeRecord[]> {
  let url = `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/?user_field_names=true&filter__tenantId__equal=${tenantId}`;
  
  if (!options.includeDrafts) url += "&filter__status__equal=published";
  if (options.categorySlug && options.categorySlug !== "all") url += `&filter__categoryId__equal=${encodeURIComponent(options.categorySlug)}`;
  if (options.q) url += `&filter__title__contains=${encodeURIComponent(options.q)}`;
  if (options.tier && options.tier !== "all") url += `&filter__access_tier__equal=${encodeURIComponent(options.tier)}`;

  const data = await fetchBaserow<{ results: RecipeRow[] }>(url);
  let recipes = data.results.map(record => mapRecipeRowToRecord(record));

  if (options.ids?.length) {
    const wanted = new Set(options.ids.map((id) => String(id)));
    recipes = recipes.filter((recipe) => wanted.has(String(recipe.id)));
  }

  const tempo = options.tempo || "all";
  const ordem = options.ordem || "latest";

  recipes = filterByTempo(recipes, tempo);
  recipes = sortRecipes(recipes, ordem);

  return recipes;
}

export async function getRecipeBySlug(tenantId: string | number, slug: string): Promise<RecipeRecord | null> {
  const data = await fetchBaserow<{ results: RecipeRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__slug__equal=${slug}`
  );
  const record = data.results[0];
  if (!record) return null;
  return mapRecipeRowToRecord(record);
}

export async function getRecipeById(tenantId: string | number, id: string | number): Promise<RecipeRecord | null> {
  try {
    const record = await fetchBaserow<RecipeRow>(`/api/database/rows/table/${BASEROW_TABLES.RECIPES}/${id}/?user_field_names=true`);
    if (String(record.tenantId) !== String(tenantId)) return null;
    return mapRecipeRowToRecord(record);
  } catch (err) {
    return null;
  }
}

function parseDifficulty(value: unknown): Recipe["difficulty"] {
  if (value === "Fácil" || value === "Médio" || value === "Difícil") return value;
  return null;
}

function parseAccessTier(value: unknown): AccessTier {
  return value === "paid" ? "paid" : "free";
}

function mapRecipeRowToRecord(row: RecipeRow): RecipeRecord {
  return {
    id: String(row.id ?? ""),
    slug: row.slug ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    imageUrl: row.image || null,
    imageFileMeta: parseJson(row.image_file_meta_json, null),
    categorySlug: row.categoryId ?? "",
    tags: parseJson(row.tags_json, []),
    status: row.status === "published" ? "published" : "draft",
    prepTime: Number(row.prep_time || 0),
    cookTime: Number(row.cook_time || 0),
    totalTime: Number(row.total_time || 0),
    servings: Number(row.servings || 1),
    difficulty: parseDifficulty(row.diff),
    calories: row.kcal ? Number(row.kcal) : null,
    videoUrl: row.videoId || null,
    accessTier: parseAccessTier(row.access_tier),
    priceBRL: row.price_brl ? Number(row.price_brl) : null,
    fullIngredients: parseJson(row.full_ingredients_json, []),
    fullInstructions: parseJson(row.full_instructions_json, []),
    excerpt: row.excerpt || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    isFeatured: Boolean(row.is_featured),
    ratingAvg: 0,
    ratingCount: 0,
    hasAccess: true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    publishedAt: row.published_at || null,
    createdByUserId: row.created_by_user_id != null ? String(row.created_by_user_id) : null,
  };
}

function parseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

export async function createRecipe(tenantId: string | number, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  const now = new Date().toISOString();
  const payload = {
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description || "",
    image: recipe.imageUrl || "",
    image_file_meta_json: JSON.stringify(recipe.imageFileMeta || null),
    categoryId: recipe.categorySlug || "",
    tags_json: JSON.stringify(recipe.tags || []),
    status: recipe.status || "draft",
    prep_time: recipe.prepTime || 0,
    cook_time: recipe.cookTime || 0,
    total_time: (recipe.prepTime || 0) + (recipe.cookTime || 0),
    servings: recipe.servings || 1,
    diff: recipe.difficulty || "",
    kcal: recipe.calories || 0,
    videoId: recipe.videoUrl || "",
    access_tier: recipe.accessTier || "free",
    price_brl: recipe.priceBRL || 0,
    full_ingredients_json: JSON.stringify(recipe.fullIngredients || []),
    full_instructions_json: JSON.stringify(recipe.fullInstructions || []),
    is_featured: !!recipe.isFeatured,
    excerpt: recipe.excerpt || "",
    seo_title: recipe.seoTitle || "",
    seo_description: recipe.seoDescription || "",
    tenantId: String(tenantId),
    created_at: now,
    updated_at: now,
    published_at: recipe.status === "published" ? now : "",
    created_by_user_id: recipe.createdByUserId || "",
  };

  const record = await fetchBaserow<RecipeRow>(`/api/database/rows/table/${BASEROW_TABLES.RECIPES}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify(payload),
  });

  return mapRecipeRowToRecord(record);
}

export async function updateRecipe(tenantId: string | number, recipeId: string | number, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  // Security check: verify ownership
  const existing = await getRecipeById(tenantId, recipeId);
  if (!existing) throw new Error("Recipe not found or does not belong to this tenant");

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (recipe.title !== undefined) payload.title = recipe.title;
  // ... rest of payload mapping ...
  if (recipe.slug !== undefined) payload.slug = recipe.slug;
  if (recipe.description !== undefined) payload.description = recipe.description;
  if (recipe.imageUrl !== undefined) payload.image = recipe.imageUrl;
  if (recipe.imageFileMeta !== undefined) payload.image_file_meta_json = JSON.stringify(recipe.imageFileMeta);
  if (recipe.categorySlug !== undefined) payload.categoryId = recipe.categorySlug;
  if (recipe.tags !== undefined) payload.tags_json = JSON.stringify(recipe.tags);
  if (recipe.status !== undefined) {
      payload.status = recipe.status;
      if (recipe.status === "published") payload.published_at = new Date().toISOString();
  }
  if (recipe.prepTime !== undefined) payload.prep_time = recipe.prepTime;
  if (recipe.cookTime !== undefined) payload.cook_time = recipe.cookTime;
  if (recipe.servings !== undefined) payload.servings = recipe.servings;
  if (recipe.difficulty !== undefined) payload.diff = recipe.difficulty;
  if (recipe.calories !== undefined) payload.kcal = recipe.calories;
  if (recipe.videoUrl !== undefined) payload.videoId = recipe.videoUrl;
  if (recipe.accessTier !== undefined) payload.access_tier = recipe.accessTier;
  if (recipe.priceBRL !== undefined) payload.price_brl = recipe.priceBRL;
  if (recipe.fullIngredients !== undefined) payload.full_ingredients_json = JSON.stringify(recipe.fullIngredients);
  if (recipe.fullInstructions !== undefined) payload.full_instructions_json = JSON.stringify(recipe.fullInstructions);
  if (recipe.isFeatured !== undefined) payload.is_featured = !!recipe.isFeatured;
  if (recipe.excerpt !== undefined) payload.excerpt = recipe.excerpt;
  if (recipe.seoTitle !== undefined) payload.seo_title = recipe.seoTitle;
  if (recipe.seoDescription !== undefined) payload.seo_description = recipe.seoDescription;

  const record = await fetchBaserow<RecipeRow>(`/api/database/rows/table/${BASEROW_TABLES.RECIPES}/${recipeId}/?user_field_names=true`, {
      method: "PATCH",
      body: JSON.stringify(payload),
  });

  return mapRecipeRowToRecord(record);
}

export async function deleteRecipe(tenantId: string | number, recipeId: string | number): Promise<void> {
  // Security check: verify ownership
  const existing = await getRecipeById(tenantId, recipeId);
  if (!existing) throw new Error("Recipe not found or does not belong to this tenant");

  await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.RECIPES}/${recipeId}/`, { method: "DELETE" });
}

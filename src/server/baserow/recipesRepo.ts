import { fetchBaserow, BASEROW_TABLES } from "./client.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import type { ImageFileMeta } from "../../types/recipe.js";

export async function listRecipes(tenantId: string | number, options: { 
  includeDrafts?: boolean;
  categorySlug?: string;
  q?: string;
} = {}): Promise<RecipeRecord[]> {
  let url = `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/?user_field_names=true&filter__tenantId__equal=${tenantId}`;
  
  if (!options.includeDrafts) {
    url += "&filter__status__equal=published";
  }

  if (options.categorySlug && options.categorySlug !== "all") {
    url += `&filter__categoryId__equal=${encodeURIComponent(options.categorySlug)}`;
  }

  if (options.q) {
    url += `&filter__title__contains=${encodeURIComponent(options.q)}`;
  }

  const data = await fetchBaserow<{ results: any[] }>(url);
  
  return data.results.map(record => mapRecipeRowToRecord(record));
}

export async function getRecipeBySlug(tenantId: string | number, slug: string): Promise<RecipeRecord | null> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__slug__equal=${slug}`
  );
  
  const record = data.results[0];
  if (!record) return null;
  
  return mapRecipeRowToRecord(record);
}

export async function getRecipeById(tenantId: string | number, id: string | number): Promise<RecipeRecord | null> {
  try {
    const record = await fetchBaserow<any>(
      `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/${id}/?user_field_names=true`
    );
    if (String(record.tenantId) !== String(tenantId)) return null;
    return mapRecipeRowToRecord(record);
  } catch (err) {
    return null;
  }
}

function mapRecipeRowToRecord(row: any): RecipeRecord {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    imageUrl: row.image || null,
    imageFileMeta: parseJson(row.image_file_meta_json, null),
    categorySlug: row.categoryId, // Usando categoryId como slug no mapeamento simples
    tags: parseJson(row.tags_json, []),
    status: row.status === "published" ? "published" : "draft",
    prepTime: Number(row.prep_time || 0),
    cookTime: Number(row.cook_time || 0),
    totalTime: Number(row.total_time || 0),
    servings: Number(row.servings || 1),
    difficulty: row.diff as any,
    calories: row.kcal ? Number(row.kcal) : null,
    videoUrl: row.videoId || null,
    accessTier: (row.access_tier as any) || "free",
    priceBRL: row.price_brl ? Number(row.price_brl) : null,
    fullIngredients: parseJson(row.full_ingredients_json, []),
    fullInstructions: parseJson(row.full_instructions_json, []),
    excerpt: row.excerpt || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    isFeatured: Boolean(row.is_featured),
    ratingAvg: 0, // Implementar resumo de avaliações separadamente se necessário
    ratingCount: 0,
    hasAccess: true, // Lógica de acesso deve ser aplicada no nível superior
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at || null,
    createdByUserId: row.created_by_user_id || null,
  };
}

function parseJson(str: string | null | undefined, fallback: any) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
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

  const record = await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return mapRecipeRowToRecord(record);
}

export async function updateRecipe(tenantId: string | number, recipeId: string | number, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  const existing = await getRecipeById(tenantId, recipeId);
  if (!existing) throw new Error("Recipe not found or does not belong to tenant");

  const payload: any = {};
  if (recipe.title !== undefined) payload.title = recipe.title;
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
  
  payload.updated_at = new Date().toISOString();

  const record = await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/${recipeId}/?user_field_names=true`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  return mapRecipeRowToRecord(record);
}

export async function deleteRecipe(tenantId: string | number, recipeId: string | number): Promise<void> {
  const existing = await getRecipeById(tenantId, recipeId);
  if (!existing) throw new Error("Recipe not found or does not belong to tenant");

  await fetchBaserow(
    `/api/database/rows/table/${BASEROW_TABLES.RECIPES}/${recipeId}/`,
    { method: "DELETE" }
  );
}


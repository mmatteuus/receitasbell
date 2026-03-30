import { supabaseAdmin } from "../integrations/supabase/client.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import type { AccessTier, Recipe } from "../../types/recipe.js";

export type RecipeListTier = "all" | "free" | "paid";
export type RecipeListTempo = "all" | "quick" | "medium" | "long";
export type RecipeListOrder = "latest" | "timeAsc" | "timeDesc";

export async function listRecipes(tenantId: string, options: { 
  includeDrafts?: boolean;
  categorySlug?: string;
  q?: string;
  ids?: string[];
  tier?: RecipeListTier;
  tempo?: RecipeListTempo;
  ordem?: RecipeListOrder;
} = {}): Promise<RecipeRecord[]> {
  let query = supabaseAdmin
    .from('recipes')
    .select('*')
    .eq('tenant_id', tenantId);

  if (!options.includeDrafts) {
    query = query.eq('status', 'published').eq('is_active', true);
  }

  if (options.categorySlug && options.categorySlug !== 'all') {
    query = query.eq('category_id', options.categorySlug); // No Supabase usamos ID ou vinculação
  }

  if (options.q) {
    query = query.ilike('title', `%${options.q}%`);
  }

  if (options.tier && options.tier !== 'all') {
    query = query.eq('access_tier', options.tier);
  }

  if (options.ids?.length) {
    query = query.in('id', options.ids);
  }

  // Ordenação
  if (options.ordem === 'timeAsc') {
    query = query.order('total_time_min', { ascending: true });
  } else if (options.ordem === 'timeDesc') {
    query = query.order('total_time_min', { ascending: false });
  } else {
    query = query.order('published_at', { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let results = data.map(mapRecipeRowToRecord);

  // Filtro de tempo (Postgres poderia fazer, mas mantemos lógica local para precisão se necessário)
  if (options.tempo && options.tempo !== 'all') {
      results = results.filter(r => {
          const t = r.totalTime ?? 0;
          if (options.tempo === 'quick') return t <= 30;
          if (options.tempo === 'medium') return t > 30 && t <= 60;
          if (options.tempo === 'long') return t > 60;
          return true;
      });
  }

  return results;
}

export async function getRecipeBySlug(tenantId: string, slug: string): Promise<RecipeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapRecipeRowToRecord(data);
}

export async function getRecipeById(tenantId: string, id: string): Promise<RecipeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRecipeRowToRecord(data);
}

function mapRecipeRowToRecord(row: any): RecipeRecord {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    imageUrl: row.image_url,
    imageFileMeta: null,
    categorySlug: row.category_id || "",
    tags: row.tags_json || [],
    status: row.status as any,
    prepTime: row.prep_time_min || 0,
    cookTime: row.cook_time_min || 0,
    totalTime: row.total_time_min || 0,
    servings: row.servings || 1,
    difficulty: null,
    calories: row.kcal,
    videoUrl: row.video_id,
    accessTier: row.access_tier,
    priceBRL: row.price_brl ? Number(row.price_brl) : null,
    fullIngredients: row.ingredients_json || [],
    fullInstructions: row.instructions_text ? [row.instructions_text] : [],
    excerpt: row.excerpt,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    isFeatured: !!row.is_featured,
    ratingAvg: 0,
    ratingCount: 0,
    hasAccess: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    createdByUserId: row.author_id,
  };
}

export async function createRecipe(tenantId: string, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .insert({
      tenant_id: tenantId,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      image_url: recipe.imageUrl,
      category_id: recipe.categorySlug,
      tags_json: recipe.tags,
      status: recipe.status || 'draft',
      prep_time_min: recipe.prepTime,
      cook_time_min: recipe.cookTime,
      total_time_min: (recipe.prepTime || 0) + (recipe.cookTime || 0),
      servings: recipe.servings,
      kcal: recipe.calories,
      video_id: recipe.videoUrl,
      access_tier: recipe.accessTier,
      price_brl: recipe.priceBRL,
      ingredients_json: recipe.fullIngredients,
      instructions_text: Array.isArray(recipe.fullInstructions) ? recipe.fullInstructions.join('\n') : "",
      is_featured: recipe.isFeatured,
      excerpt: recipe.excerpt,
      seo_title: recipe.seoTitle,
      seo_description: recipe.seoDescription,
      author_id: recipe.createdByUserId,
      published_at: recipe.status === 'published' ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) throw error;
  return mapRecipeRowToRecord(data);
}

export async function updateRecipe(tenantId: string, recipeId: string, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (recipe.title !== undefined) payload.title = recipe.title;
  if (recipe.slug !== undefined) payload.slug = recipe.slug;
  if (recipe.description !== undefined) payload.description = recipe.description;
  if (recipe.imageUrl !== undefined) payload.image_url = recipe.imageUrl;
  if (recipe.status !== undefined) {
      payload.status = recipe.status;
      if (recipe.status === 'published') payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('recipes')
    .update(payload)
    .eq('tenant_id', tenantId)
    .eq('id', recipeId)
    .select()
    .single();

  if (error) throw error;
  return mapRecipeRowToRecord(data);
}

export async function deleteRecipe(tenantId: string, recipeId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('recipes')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', recipeId);

  if (error) throw error;
}

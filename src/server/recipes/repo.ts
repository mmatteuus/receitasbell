import { supabaseAdmin } from "../integrations/supabase/client.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import type { AccessTier, Recipe, RecipeStatus } from "../../types/recipe.js";
import { syncStripeProduct } from "../payments/providers/stripe/productSync.js";
import { getConnectAccountByTenantId } from "../payments/repo/accounts.js";

type RecipeRow = {
  id: string | number;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  categories?: { id: string; slug: string; name: string } | null;
  tags_json: string[] | null;
  status: RecipeStatus | null;
  prep_time_min: number | null;
  cook_time_min: number | null;
  total_time_min: number | null;
  servings: number | null;
  kcal: number | null;
  video_id: string | null;
  access_tier: AccessTier | null;
  price_brl: number | null;
  ingredients_json: unknown[] | null;
  instructions_text: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
};

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
    .select('*, categories(id, slug, name)')
    .eq('tenant_id', tenantId);

  if (!options.includeDrafts) {
    query = query.eq('status', 'published').eq('is_active', true);
  }

  const filterBySlug = options.categorySlug && options.categorySlug !== 'all'
    ? options.categorySlug
    : null;

  if (filterBySlug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filterBySlug);
    if (isUuid) {
      query = query.eq('category_id', filterBySlug);
    }
    // Se for slug textual, filtramos após o JOIN (ver abaixo)
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

  // Filtro por slug textual após o JOIN (quando não é UUID)
  if (filterBySlug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filterBySlug);
    if (!isUuid) {
      results = results.filter(r => r.categorySlug === filterBySlug);
    }
  }

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

export async function getRecipeBySlug(tenantId: string, slug: string, userId?: string): Promise<RecipeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select('*, categories(id, slug, name)')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  
  const record = mapRecipeRowToRecord(data);
  record.hasAccess = await checkAccess(tenantId, record, userId);
  
  return record;
}

export async function getRecipeById(tenantId: string, id: string, userId?: string): Promise<RecipeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select('*, categories(id, slug, name)')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  
  const record = mapRecipeRowToRecord(data);
  record.hasAccess = await checkAccess(tenantId, record, userId);
  
  return record;
}

async function checkAccess(tenantId: string, recipe: RecipeRecord, userId?: string): Promise<boolean> {
  // 1. Se for gratuita, todos têm acesso
  if (recipe.accessTier === "free") return true;

  // 2. Se não houver usuário logado e a receita for paga, não tem acesso
  if (!userId) return false;

  // 3. Se o usuário for o autor da receita, tem acesso
  if (recipe.createdByUserId === userId) return true;

  // 4. Verificar se existe uma compra confirmada
  const { data, error } = await supabaseAdmin
    .from('recipe_purchases')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('recipe_id', recipe.id)
    .maybeSingle();

  if (!error && data) return true;

  // 5. Verificar se o usuário é administrador do tenant (opcional, mas boa prática)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .eq('organization_id', tenantId)
    .maybeSingle();

  if (profile?.role === 'admin' || profile?.role === 'owner') return true;

  return false;
}

function mapRecipeRowToRecord(row: RecipeRow): RecipeRecord {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    imageUrl: row.image_url,
    imageFileMeta: null,
    categorySlug: row.categories?.slug || row.category_id || "",
    tags: row.tags_json || [],
    status: row.status || "draft",
    prepTime: row.prep_time_min || 0,
    cookTime: row.cook_time_min || 0,
    totalTime: row.total_time_min || 0,
    servings: row.servings || 1,
    difficulty: null,
    calories: row.kcal,
    videoUrl: row.video_id,
    accessTier: row.access_tier || "free",
    priceBRL: row.price_brl ? Number(row.price_brl) : null,
    fullIngredients: (row.ingredients_json as string[]) || [],
    fullInstructions: row.instructions_text ? [row.instructions_text] : [],
    excerpt: row.excerpt || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    isFeatured: !!row.is_featured,
    ratingAvg: 0,
    ratingCount: 0,
    hasAccess: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    createdByUserId: row.author_id,
    stripeProductId: row.stripe_product_id,
    stripePriceId: row.stripe_price_id,
  };
}

/**
 * Resolve o UUID da categoria a partir de slug ou UUID.
 * Se já for um UUID válido, retorna como está. Se for slug, busca no banco.
 */
async function resolveCategoryId(tenantId: string, slugOrId: string | null | undefined): Promise<string | null> {
  if (!slugOrId) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (isUuid) return slugOrId;

  const { data } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slugOrId)
    .maybeSingle();

  return data?.id ?? null;
}

export async function createRecipe(tenantId: string, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  const categoryId = await resolveCategoryId(tenantId, recipe.categorySlug);

  const { data, error } = await supabaseAdmin
    .from('recipes')
    .insert({
      tenant_id: tenantId,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      image_url: recipe.imageUrl,
      category_id: categoryId,
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
    .select('*, categories(id, slug, name)')
    .single();

  if (error) throw error;
  const createdRecord = mapRecipeRowToRecord(data);
  
  if (createdRecord.accessTier === "paid" && createdRecord.priceBRL) {
      const connectAccount = await getConnectAccountByTenantId(tenantId);
      if (connectAccount?.stripeAccountId) {
          try {
              const syncResult = await syncStripeProduct(tenantId, connectAccount.stripeAccountId, createdRecord);
              if (syncResult) {
                  const { error: updateError } = await supabaseAdmin
                      .from('recipes')
                      .update({ 
                          stripe_product_id: syncResult.productId,
                          stripe_price_id: syncResult.priceId
                      })
                      .eq('id', createdRecord.id);
                  if (updateError) console.error("[Stripe Sync] Failed to save Stripe IDs:", updateError);
                  createdRecord.stripeProductId = syncResult.productId;
                  createdRecord.stripePriceId = syncResult.priceId;
              }
          } catch (e) {
              console.error("[Stripe Sync] Error syncing recipe:", e);
          }
      }
  }

  return createdRecord;
}

export async function updateRecipe(tenantId: string, recipeId: string, recipe: Partial<RecipeRecord>): Promise<RecipeRecord> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (recipe.title !== undefined) payload.title = recipe.title;
  if (recipe.slug !== undefined) payload.slug = recipe.slug;
  if (recipe.description !== undefined) payload.description = recipe.description;
  if (recipe.imageUrl !== undefined) payload.image_url = recipe.imageUrl;
  if (recipe.categorySlug !== undefined) {
    payload.category_id = await resolveCategoryId(tenantId, recipe.categorySlug);
  }
  if (recipe.tags !== undefined) payload.tags_json = recipe.tags;
  if (recipe.prepTime !== undefined) payload.prep_time_min = recipe.prepTime;
  if (recipe.cookTime !== undefined) payload.cook_time_min = recipe.cookTime;
  if (recipe.prepTime !== undefined || recipe.cookTime !== undefined) {
    payload.total_time_min = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  }
  if (recipe.servings !== undefined) payload.servings = recipe.servings;
  if (recipe.calories !== undefined) payload.kcal = recipe.calories;
  if (recipe.videoUrl !== undefined) payload.video_id = recipe.videoUrl;
  if (recipe.accessTier !== undefined) payload.access_tier = recipe.accessTier;
  if (recipe.priceBRL !== undefined) payload.price_brl = recipe.priceBRL;
  if (recipe.fullIngredients !== undefined) payload.ingredients_json = recipe.fullIngredients;
  if (recipe.fullInstructions !== undefined) {
    payload.instructions_text = Array.isArray(recipe.fullInstructions) ? recipe.fullInstructions.join('\n') : "";
  }
  if (recipe.isFeatured !== undefined) payload.is_featured = recipe.isFeatured;
  if (recipe.excerpt !== undefined) payload.excerpt = recipe.excerpt;
  if (recipe.seoTitle !== undefined) payload.seo_title = recipe.seoTitle;
  if (recipe.seoDescription !== undefined) payload.seo_description = recipe.seoDescription;
  if (recipe.status !== undefined) {
    payload.status = recipe.status;
    if (recipe.status === 'published') payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('recipes')
    .update(payload)
    .eq('tenant_id', tenantId)
    .eq('id', recipeId)
    .select('*, categories(id, slug, name)')
    .single();

  if (error) throw error;
  const updatedRecord = mapRecipeRowToRecord(data);
  
  if (updatedRecord.accessTier === "paid" && updatedRecord.priceBRL) {
      const connectAccount = await getConnectAccountByTenantId(tenantId);
      if (connectAccount?.stripeAccountId) {
          try {
              const syncResult = await syncStripeProduct(tenantId, connectAccount.stripeAccountId, updatedRecord);
              if (syncResult) {
                  await supabaseAdmin
                      .from('recipes')
                      .update({ 
                          stripe_product_id: syncResult.productId,
                          stripe_price_id: syncResult.priceId
                      })
                      .eq('id', updatedRecord.id);
                  updatedRecord.stripeProductId = syncResult.productId;
                  updatedRecord.stripePriceId = syncResult.priceId;
              }
          } catch (e) {
              console.error("[Stripe Sync] Error syncing recipe update:", e);
          }
      }
  }

  return updatedRecord;
}

export async function deleteRecipe(tenantId: string, recipeId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('recipes')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', recipeId);

  if (error) throw error;
}

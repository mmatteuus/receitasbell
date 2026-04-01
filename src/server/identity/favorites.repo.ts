import { supabaseAdmin } from '../integrations/supabase/client.js';

export type FavoriteRow = {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
  tenant_id: string | number;
};

export type FavoriteRecord = {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

function mapFavoriteRow(row: FavoriteRow): FavoriteRecord {
  return {
    id: String(row.id ?? row.recipe_id ?? ''),
    recipeId: String(row.recipe_id ?? ''),
    userId: String(row.user_id ?? ''),
    createdAt: row.created_at ?? '',
    updatedAt: row.created_at ?? '',
  };
}

export async function listFavoritesByUserId(
  tenantId: string | number,
  userId: string
): Promise<FavoriteRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (error) throw new Error('Erro ao buscar favoritos');
  return (data || []).map(mapFavoriteRow);
}

export async function findFavoriteByRecipeId(
  tenantId: string | number,
  userId: string,
  recipeId: string
) {
  const { data } = await supabaseAdmin
    .from('favorites')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .limit(1);

  const row = data?.[0];
  return row ? mapFavoriteRow(row as unknown as FavoriteRow) : null;
}

export async function createFavorite(
  tenantId: string | number,
  userId: string,
  recipeId: string
): Promise<FavoriteRecord> {
  const existing = await findFavoriteByRecipeId(tenantId, userId, recipeId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from('favorites')
    .insert({
      user_id: userId,
      recipe_id: recipeId,
      tenant_id: String(tenantId),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error('Erro ao criar favorito');
  return mapFavoriteRow(data as unknown as FavoriteRow);
}

export async function deleteFavorite(
  tenantId: string | number,
  userId: string,
  recipeId: string
): Promise<void> {
  const { data } = await supabaseAdmin
    .from('favorites')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .limit(1);

  if (data?.[0]) {
    await supabaseAdmin.from('favorites').delete().eq('id', data[0].id);
  }
}

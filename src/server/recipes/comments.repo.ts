import { supabase } from "../integrations/supabase/client.js";

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  content: string;
  createdAt: string;
  tenantId: string;
}

export async function listCommentsByRecipeId(tenantId: string, recipeId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select(`
      id,
      recipe_id,
      user_id,
      content,
      created_at,
      tenant_id
    `)
    .eq('tenant_id', tenantId)
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    tenantId: row.tenant_id,
  }));
}

export async function createComment(tenantId: string, input: { recipeId: string, userId: string, content: string }): Promise<Comment> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .insert({
      tenant_id: tenantId,
      recipe_id: input.recipeId,
      user_id: input.userId,
      content: input.content,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    recipeId: data.recipe_id,
    userId: data.user_id,
    content: data.content,
    createdAt: data.created_at,
    tenantId: data.tenant_id,
  };
}

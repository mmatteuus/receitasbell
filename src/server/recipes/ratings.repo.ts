import { supabase } from "../integrations/supabase/client.js";

export async function upsertRating(
  tenantId: string,
  input: { recipeId: string; userId: string; value: number },
) {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .upsert({
      tenant_id: tenantId,
      recipe_id: input.recipeId,
      user_id: input.userId,
      rating: input.value,
    }, { onConflict: 'recipe_id, user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRecipeAverageRating(recipeId: string) {
  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', recipeId);

  if (error || !data || data.length === 0) return 0;
  
  const sum = data.reduce((acc, current) => acc + current.rating, 0);
  return sum / data.length;
}

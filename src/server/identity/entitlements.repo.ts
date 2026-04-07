import { supabaseAdmin } from "../integrations/supabase/client.js";

type EntitlementRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  recipe_id: string;
  payment_order_id: string | null;
  created_at: string;
};

export interface Entitlement {
  id: string;
  tenantId: string;
  userId: string;
  recipeId: string;
  paymentOrderId: string | null;
  createdAt: string;
}

export async function listEntitlementsByUserId(tenantId: string, userId: string): Promise<Entitlement[]> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (error) return [];
  return (data || []).map(mapRowToEntitlement);
}

export async function checkEntitlement(
  tenantId: string,
  userId: string,
  recipeId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function createEntitlement(tenantId: string, input: {
  userId: string;
  recipeId: string;
  paymentOrderId?: string | null;
}): Promise<Entitlement> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .insert({
      tenant_id: tenantId,
      user_id: input.userId,
      recipe_id: input.recipeId,
      payment_order_id: input.paymentOrderId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToEntitlement(data);
}

export async function revokeEntitlement(
  tenantId: string,
  userId: string,
  recipeId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("entitlements")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("recipe_id", recipeId);

  if (error) throw error;
}

function mapRowToEntitlement(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    tenantId: String(row.tenant_id),
    userId: String(row.user_id),
    recipeId: String(row.recipe_id),
    paymentOrderId: row.payment_order_id ? String(row.payment_order_id) : null,
    createdAt: row.created_at,
  };
}

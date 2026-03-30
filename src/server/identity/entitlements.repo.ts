import { supabase, supabaseAdmin } from "../integrations/supabase/client.js";

type EntitlementRow = {
  id: string;
  tenant_id: string;
  payment_id: string;
  payer_email: string;
  recipe_slug: string;
  access_status: string;
  created_at: string;
  updated_at: string;
};

export interface Entitlement {
  id: string;
  tenantId: string;
  paymentId: string;
  payerEmail: string;
  recipeSlug: string;
  accessStatus: string;
  createdAt: string;
  updatedAt: string;
}

export async function listEntitlementsByEmail(tenantId: string, email: string): Promise<Entitlement[]> {
  const { data, error } = await supabaseAdmin
    .from("recipe_purchases")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("payer_email", email.toLowerCase().trim());

  if (error) return [];
  return (data || []).map(mapRowToEntitlement);
}

export async function createEntitlement(tenantId: string, input: {
  paymentId: string;
  payerEmail: string;
  recipeSlug: string;
  accessStatus?: string;
}): Promise<Entitlement> {
  const { data, error } = await supabaseAdmin
    .from("recipe_purchases")
    .insert({
      tenant_id: tenantId,
      payment_id: String(input.paymentId),
      payer_email: input.payerEmail.toLowerCase().trim(),
      recipe_slug: input.recipeSlug,
      access_status: input.accessStatus || "active",
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToEntitlement(data);
}

export async function revokeEntitlement(tenantId: string, paymentId: string, recipeSlug?: string): Promise<void> {
  let query = supabaseAdmin
    .from("recipe_purchases")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("payment_id", String(paymentId));
  
  if (recipeSlug) {
    query = query.eq("recipe_slug", recipeSlug);
  }
  
  const { error } = await query;
  if (error) throw error;
}

function mapRowToEntitlement(row: any): Entitlement {
  return {
    id: row.id,
    tenantId: String(row.tenant_id),
    paymentId: String(row.payment_id),
    payerEmail: row.payer_email,
    recipeSlug: row.recipe_slug,
    accessStatus: row.access_status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

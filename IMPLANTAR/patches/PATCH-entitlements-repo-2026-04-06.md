# PATCH — `src/server/identity/entitlements.repo.ts`

Substituir o arquivo alvo pela implementação abaixo.

## Objetivo

- sair de `recipe_purchases`
- usar `entitlements`
- resolver `recipeSlug` via `recipes`
- manter o contrato legado do frontend (`payerEmail`, `recipeSlug`, `accessStatus`)

## Conteúdo sugerido

```ts
import { supabaseAdmin } from '../integrations/supabase/client.js';

type EntitlementRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  recipe_id: string;
  payment_order_id?: string | null;
  created_at: string;
};

type RecipeLookupRow = {
  id: string;
  slug: string;
};

type PaymentOrderLookupRow = {
  id: string;
  metadata?: Record<string, unknown> | null;
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

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() || '';
}

export async function listEntitlementsByEmail(tenantId: string, email: string): Promise<Entitlement[]> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return [];

  const { data, error } = await supabaseAdmin
    .from('entitlements')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', normalizedEmail)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];

  const recipeIds = [...new Set(data.map((row) => String(row.recipe_id)).filter(Boolean))];
  const paymentOrderIds = [
    ...new Set(data.map((row) => String(row.payment_order_id || '')).filter(Boolean)),
  ];

  const recipeSlugById = new Map<string, string>();
  if (recipeIds.length) {
    const { data: recipes } = await supabaseAdmin.from('recipes').select('id, slug').in('id', recipeIds);
    for (const recipe of (recipes || []) as RecipeLookupRow[]) {
      recipeSlugById.set(String(recipe.id), recipe.slug);
    }
  }

  const payerEmailByPaymentOrderId = new Map<string, string>();
  if (paymentOrderIds.length) {
    const { data: paymentOrders } = await supabaseAdmin
      .from('payment_orders')
      .select('id, metadata')
      .in('id', paymentOrderIds);

    for (const paymentOrder of (paymentOrders || []) as PaymentOrderLookupRow[]) {
      const metadata =
        paymentOrder.metadata && typeof paymentOrder.metadata === 'object' ? paymentOrder.metadata : null;
      const payerEmail = metadata && typeof metadata.payerEmail === 'string' ? metadata.payerEmail : normalizedEmail;
      payerEmailByPaymentOrderId.set(String(paymentOrder.id), payerEmail);
    }
  }

  return (data as EntitlementRow[]).map((row) => ({
    id: row.id,
    tenantId: String(row.tenant_id),
    paymentId: String(row.payment_order_id || ''),
    payerEmail: payerEmailByPaymentOrderId.get(String(row.payment_order_id || '')) || normalizedEmail,
    recipeSlug: recipeSlugById.get(String(row.recipe_id)) || String(row.recipe_id),
    accessStatus: 'active',
    createdAt: row.created_at,
    updatedAt: row.created_at,
  }));
}

export async function createEntitlement(
  tenantId: string,
  input: {
    paymentId: string;
    payerEmail: string;
    recipeSlug: string;
    accessStatus?: string;
  }
): Promise<Entitlement> {
  const normalizedEmail = normalizeEmail(input.payerEmail);

  const { data: recipe, error: recipeError } = await supabaseAdmin
    .from('recipes')
    .select('id, slug')
    .eq('tenant_id', tenantId)
    .eq('slug', input.recipeSlug)
    .maybeSingle();

  if (recipeError || !recipe) throw recipeError || new Error('Recipe not found for entitlement');

  const { data: existing } = await supabaseAdmin
    .from('entitlements')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('payment_order_id', String(input.paymentId))
    .eq('user_id', normalizedEmail)
    .eq('recipe_id', String(recipe.id))
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      tenantId,
      paymentId: String(existing.payment_order_id || ''),
      payerEmail: normalizedEmail,
      recipeSlug: recipe.slug,
      accessStatus: 'active',
      createdAt: existing.created_at,
      updatedAt: existing.created_at,
    };
  }

  const { data, error } = await supabaseAdmin
    .from('entitlements')
    .insert({
      tenant_id: tenantId,
      user_id: normalizedEmail,
      recipe_id: String(recipe.id),
      payment_order_id: String(input.paymentId),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tenantId,
    paymentId: String(data.payment_order_id || ''),
    payerEmail: normalizedEmail,
    recipeSlug: recipe.slug,
    accessStatus: 'active',
    createdAt: data.created_at,
    updatedAt: data.created_at,
  };
}

export async function revokeEntitlement(
  tenantId: string,
  paymentId: string,
  recipeSlug?: string
): Promise<void> {
  let recipeId: string | null = null;

  if (recipeSlug) {
    const { data: recipe } = await supabaseAdmin
      .from('recipes')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', recipeSlug)
      .maybeSingle();

    recipeId = recipe?.id ? String(recipe.id) : null;
  }

  let query = supabaseAdmin
    .from('entitlements')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('payment_order_id', String(paymentId));

  if (recipeId) {
    query = query.eq('recipe_id', recipeId);
  }

  const { error } = await query;
  if (error) throw error;
}
```

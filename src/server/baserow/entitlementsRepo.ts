import { fetchBaserow, BASEROW_TABLES } from "./client.js";

export interface Entitlement {
  id: string | number;
  userId: string | number;
  recipeId: string | number;
  recipeSlug: string;
  paymentId: string | number;
  createdAt: string;
}

export async function listEntitlementsByEmail(tenantId: string | number, email: string): Promise<Entitlement[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/?user_field_names=true&filter__payerEmail__equal=${email}&filter__tenantId__equal=${tenantId}`
  );
  
  return data.results.map(row => ({
    id: row.id,
    userId: row.userId,
    recipeId: row.recipeId,
    recipeSlug: row.recipeSlug,
    paymentId: row.paymentId,
    createdAt: row.created_at,
  }));
}

export async function createEntitlement(tenantId: string | number, input: {
  userId: string | number;
  recipeId?: string | number;
  recipeSlug: string;
  paymentId: string | number;
}): Promise<Entitlement> {
  const row = await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        tenantId: String(tenantId),
        created_at: new Date().toISOString(),
      }),
    }
  );
  
  return {
    id: row.id,
    userId: row.userId,
    recipeId: row.recipeId,
    recipeSlug: row.recipeSlug,
    paymentId: row.paymentId,
    createdAt: row.created_at,
  };
}

export async function revokeEntitlement(paymentId: string | number): Promise<void> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/?user_field_names=true&filter__paymentId__equal=${paymentId}`
  );
  
  for (const row of data.results) {
    await fetchBaserow(
      `/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/${row.id}/`,
      { method: "DELETE" }
    );
  }
}

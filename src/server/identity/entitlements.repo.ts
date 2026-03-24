import { fetchBaserow, BASEROW_TABLES } from "../integrations/baserow/client.js";

export interface Entitlement {
  id: string | number;
  tenantId: string | number;
  paymentId: string | number;
  payerEmail: string;
  recipeSlug: string;
  accessStatus: string;
  createdAt: string;
  updatedAt: string;
}

export async function listEntitlementsByEmail(tenantId: string | number, email: string): Promise<Entitlement[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/?user_field_names=true&filter__payerEmail__equal=${encodeURIComponent(email)}&filter__tenantId__equal=${tenantId}`
  );
  return data.results.map(row => mapRowToEntitlement(row));
}

export async function createEntitlement(tenantId: string | number, input: {
  paymentId: string | number;
  payerEmail: string;
  recipeSlug: string;
  accessStatus?: string;
}): Promise<Entitlement> {
  const now = new Date().toISOString();
  const row = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        tenantId: String(tenantId),
        paymentId: String(input.paymentId),
        payerEmail: input.payerEmail,
        recipeSlug: input.recipeSlug,
        accessStatus: input.accessStatus || "active",
        created_at: now,
        updated_at: now,
      }),
  });
  return mapRowToEntitlement(row);
}

export async function revokeEntitlement(tenantId: string | number, paymentId: string | number, recipeSlug?: string): Promise<void> {
  let url = `/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__paymentId__equal=${paymentId}`;
  if (recipeSlug) url += `&filter__recipeSlug__equal=${recipeSlug}`;
  
  const data = await fetchBaserow<{ results: any[] }>(url);
  for (const row of data.results) {
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.ENTITLEMENTS}/${row.id}/`, { method: "DELETE" });
  }
}

function mapRowToEntitlement(row: any): Entitlement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    paymentId: row.paymentId,
    payerEmail: row.payerEmail,
    recipeSlug: row.recipeSlug,
    accessStatus: row.accessStatus || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

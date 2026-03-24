import { baserowFetch } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";

export type PaymentStatus = 'created' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'chargeback' | 'failed';

export interface PaymentRecord {
  id: string | number;
  tenantId: string;
  userId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  externalReference: string;
  mpPaymentId: string;
  preferenceId: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  provider: string;
  recipeIds: string[];
  items: any[];
  createdAt: string;
  updatedAt: string;
}

export async function createPaymentOrder(tenantId: string, input: {
  userId?: string | null;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  externalReference: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  provider?: string;
  recipeIds: string[];
  items: any[];
}): Promise<PaymentRecord> {
  const now = new Date().toISOString();
  const record = await baserowFetch<any>(`/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenant_id: tenantId,
      user_id: input.userId || "",
      amount: input.amount,
      currency: input.currency || 'BRL',
      status: input.status,
      external_reference: input.externalReference,
      idempotency_key: input.idempotencyKey,
      payer_email: input.payerEmail,
      payment_method: input.paymentMethod,
      provider: input.provider || 'mercadopago',
      recipe_ids_json: JSON.stringify(input.recipeIds),
      items_json: JSON.stringify(input.items),
      created_at: now,
      updated_at: now,
    }),
  });
  return mapRowToPayment(record);
}

export async function getPaymentOrderById(tenantId: string | number, id: string | number): Promise<PaymentRecord | null> {
  try {
    const row = await baserowFetch<any>(`/api/database/rows/table/${baserowTables.paymentOrders}/${id}/?user_field_names=true`);
    if (String(row.tenant_id) !== String(tenantId)) return null;
    return mapRowToPayment(row);
  } catch (err) {
    return null;
  }
}

export async function getPaymentOrderByExternalReference(tenantId: string, externalReference: string): Promise<PaymentRecord | null> {
  const data = await baserowFetch<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__tenant_id__equal=${encodeURIComponent(tenantId)}&filter__external_reference__equal=${encodeURIComponent(externalReference)}`
  );
  const row = data.results[0];
  return row ? mapRowToPayment(row) : null;
}

export async function updatePaymentOrderStatus(tenantId: string, id: string | number, status: string, mpPaymentId?: string): Promise<void> {
  const payload: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (mpPaymentId) payload.mp_payment_id = mpPaymentId;

  await baserowFetch(`/api/database/rows/table/${baserowTables.paymentOrders}/${id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

function mapRowToPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    tenantId: String(row.tenant_id),
    userId: row.user_id || null,
    amount: Number(row.amount || 0),
    currency: row.currency || 'BRL',
    status: row.status as PaymentStatus,
    externalReference: row.external_reference,
    mpPaymentId: row.mp_payment_id || "",
    preferenceId: row.preference_id || "",
    idempotencyKey: row.idempotency_key,
    payerEmail: row.payer_email || "",
    paymentMethod: row.payment_method,
    provider: row.provider || 'mercadopago',
    recipeIds: JSON.parse(row.recipe_ids_json || "[]"),
    items: JSON.parse(row.items_json || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

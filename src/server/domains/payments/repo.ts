import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";

export interface PaymentRecord {
  id: string | number;
  tenantId: string | number;
  userId?: string | number | null;
  amount: number;
  status: string;
  externalReference: string;
  paymentId: string;
  preferenceId: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  recipeIds: string[];
  items: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEventRecord {
  id: string | number;
  tenantId: string | number;
  paymentId?: string | number | null;
  resourceId?: string | null;
  topic?: string | null;
  action?: string | null;
  dedupeKey: string;
  signatureValid: boolean;
  payloadJson: any;
  processedAt?: string | null;
  createdAt: string;
}

export async function listPayments(tenantId: string | number): Promise<PaymentRecord[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true&filter__tenantId__equal=${tenantId}`
  );
  return data.results.map(record => mapPaymentRowToRecord(record));
}

export async function getPaymentById(tenantId: string | number, paymentId: string | number): Promise<PaymentRecord | null> {
  try {
    const payment = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/${paymentId}/?user_field_names=true`);
    if (String(payment.tenantId) !== String(tenantId)) return null;
    return mapPaymentRowToRecord(payment);
  } catch (err) { return null; }
}

export async function createPayment(tenantId: string | number, input: {
  userId?: string | number | null;
  amount: number;
  status: string;
  externalReference: string;
  paymentId?: string;
  preferenceId?: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  recipeIds: string[];
  items: any[];
}): Promise<PaymentRecord> {
  const now = new Date().toISOString();
  const record = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        status: input.status,
        external_reference: input.externalReference,
        payment_id: input.paymentId || "",
        preference_id: input.preferenceId || "",
        idempotency_key: input.idempotencyKey,
        payer_email: input.payerEmail,
        payment_method: input.paymentMethod,
        recipe_ids_json: JSON.stringify(input.recipeIds),
        items_json: JSON.stringify(input.items),
        tenantId: String(tenantId),
        userId: input.userId ? String(input.userId) : null,
        created_at: now,
        updated_at: now,
      }),
  });
  return mapPaymentRowToRecord(record);
}

export async function updatePaymentStatus(tenantId: string | number, paymentId: string | number, status: string, providerPaymentId?: string): Promise<void> {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (providerPaymentId) payload.payment_id = providerPaymentId;
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/${paymentId}/?user_field_names=true`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function createPaymentEvent(tenantId: string | number, input: Partial<PaymentEventRecord>) {
  const now = new Date().toISOString();
  const record = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.PAYMENT_EVENTS}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({ ...input, tenantId: String(tenantId), created_at: now }),
  });
  return record;
}

function mapPaymentRowToRecord(row: any): PaymentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    amount: Number(row.amount || 0),
    status: row.status,
    externalReference: row.external_reference,
    paymentId: row.payment_id,
    preferenceId: row.preference_id,
    idempotencyKey: row.idempotency_key,
    payerEmail: row.payer_email || "",
    paymentMethod: row.payment_method,
    recipeIds: JSON.parse(row.recipe_ids_json || "[]"),
    items: JSON.parse(row.items_json || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

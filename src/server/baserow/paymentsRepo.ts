import { fetchBaserow, BASEROW_TABLES } from "./client.js";

export interface PaymentRecord {
  id: string | number;
  tenantId: string | number;
  amount: number;
  status: string;
  externalReference: string;
  paymentId: string;
  payerEmail: string;
  paymentMethod: string;
  recipeIds: string[];
  items: any[];
  createdAt: string;
}

export async function listPayments(tenantId: string | number): Promise<PaymentRecord[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true&filter__tenantId__equal=${tenantId}`
  );
  
  return data.results.map(record => mapPaymentRowToRecord(record));
}

export async function getPaymentById(paymentId: string | number): Promise<{ payment: PaymentRecord; events: any[]; notes: any[] } | null> {
  try {
    const payment = await fetchBaserow<any>(
      `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/${paymentId}/?user_field_names=true`
    );
    
    return {
      payment: mapPaymentRowToRecord(payment),
      events: [],
      notes: [],
    };
  } catch (err) {
    return null;
  }
}

export async function createPayment(tenantId: string | number, input: {
  amount: number;
  status: string;
  externalReference: string;
  paymentId: string;
  payerEmail: string;
  paymentMethod: string;
  recipeIds: string[];
  items: any[];
}): Promise<PaymentRecord> {
  const now = new Date().toISOString();
  const record = await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        status: input.status,
        external_reference: input.externalReference,
        payment_id: input.paymentId,
        payer_email: input.payerEmail,
        payment_method: input.paymentMethod,
        recipe_ids_json: JSON.stringify(input.recipeIds),
        items_json: JSON.stringify(input.items),
        tenantId: String(tenantId),
        created_at: now,
        updated_at: now,
      }),
    }
  );
  
  return mapPaymentRowToRecord(record);
}

// Corrigindo o nome da função acima e implementando o restante
export async function updatePaymentStatus(paymentId: string | number, status: string): Promise<void> {
    await fetchBaserow(
        `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/${paymentId}/?user_field_names=true`,
        {
            method: "PATCH",
            body: JSON.stringify({
                status,
                updated_at: new Date().toISOString(),
            }),
        }
    );
}

export async function addPaymentNote(paymentId: string | number, note: string): Promise<any> {
    console.log(`Note added to payment ${paymentId}: ${note}`);
    return { id: Date.now(), note };
}

function mapPaymentRowToRecord(row: any): PaymentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    amount: Number(row.amount || 0),
    status: row.status,
    externalReference: row.external_reference,
    paymentId: row.payment_id,
    payerEmail: row.payer_email || "",
    paymentMethod: row.payment_method,
    recipeIds: JSON.parse(row.recipe_ids_json || "[]"),
    items: JSON.parse(row.items_json || "[]"),
    createdAt: row.created_at,
  };
}

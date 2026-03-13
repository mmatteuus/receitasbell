import type { Payment, PaymentEvent, PaymentNote, PaymentStatus } from "../../lib/payments/types.js";
import { ApiError } from "../http.js";
import { readTable, mutateTable } from "./table.js";
import { ensureRecipeUnlock } from "./recipeUnlocksRepo.js";
import { getRecipeById } from "./recipesRepo.js";
import { SheetRecord } from "./schema.js";
import { nowIso, asJson, asNumber, asNullableString, toJsonString } from "./utils.js";

interface ListPaymentsFilters {
  status?: PaymentStatus[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
}

function mapPayment(row: SheetRecord<"payments">): Payment {
  return {
    id: row.id,
    external_payment_id: asNullableString(row.external_payment_id),
    provider: row.provider || "mock",
    recipe_id: asNullableString(row.recipe_id),
    user_id: asNullableString(row.user_id),
    buyer_email: row.buyer_email,
    payer: {
      email: row.buyer_email,
    },
    status: row.status as PaymentStatus,
    status_detail: row.status_detail,
    payment_method_id: (row.payment_method_id || "pix") as Payment["payment_method_id"],
    payment_type_id: (row.payment_type_id || "account_money") as Payment["payment_type_id"],
    transaction_amount: asNumber(row.transaction_amount),
    currency_id: "BRL",
    date_created: row.date_created,
    date_approved: asNullableString(row.date_approved),
    external_reference: row.external_reference,
    checkout_reference: asNullableString(row.checkout_reference),
    webhook_received_at: asNullableString(row.webhook_received_at),
    idempotency_key: asNullableString(row.idempotency_key),
    raw_json: asJson<Record<string, unknown> | null>(row.raw_json, null),
    refunds: [],
    chargebacks: [],
  };
}

function mapEvent(row: SheetRecord<"payment_events">): PaymentEvent {
  return {
    id: row.id,
    paymentId: row.payment_id,
    type: row.type,
    date_created: row.date_created,
    payload_json: asJson<Record<string, unknown> | null>(row.payload_json, null),
  };
}

function mapNote(row: SheetRecord<"payment_notes">): PaymentNote {
  return {
    id: row.id,
    payment_id: row.payment_id,
    note: row.note,
    created_by_user_id: asNullableString(row.created_by_user_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listPayments(filters: ListPaymentsFilters = {}) {
  const rows = await readTable("payments");

  return rows
    .map(mapPayment)
    .filter((payment) => {
      if (filters.status?.length && !filters.status.includes(payment.status)) return false;
      if (filters.paymentMethod?.length && !filters.paymentMethod.includes(payment.payment_method_id)) return false;
      if (filters.email && !payment.buyer_email.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.paymentId && !payment.id.toLowerCase().includes(filters.paymentId.toLowerCase())) return false;
      if (
        filters.externalReference &&
        !payment.external_reference.toLowerCase().includes(filters.externalReference.toLowerCase())
      ) {
        return false;
      }
      if (filters.dateFrom && new Date(payment.date_created) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(payment.date_created) > new Date(filters.dateTo)) return false;

      return true;
    })
    .sort((left, right) => right.date_created.localeCompare(left.date_created));
}

export async function getPaymentById(paymentId: string) {
  const [paymentRows, eventRows, noteRows] = await Promise.all([
    readTable("payments"),
    readTable("payment_events"),
    readTable("payment_notes"),
  ]);

  const paymentRow = paymentRows.find((row) => row.id === paymentId);
  if (!paymentRow) return null;

  return {
    payment: mapPayment(paymentRow),
    events: eventRows.filter((row) => row.payment_id === paymentId).map(mapEvent),
    notes: noteRows
      .filter((row) => row.payment_id === paymentId)
      .map(mapNote)
      .sort((left, right) => right.created_at.localeCompare(left.created_at)),
  };
}

export async function addPaymentNote(paymentId: string, note: string, createdByUserId?: string | null) {
  const trimmed = note.trim();
  if (!trimmed) {
    throw new ApiError(400, "Payment note is required");
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  const rows = await mutateTable("payment_notes", async (current) => [
    ...current,
    {
      id,
      payment_id: paymentId,
      note: trimmed,
      created_by_user_id: createdByUserId ?? "",
      created_at: now,
      updated_at: now,
    },
  ]);

  return mapNote(rows.find((row) => row.id === id)!);
}

async function addPaymentEvents(paymentId: string, eventTypes: string[], payload: Record<string, unknown>) {
  const createdAt = nowIso();
  await mutateTable("payment_events", async (current) => [
    ...current,
    ...eventTypes.map((type) => ({
      id: crypto.randomUUID(),
      payment_id: paymentId,
      type,
      date_created: createdAt,
      payload_json: toJsonString(payload),
    })),
  ]);
}

async function createMockPayment(input: {
  recipeId: string;
  recipeSlug: string;
  buyerEmail: string;
  userId?: string | null;
  checkoutReference: string;
  amount: number;
}) {
  const paymentId = crypto.randomUUID();
  const now = nowIso();
  const idempotencyKey = `${input.checkoutReference}:${input.recipeId}`;

  const rows = await mutateTable("payments", async (current) => {
    const existing = current.find((row) => row.idempotency_key === idempotencyKey);
    if (existing) {
      return current;
    }

    return [
      ...current,
      {
        id: paymentId,
        external_payment_id: "",
        provider: "mock",
        recipe_id: input.recipeId,
        user_id: input.userId ?? "",
        buyer_email: input.buyerEmail,
        status: "approved",
        status_detail: "accredited",
        payment_method_id: "pix",
        payment_type_id: "account_money",
        transaction_amount: String(input.amount),
        currency_id: "BRL",
        date_created: now,
        date_approved: now,
        raw_json: toJsonString({
          provider: "mock",
          checkoutReference: input.checkoutReference,
          recipeId: input.recipeId,
        }),
        external_reference: input.recipeSlug,
        checkout_reference: input.checkoutReference,
        webhook_received_at: "",
        idempotency_key: idempotencyKey,
      },
    ];
  });

  const created = rows.find((row) => row.idempotency_key === idempotencyKey)!;
  await addPaymentEvents(created.id, ["payment.created", "payment.approved"], {
    provider: "mock",
    recipeId: input.recipeId,
    buyerEmail: input.buyerEmail,
  });

  return mapPayment(created);
}

export async function createMockCheckout(input: {
  recipeIds: string[];
  buyerEmail: string;
  userId?: string | null;
  checkoutReference: string;
}) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  if (!buyerEmail) {
    throw new ApiError(400, "Buyer email is required");
  }

  if (!input.recipeIds.length) {
    throw new ApiError(400, "At least one recipe is required for checkout");
  }

  const payments: Payment[] = [];

  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(recipeId, { includeDrafts: true });
    if (!recipe) {
      throw new ApiError(404, `Recipe not found for checkout: ${recipeId}`);
    }

    if (recipe.accessTier !== "paid" || !recipe.priceBRL) {
      throw new ApiError(400, `Recipe ${recipe.title} is not eligible for paid checkout`);
    }

    const payment = await createMockPayment({
      recipeId: recipe.id,
      recipeSlug: recipe.slug,
      buyerEmail,
      userId: input.userId,
      checkoutReference: input.checkoutReference,
      amount: recipe.priceBRL,
    });

    await ensureRecipeUnlock({
      recipeId: recipe.id,
      paymentId: payment.id,
      userId: input.userId,
      buyerEmail,
    });

    payments.push(payment);
  }

  return {
    payments,
    paymentIds: payments.map((payment) => payment.id),
    primaryPaymentId: payments[0]?.id ?? null,
    unlockedCount: payments.length,
  };
}

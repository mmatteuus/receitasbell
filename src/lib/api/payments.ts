import type { AdminPaymentsFilters, CreatePaymentPreferenceResult, Payment, PaymentNote } from "@/lib/payments/types";
import type { RecipeRecord } from "@/lib/recipes/types";
import type { Entitlement } from "@/types/entitlement";
import { buildQuery, jsonFetch } from "./client";

export interface PaymentDetailResponse {
  payment: Payment;
  events: Array<{
    id: string;
    paymentId: string;
    type: string;
    date_created: string;
    payload_json?: Record<string, unknown> | null;
  }>;
  notes: PaymentNote[];
  recipes?: RecipeRecord[];
  entitlements?: Entitlement[];
}

export async function listPayments(filters: AdminPaymentsFilters = {}) {
  const query = buildQuery({
    status: filters.status,
    method: filters.paymentMethod,
    email: filters.email,
    paymentId: filters.paymentId || filters.paymentIdGateway,
    paymentIdGateway: filters.paymentIdGateway,
    externalReference: filters.externalReference,
    dateFrom: filters.dateFrom || filters.from,
    dateTo: filters.dateTo || filters.to,
    from: filters.from,
    to: filters.to,
  });
  const result = await jsonFetch<{ payments: Payment[] }>(`/api/admin/payments${query}`, {
    admin: true,
  });
  return result.payments;
}

export async function getPayment(id: string) {
  return jsonFetch<PaymentDetailResponse>(`/api/admin/payments/${encodeURIComponent(id)}`, {
    admin: true,
  });
}

export async function addPaymentNote(paymentId: string, note: string) {
  const result = await jsonFetch<{ note: PaymentNote }>(
    `/api/admin/payments/${encodeURIComponent(paymentId)}/note`,
    {
      method: "POST",
      admin: true,
      body: { note },
    },
  );
  return result.note;
}

export async function createMercadoPagoPreference(input: {
  recipeIds: string[];
  items?: Array<{
    recipeId: string;
    title: string;
    slug: string;
    priceBRL: number;
    imageUrl: string;
  }>;
  payerName?: string;
  payerEmail: string;
  checkoutReference: string;
}) {
  return jsonFetch<CreatePaymentPreferenceResult>(
    "/api/payments/mercadopago/create-preference",
    {
      method: "POST",
      body: input,
    },
  );
}

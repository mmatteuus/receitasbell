import type { Payment, PaymentNote } from "@/lib/payments/types";
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
}

export async function listPayments(filters: {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  external_reference?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const query = buildQuery({
    status: filters.status,
    method: filters.paymentMethod,
    email: filters.email,
    paymentId: filters.paymentId,
    external_reference: filters.external_reference,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  const result = await jsonFetch<{ payments: Payment[] }>(`/api/payments${query}`, { admin: true });
  return result.payments;
}

export async function getPayment(id: string) {
  return jsonFetch<PaymentDetailResponse>(`/api/payments/${encodeURIComponent(id)}`, { admin: true });
}

export async function addPaymentNote(paymentId: string, note: string) {
  const result = await jsonFetch<{ note: PaymentNote }>(`/api/payments/${encodeURIComponent(paymentId)}/note`, {
    method: "POST",
    admin: true,
    body: { note },
  });
  return result.note;
}


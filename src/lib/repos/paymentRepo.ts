import type { CreatePaymentPreferenceInput } from "@/types/payment";
import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";
import { createPreference, type CheckoutSessionInput } from "@/lib/services/mercadoPagoService";
import type { Payment } from "@/lib/payments/types";

export type ListPaymentsFilters = {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  dateFrom?: string;
  dateTo?: string;
  externalReference?: string;
};

export async function listAdminPayments(filters: ListPaymentsFilters = {}) {
  return listPayments(filters);
}

export async function getAdminPaymentById(id: string) {
  return getPayment(id);
}

export async function createPaymentPreference(
  input: CheckoutSessionInput | CreatePaymentPreferenceInput,
) {
  return createPreference({
    ...input,
    recipeIds: input.recipeIds || input.items?.map((item) => item.recipeId) || [],
  });
}

export async function getByPaymentIdGateway(paymentIdGateway: string) {
  const details = await getPayment(paymentIdGateway);
  return details.payment;
}

export async function create(payment: Payment) {
  return payment;
}

export async function updateStatus(paymentIdGateway: string, patch: Partial<Payment>) {
  const current = await getByPaymentIdGateway(paymentIdGateway);
  return current ? { ...current, ...patch } : null;
}

export const paymentRepo = {
  list: listAdminPayments,
  listAdmin: listAdminPayments,
  getById: getAdminPaymentById,
  getByPaymentIdGateway,
  getAdminById: getAdminPaymentById,
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
  createCheckout: createPaymentPreference,
  createPreference: createPaymentPreference,
  create,
  updateStatus,
};

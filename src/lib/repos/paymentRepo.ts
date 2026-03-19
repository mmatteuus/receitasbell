import type { AdminPaymentsFilters, CreatePaymentPreferenceInput } from "@/types/payment";
import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";
import { createCheckoutSession, type CheckoutSessionInput } from "@/lib/services/mercadoPagoService";

export type ListPaymentsFilters = AdminPaymentsFilters;

export async function listAdminPayments(filters: ListPaymentsFilters = {}) {
  return listPayments(filters);
}

export async function getAdminPaymentById(id: string) {
  return getPayment(id);
}

export async function createPaymentPreference(
  input: CheckoutSessionInput | CreatePaymentPreferenceInput,
) {
  return createCheckoutSession({
    ...input,
    recipeIds: input.recipeIds || input.items?.map((item) => item.recipeId) || [],
  });
}

export const paymentRepo = {
  list: listAdminPayments,
  listAdmin: listAdminPayments,
  getById: getAdminPaymentById,
  getAdminById: getAdminPaymentById,
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
  createCheckout: createPaymentPreference,
  createPreference: createPaymentPreference,
};

import type { AdminPaymentsFilters, CreatePaymentPreferenceInput } from "@/types/payment";
import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";
import { createCheckout } from "@/lib/api/interactions";

export type ListPaymentsFilters = AdminPaymentsFilters;

export async function list(filters: ListPaymentsFilters = {}) {
  return listPayments(filters);
}

export async function getById(id: string) {
  return getPayment(id);
}

export async function createCheckoutPreference(
  input: CreatePaymentPreferenceInput,
) {
  const checkoutItems = input.items?.map((item) => ({
    ...item,
    quantity: 1,
  }));

  return createCheckout({
    recipeIds: input.recipeIds?.length ? input.recipeIds : input.items?.map((item) => item.recipeId) || [],
    items: checkoutItems,
    payerName: input.payerName,
    buyerEmail: input.payerEmail,
    checkoutReference: input.checkoutReference,
  });
}

export const paymentRepo = {
  list,
  getById,
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
  createCheckout: createCheckoutPreference,
};

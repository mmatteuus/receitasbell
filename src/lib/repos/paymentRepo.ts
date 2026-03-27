import type { CreatePaymentPreferenceInput } from "@/types/payment";
import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";
import { createCheckout } from "@/lib/api/interactions";

export type ListPaymentsFilters = {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  paymentIdGateway?: string;
  dateFrom?: string;
  dateTo?: string;
  from?: string;
  to?: string;
  externalReference?: string;
};

export async function list(filters: ListPaymentsFilters = {}) {
  return listPayments(filters);
}

export async function getById(id: string) {
  return getPayment(id);
}

export async function createCheckoutPreference(
  input: CreatePaymentPreferenceInput,
) {
  return createCheckout({
    ...input,
    recipeIds: input.recipeIds?.length ? input.recipeIds : input.items?.map((item) => item.recipeId) || [],
  });
}

export const paymentRepo = {
  list,
  getById,
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
  createCheckout: createCheckoutPreference,
};

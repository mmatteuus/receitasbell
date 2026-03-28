import type {
  AdminPaymentsFilters,
  CheckoutPaymentConfig,
  CreateCardPaymentInput,
  CreatePaymentPreferenceInput,
  CreatePixPaymentInput,
  DirectPaymentResult,
} from "@/types/payment";
import {
  addPaymentNote,
  createCardPayment,
  createPixPayment,
  getCheckoutPaymentConfig,
  getPayment,
  getPaymentStatus,
  listPayments,
} from "@/lib/api/payments";
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

export async function getCheckoutConfig(): Promise<CheckoutPaymentConfig> {
  return getCheckoutPaymentConfig();
}

export async function createPix(input: CreatePixPaymentInput): Promise<DirectPaymentResult> {
  return createPixPayment(input);
}

export async function createCard(input: CreateCardPaymentInput): Promise<DirectPaymentResult> {
  return createCardPayment(input);
}

export async function getStatus(id: string): Promise<DirectPaymentResult> {
  return getPaymentStatus(id);
}

export const paymentRepo = {
  list,
  getById,
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
  createCheckout: createCheckoutPreference,
  getCheckoutConfig,
  createPix,
  createCard,
  getStatus,
};

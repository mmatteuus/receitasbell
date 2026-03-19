import type { CreatePaymentPreferenceInput } from "@/types/payment";
import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";
import { createPreference, type CheckoutSessionInput } from "@/lib/services/mercadoPagoService";
import type { Payment } from "@/lib/payments/types";

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

export async function listAdminPayments(filters: ListPaymentsFilters = {}) {
  return list(filters);
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
  const payments = await listPayments({
    paymentId: paymentIdGateway,
  });
  return payments.find((payment) => payment.paymentIdGateway === paymentIdGateway) ?? null;
}

export async function create(payment: Payment) {
  // A criação efetiva acontece no checkout/webhook no backend.
  // Este método mantém o contrato do repo para usos internos do front.
  return payment;
}

export async function updateStatus(paymentIdGateway: string, patch: Partial<Payment>) {
  const current = await getByPaymentIdGateway(paymentIdGateway);
  if (!current) {
    return null;
  }

  return {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export const paymentRepo = {
  list,
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

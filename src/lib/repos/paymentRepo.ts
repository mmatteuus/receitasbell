import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";
import { createCheckoutSession, type CheckoutSessionInput } from "@/lib/services/mercadoPagoService";

interface ListPaymentsFilters {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentRepo = {
  list: (filters: ListPaymentsFilters = {}) =>
    listPayments({
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      email: filters.email,
      paymentId: filters.paymentId,
      external_reference: filters.externalReference,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }),
  getById: (id: string) => getPayment(id),
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
  createCheckout: (input: CheckoutSessionInput) => createCheckoutSession(input),
};

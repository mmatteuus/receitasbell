import { addPaymentNote, getPayment, listPayments } from "@/lib/api/payments";

interface ListPaymentsFilters {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentsRepo = {
  listPayments: (filters: ListPaymentsFilters = {}) =>
    listPayments({
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      email: filters.email,
      paymentId: filters.paymentId,
      external_reference: filters.externalReference,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }),
  getPayment: (id: string) => getPayment(id),
  addNote: (paymentId: string, note: string) => addPaymentNote(paymentId, note),
};

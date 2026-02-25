
import { mockPayments } from './seed';
import { Payment, PaymentEvent, PaymentStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

const PAYMENTS_KEY = 'bell_payments';
const EVENTS_KEY_PREFIX = 'bell_payment_events_';
const NOTES_KEY_PREFIX = 'bell_payment_notes_';

// --- Initialization ---
const initializeData = () => {
  if (!localStorage.getItem(PAYMENTS_KEY)) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(mockPayments));
  }
};

initializeData();

// --- Main Repository Functions ---

interface ListPaymentsFilters {
  status?: PaymentStatus[];
  email?: string;
  paymentId?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const paymentsRepo = {
  listPayments: (filters: ListPaymentsFilters = {}): Payment[] => {
    let payments: Payment[] = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');

    if (filters.status && filters.status.length > 0) {
      payments = payments.filter(p => filters.status!.includes(p.status));
    }

    if (filters.email) {
      const query = filters.email.toLowerCase();
      payments = payments.filter(p => p.payer.email.toLowerCase().includes(query));
    }
      
    if (filters.paymentId) {
        const query = filters.paymentId.toLowerCase();
        payments = payments.filter(p => String(p.id).includes(query));
    }
      
    if (filters.externalReference) {
        const query = filters.externalReference.toLowerCase();
        payments = payments.filter(p => p.external_reference.toLowerCase().includes(query));
    }

    if (filters.dateFrom) {
        payments = payments.filter(p => new Date(p.date_created) >= new Date(filters.dateFrom!));
    }
      
    if (filters.dateTo) {
        payments = payments.filter(p => new Date(p.date_created) <= new Date(filters.dateTo!));
    }


    return payments.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  },

  getPayment: (id: number): Payment | undefined => {
    const payments: Payment[] = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
    return payments.find(p => p.id === id);
  },

  updateMockStatus: (paymentId: number, status: PaymentStatus, status_detail: string): Payment | undefined => {
    let payments: Payment[] = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
    const paymentIndex = payments.findIndex(p => p.id === paymentId);

    if (paymentIndex === -1) return undefined;

    const updatedPayment = {
      ...payments[paymentIndex],
      status,
      status_detail,
      date_approved: status === 'approved' ? new Date().toISOString() : payments[paymentIndex].date_approved,
    };

    payments[paymentIndex] = updatedPayment;
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));

    // Also create a mock event
    paymentsRepo.addEvent(paymentId, 'payment');

    return updatedPayment;
  },

  // --- Event Functions ---
  
  listEvents: (paymentId: number): PaymentEvent[] => {
    const key = `${EVENTS_KEY_PREFIX}${paymentId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  addEvent: (paymentId: number, type: 'payment'): PaymentEvent => {
    const key = `${EVENTS_KEY_PREFIX}${paymentId}`;
    const events = paymentsRepo.listEvents(paymentId);
    const newEvent: PaymentEvent = {
      id: uuidv4(),
      paymentId,
      type,
      date_created: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([newEvent, ...events]));
    return newEvent;
  },

  // --- Notes Functions ---

  getNote: (paymentId: number): string => {
    const key = `${NOTES_KEY_PREFIX}${paymentId}`;
    return localStorage.getItem(key) || '';
  },

  addNote: (paymentId: number, note: string): void => {
    const key = `${NOTES_KEY_PREFIX}${paymentId}`;
    localStorage.setItem(key, note);
  },
};

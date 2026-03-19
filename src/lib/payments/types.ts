import type { CartItem } from "@/types/cart";
import type {
  AdminPaymentsFilters,
  CreatePaymentPreferenceInput,
  CreatePaymentPreferenceResult,
  Payment as CanonicalPayment,
  PaymentGateway,
  PaymentStatus,
} from "@/types/payment";

export type { AdminPaymentsFilters, CreatePaymentPreferenceInput, CreatePaymentPreferenceResult };
export type { PaymentGateway, PaymentStatus };

export interface Payment extends CanonicalPayment {
  items: CartItem[];
  approvedAt?: string | null;
  paymentType?: string | null;
  paymentMethodKey: string;
  checkoutReference?: string | null;
  payer: {
    email: string;
  };
  webhookReceivedAt?: string | null;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  type: string;
  date_created: string;
  payload_json?: Record<string, unknown> | null;
}

export interface PaymentNote {
  id: string;
  payment_id: string;
  note: string;
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

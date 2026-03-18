import type { CartItem } from '@/types/recipe';

export type PaymentStatus =
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

export type PaymentGateway = 'mercado_pago' | 'mock';

export interface Payer {
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface Payment {
  id: string;
  gateway: PaymentGateway;
  externalPaymentId?: string | null;
  recipeIds: string[];
  items: CartItem[];
  totalBRL: number;
  payerName: string;
  payerEmail: string;
  status: PaymentStatus;
  statusDetail: string;
  paymentMethod: string;
  paymentType?: string | null;
  checkoutReference?: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  rawJson?: Record<string, unknown> | null;
  refunds?: unknown[];
  chargebacks?: unknown[];
  payer: Payer;

  // Legacy compatibility aliases kept during the migration.
  provider?: string;
  external_payment_id?: string | null;
  recipe_id?: string | null;
  user_id?: string | null;
  buyer_email?: string;
  status_detail?: string;
  payment_method_id?: 'pix' | 'credit_card' | 'boleto' | 'pending';
  payment_type_id?: 'account_money' | 'ticket' | 'credit_card' | 'pending';
  transaction_amount?: number;
  currency_id?: 'BRL';
  date_created?: string;
  date_approved?: string | null;
  external_reference?: string;
  webhook_received_at?: string | null;
  idempotency_key?: string | null;
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


export type PaymentStatus =
  | 'approved'
  | 'pending'
  | 'in_process'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

export interface Payer {
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface Payment {
  id: string;
  external_payment_id?: string | null;
  provider: string;
  recipe_id?: string | null;
  user_id?: string | null;
  buyer_email: string;
  status: PaymentStatus;
  status_detail: string;
  payment_method_id: 'pix' | 'credit_card' | 'boleto';
  payment_type_id: 'account_money' | 'ticket' | 'credit_card';
  transaction_amount: number;
  currency_id: 'BRL';
  payer: Payer;
  date_created: string;
  date_approved: string | null;
  external_reference: string; // recipe slug
  checkout_reference?: string | null;
  webhook_received_at?: string | null;
  idempotency_key?: string | null;
  raw_json?: Record<string, unknown> | null;
  refunds: unknown[]; // simplified for now
  chargebacks: unknown[]; // simplified for now
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

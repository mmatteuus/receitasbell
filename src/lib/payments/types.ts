
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
  id: number;
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
  refunds: unknown[]; // simplified for now
  chargebacks: unknown[]; // simplified for now
}

export interface PaymentEvent {
  id: string;
  paymentId: number;
  type: 'payment';
  date_created: string;
}

export type PaymentStatus =
  | "approved"
  | "pending"
  | "in_process"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type PaymentGateway = "mercado_pago" | "mock";

export interface AdminPaymentsFilters {
  status?: PaymentStatus[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  paymentIdGateway?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
  from?: string;
  to?: string;
}

export interface CreatePaymentPreferenceInput {
  recipeIds: string[];
  items?: Array<{
    recipeId: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    priceBRL: number;
  }>;
  payerName?: string;
  payerEmail: string;
  checkoutReference: string;
}

export interface CreatePaymentPreferenceResult {
  preferenceId: string | null;
  initPoint: string | null;
  sandboxInitPoint: string | null;
  paymentId: string | null;
  paymentIds: string[];
  status: PaymentStatus;
  unlockedCount: number;
  gateway: PaymentGateway;
}

export interface Payment {
  id: string;
  paymentIdGateway: string;
  gateway: PaymentGateway;
  recipeIds: string[];
  totalBRL: number;
  payerName: string;
  payerEmail: string;
  status: PaymentStatus;
  statusDetail: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

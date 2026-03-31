export type PaymentProvider = "stripe" | "mercadopago" | "mock";

export type PaymentStatus =
  | "created"
  | "pending"
  | "in_process"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "chargeback"
  | "charged_back"
  | "failed";

export interface PaymentOrder {
  id: string;
  tenantId: string;
  userId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  externalReference: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  provider: PaymentProvider;
  
  // Stripe Specifics
  providerPaymentId?: string | null;
  providerCheckoutId?: string | null;
  providerAccountId?: string | null;
  providerStatus?: string | null;
  providerEventId?: string | null;
  checkoutUrl?: string | null;
  
  // Legacy/MP Compatibility
  mpPaymentId?: string | null;
  preferenceId?: string | null;
  
  recipeIds: string[];
  items: unknown[];
  metadata?: Record<string, unknown> | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface StripeConnectAccount {
  tenantId: string;
  stripeAccountId: string;
  status: "pending" | "ready" | "restricted" | "disabled";
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
  } | null;
  defaultCurrency: string;
  disabledReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

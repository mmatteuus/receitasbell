export type PaymentStatus =
  | "approved"
  | "pending"
  | "in_process"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type PaymentGateway = "mercado_pago" | "mock" | "stripe";
export type CheckoutPaymentMethod = "stripe" | "pix" | "card";
export type DirectPaymentMethod = Exclude<CheckoutPaymentMethod, "checkout_pro">;

export interface PaymentIdentification {
  type: "CPF" | "CNPJ";
  number: string;
}

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

export interface CreatePixPaymentInput {
  recipeIds: string[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
  identification: PaymentIdentification;
}

export interface CreateCardPaymentInput {
  recipeIds: string[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  identification: PaymentIdentification;
}

export interface CreatePaymentPreferenceResult {
  paymentOrderId: string | number;
  preferenceId: string | null;
  checkoutUrl: string | null;
  checkoutUrlKind: "init_point" | "sandbox_init_point" | null;
  paymentMode: "sandbox" | "production";
  paymentId: string | null;
  paymentIds: string[];
  status: PaymentStatus;
  unlockedCount: number;
  gateway: PaymentGateway;
  message?: string;
}

export interface DirectPaymentResult {
  paymentOrderId: string | number;
  paymentId: string | null;
  status: string;
  internalStatus: PaymentStatus;
  statusDetail?: string | null;
  externalReference: string | null;
  paymentMethod: DirectPaymentMethod;
  checkoutReference: string;
  amountBRL: number;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  qrCodeUrl?: string | null;
}

export interface CheckoutPaymentConfig {
  paymentMode: "sandbox" | "production";
  publicKey: string | null;
  connectionStatus: string;
  supportedMethods: CheckoutPaymentMethod[];
}

export interface AdminPaymentSettingsResponse {
  payment_mode: "sandbox" | "production";
  webhooks_enabled: boolean;
  payment_topic_enabled: boolean;
  accessTokenConfigured: boolean;
  oauthConfigured: boolean;
  webhookSecretConfigured: boolean;
  missingConfig?: string[];
  connectionStatus: string;
  connectedAt: string | null;
  connectionExpiresAt: string | null;
  disconnectedAt: string | null;
  lastError: string | null;
  productionReady: boolean;
  blockingReasons: string[];
  effectiveCheckoutUrlKind: "init_point" | "sandbox_init_point";
  tenantId: string;
  userId: string | null;
  publicKey: string | null;
  webhookUrl: string;
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

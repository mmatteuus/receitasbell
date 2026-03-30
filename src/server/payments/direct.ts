import { getRecipeById } from "../recipes/repo.js";
import {
  createPaymentOrder,
  findPaymentOrderByIdempotencyKey,
  getPaymentOrderById,
  setPaymentOrderExternalReference,
  type PaymentRecord,
} from "./repo.js";
import {
  createMercadoPagoPayment,
  cancelMercadoPagoPayment,
  mpGetPayment,
  MercadoPagoApiError,
  type MercadoPagoPayment,
} from "../integrations/mercadopago/client.js";
import {
  getUsableMercadoPagoAccessToken,
  markConnectionReconnectRequired,
  refreshMercadoPagoConnection,
  getTenantMercadoPagoConnection,
} from "../integrations/mercadopago/connections.js";
import { buildPaymentExternalReference } from "./externalReference.js";
import { syncPayment } from "./service.js";
import { getTenantSellerPaymentMethods } from "../integrations/mercadopago/methods.js";
import { getSettingsMap, mapTypedSettings } from "../settings/repo.js";
import { ApiError } from "../shared/http.js";
import { Logger } from "../shared/logger.js";
import type {
  CheckoutPaymentConfig,
  CreateCardPaymentInput,
  CreatePixPaymentInput,
  DirectPaymentMethod,
  DirectPaymentResult,
  PaymentIdentification,
  PaymentStatus as AppPaymentStatus,
} from "../../types/payment.js";

const logger = new Logger({ domain: "payments.direct" });
const PIX_EXPIRATION_MS = 30 * 60 * 1000;

type StoredDirectPaymentMethod = "pix" | "credit_card";

type ResolvedOrderDraft = {
  recipeIds: string[];
  items: Array<{
    recipeId: string;
    recipeSlug: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    priceBRL: number;
    quantity: number;
  }>;
  totalAmount: number;
};

type DirectPaymentFingerprint = {
  recipeIds: string[];
  buyerEmail: string;
  amount: number;
  paymentMethod: StoredDirectPaymentMethod;
  provider: string;
};

type PixTransactionData = {
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
};

function buildDirectPaymentFingerprint(input: {
  recipeIds: string[];
  buyerEmail: string;
  amount: number;
  paymentMethod: StoredDirectPaymentMethod;
  provider: string;
}): DirectPaymentFingerprint {
  return {
    recipeIds: [...input.recipeIds],
    buyerEmail: input.buyerEmail.trim().toLowerCase(),
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    provider: input.provider,
  };
}

function directPaymentFingerprintMatches(order: PaymentRecord, expected: DirectPaymentFingerprint) {
  return (
    JSON.stringify(order.recipeIds) === JSON.stringify(expected.recipeIds) &&
    order.payerEmail.trim().toLowerCase() === expected.buyerEmail &&
    Number(order.amount) === Number(expected.amount) &&
    String(order.paymentMethod || "") === String(expected.paymentMethod) &&
    String(order.provider || "") === String(expected.provider)
  );
}

function mapProviderStatusToInternalStatus(value: unknown): AppPaymentStatus {
  switch (String(value || "").toLowerCase()) {
    case "approved":
      return "approved";
    case "in_process":
      return "in_process";
    case "rejected":
    case "failed":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "chargeback":
    case "charged_back":
      return "charged_back";
    case "pending":
    case "authorized":
    default:
      return "pending";
  }
}

function getStoredPaymentMethod(method: DirectPaymentMethod): StoredDirectPaymentMethod {
  return method === "card" ? "credit_card" : "pix";
}

function toDirectPaymentMethod(value: string): DirectPaymentMethod {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "pix") return "pix";
  if (normalized === "credit_card" || normalized === "credit-card" || normalized === "card") {
    return "card";
  }
  throw new ApiError(409, "O pedido informado não pertence a um pagamento direto.");
}

function extractCheckoutReference(order: PaymentRecord) {
  const idempotencyKey = String(order.idempotencyKey || "").trim();
  if (idempotencyKey.startsWith("pix_")) return idempotencyKey.slice(4);
  if (idempotencyKey.startsWith("card_")) return idempotencyKey.slice(5);
  return order.externalReference || String(order.id);
}

function normalizeDocumentNumber(value: string) {
  return value.replace(/\D+/g, "");
}

function splitPayerName(name: string | undefined) {
  const value = String(name || "").trim();
  if (!value) return { firstName: "", lastName: "" };
  const parts = value.split(/\s+/);
  return {
    firstName: parts[0] || value,
    lastName: parts.slice(1).join(" "),
  };
}

function buildDirectPaymentDescription(items: ResolvedOrderDraft["items"]) {
  if (items.length === 0) return "Receitas Bell";
  if (items.length === 1) return items[0].title;
  return `${items[0].title} e mais ${items.length - 1} receita${items.length > 2 ? "s" : ""}`;
}

function buildNotificationUrl(baseUrl: string, tenantId: string, paymentOrderId: string) {
  const url = new URL("/api/checkout/webhook", baseUrl);
  url.searchParams.set("paymentId", String(paymentOrderId));
  url.searchParams.set("tenantId", String(tenantId));
  return url.toString();
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readPixTransactionData(payment: MercadoPagoPayment | null | undefined): PixTransactionData {
  const pointOfInteraction = payment?.point_of_interaction;
  if (!pointOfInteraction || typeof pointOfInteraction !== "object") {
    return { qrCode: null, qrCodeBase64: null, ticketUrl: null };
  }

  const transactionData = (pointOfInteraction as { transaction_data?: unknown }).transaction_data;
  if (!transactionData || typeof transactionData !== "object") {
    return { qrCode: null, qrCodeBase64: null, ticketUrl: null };
  }

  const data = transactionData as Record<string, unknown>;
  return {
    qrCode: readString(data.qr_code),
    qrCodeBase64: readString(data.qr_code_base64),
    ticketUrl: readString(data.ticket_url),
  };
}

async function withMercadoPagoAccess<T>(
  tenantId: string,
  operation: (input: { accessToken: string; connectionId: string }) => Promise<T>,
): Promise<T> {
  const firstAttempt = await getUsableMercadoPagoAccessToken(String(tenantId));
  try {
    return await operation({
      accessToken: firstAttempt.accessToken,
      connectionId: firstAttempt.connection.id,
    });
  } catch (error) {
    if (!(error instanceof MercadoPagoApiError) || (error.status !== 401 && error.status !== 403)) {
      throw error;
    }

    logger.warn("mercadopago.token_rejected", {
      tenantId: String(tenantId),
      connectionId: firstAttempt.connection.id,
      status: error.status,
    });

    try {
      await refreshMercadoPagoConnection(firstAttempt.connection.id);
    } catch {
      await markConnectionReconnectRequired({
        tenantId: String(tenantId),
        reason: "token_refresh_failed_after_rejection",
      });
      throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
    }

    const retryAttempt = await getUsableMercadoPagoAccessToken(String(tenantId)).catch(async () => {
      await markConnectionReconnectRequired({
        tenantId: String(tenantId),
        reason: "token_resolution_failed_after_refresh",
      });
      throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
    });

    try {
      return await operation({
        accessToken: retryAttempt.accessToken,
        connectionId: retryAttempt.connection.id,
      });
    } catch (retryError) {
      if (retryError instanceof MercadoPagoApiError && (retryError.status === 401 || retryError.status === 403)) {
        await markConnectionReconnectRequired({
          tenantId: String(tenantId),
          reason: "token_rejected_after_refresh",
        });
        throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
      }

      throw retryError;
    }
  }
}

async function resolveOrderDraft(
  tenantId: string,
  recipeIds: string[],
): Promise<ResolvedOrderDraft> {
  const items: ResolvedOrderDraft["items"] = [];
  let totalAmount = 0;

  for (const recipeId of recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
    if (!recipe) {
      throw new ApiError(404, `Recipe ${recipeId} not found`);
    }

    const priceBRL = Number(recipe.priceBRL || 0);
    items.push({
      recipeId: String(recipe.id),
      recipeSlug: recipe.slug,
      slug: recipe.slug,
      title: recipe.title,
      imageUrl: recipe.imageUrl || null,
      priceBRL,
      quantity: 1,
    });
    totalAmount += priceBRL;
  }

  return {
    recipeIds,
    items,
    totalAmount,
  };
}

async function ensureDirectPaymentOrder(input: {
  tenantId: string;
  method: StoredDirectPaymentMethod;
  recipeIds: string[];
  buyerEmail: string;
  checkoutReference: string;
}) {
  const draft = await resolveOrderDraft(input.tenantId, input.recipeIds);
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  const idempotencyKey = `${input.method === "credit_card" ? "card" : "pix"}_${input.checkoutReference}`;
  const fingerprint = buildDirectPaymentFingerprint({
    recipeIds: input.recipeIds,
    buyerEmail,
    amount: draft.totalAmount,
    paymentMethod: input.method,
    provider: "mercadopago",
  });

  const existingOrder = await findPaymentOrderByIdempotencyKey(String(input.tenantId), idempotencyKey);
  if (existingOrder) {
    if (!directPaymentFingerprintMatches(existingOrder, fingerprint)) {
      throw new ApiError(409, "Payment idempotency key already used for a different payload.", {
        tenantId: String(input.tenantId),
        idempotencyKey,
        paymentOrderId: existingOrder.id,
      });
    }

    return {
      draft,
      order: existingOrder,
      reused: true,
    };
  }

  const order = await createPaymentOrder(String(input.tenantId), {
    amount: draft.totalAmount,
    status: "created",
    externalReference: input.checkoutReference,
    idempotencyKey,
    payerEmail: buyerEmail,
    paymentMethod: input.method,
    provider: "mercadopago",
    recipeIds: input.recipeIds,
    items: draft.items,
  });

  return {
    draft,
    order,
    reused: false,
  };
}

async function syncAndReloadOrder(
  tenantId: string,
  paymentOrderId: string,
  providerStatus: string,
  providerPaymentId?: string,
  mpDetails?: { methodId?: string; typeId?: string },
) {
  await syncPayment(String(tenantId), paymentOrderId, providerStatus, providerPaymentId, mpDetails);
  const updated = await getPaymentOrderById(tenantId, paymentOrderId);
  if (!updated) {
    throw new ApiError(404, `Order ${paymentOrderId} not found`);
  }
  return updated;
}

function mapDirectPaymentResult(input: {
  order: PaymentRecord;
  providerPayment?: MercadoPagoPayment | null;
  method: DirectPaymentMethod;
}): DirectPaymentResult {
  const providerStatus = String(input.providerPayment?.status || input.order.status || "pending");
  const pix = input.method === "pix" ? readPixTransactionData(input.providerPayment) : null;

  return {
    paymentOrderId: input.order.id,
    paymentId: input.providerPayment?.id != null
      ? String(input.providerPayment.id)
      : input.order.mpPaymentId || null,
    status: providerStatus,
    internalStatus: mapProviderStatusToInternalStatus(providerStatus),
    statusDetail: readString(input.providerPayment?.status_detail) || null,
    externalReference: input.providerPayment?.external_reference != null
      ? String(input.providerPayment.external_reference)
      : input.order.externalReference || null,
    paymentMethod: input.method,
    checkoutReference: extractCheckoutReference(input.order),
    amountBRL: Number(input.order.amount || 0),
    qrCode: pix?.qrCode ?? null,
    qrCodeBase64: pix?.qrCodeBase64 ?? null,
    qrCodeUrl: pix?.ticketUrl ?? null,
  };
}

function buildPayer(input: {
  buyerEmail: string;
  payerName?: string;
  identification: PaymentIdentification;
}) {
  const { firstName, lastName } = splitPayerName(input.payerName);
  return {
    email: input.buyerEmail.trim().toLowerCase(),
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    identification: {
      type: input.identification.type,
      number: normalizeDocumentNumber(input.identification.number),
    },
  };
}

async function getCurrentProviderPayment(tenantId: string, order: PaymentRecord) {
  if (!order.mpPaymentId) {
    return null;
  }

  const payment = await withMercadoPagoAccess(tenantId, async ({ accessToken }) =>
    mpGetPayment(accessToken, String(order.mpPaymentId)),
  );

  if (payment.status) {
    await syncAndReloadOrder(
      tenantId,
      order.id,
      String(payment.status),
      payment.id != null ? String(payment.id) : undefined,
      {
        methodId: String(payment.payment_method_id || ""),
        typeId: String(payment.payment_type_id || ""),
      }
    );
  }

  return payment;
}

export async function getCheckoutPaymentConfig(tenantId: string): Promise<CheckoutPaymentConfig> {
  const [settings, connection] = await Promise.all([
    getSettingsMap(tenantId).then(mapTypedSettings),
    getTenantMercadoPagoConnection(tenantId),
  ]);

  const isProd = settings.payment_mode === "production";
  const supportedMethods: CheckoutPaymentConfig["supportedMethods"] = [];

  // P0-03/TASK-003: Dynamic Seller Catalog
  if (connection?.status === "connected") {
    try {
      const sellerCatalog = await getTenantSellerPaymentMethods(tenantId);
      if (sellerCatalog.pixEnabled) supportedMethods.push("pix");
      if (sellerCatalog.cardEnabled && connection.publicKey) supportedMethods.push("card");
    } catch (e) {
      logger.error("Failed to fetch seller payment methods, using safe defaults", e);
      supportedMethods.push("pix");
      if (connection.publicKey) supportedMethods.push("card");
    }
  }

  // P0-03/TASK-004: Remove checkout_pro in production to force direct payment UX
  if (!isProd) {
    supportedMethods.push("checkout_pro");
  }

  return {
    paymentMode: settings.payment_mode,
    publicKey: connection?.publicKey ?? null,
    connectionStatus: connection?.status ?? "disconnected",
    supportedMethods,
  };
}

export async function createPixPayment(
  tenantId: string,
  input: CreatePixPaymentInput & { baseUrl: string },
): Promise<DirectPaymentResult> {
  const { order, draft } = await ensureDirectPaymentOrder({
    tenantId,
    method: "pix",
    recipeIds: input.recipeIds,
    buyerEmail: input.buyerEmail,
    checkoutReference: input.checkoutReference,
  });

  if (order.mpPaymentId) {
    const providerPayment = await getCurrentProviderPayment(tenantId, order);
    const updated = await getPaymentOrderById(tenantId, order.id);
    return mapDirectPaymentResult({
      order: updated || order,
      providerPayment,
      method: "pix",
    });
  }

  const externalReference = buildPaymentExternalReference(tenantId, order.id);
  if (order.externalReference !== externalReference) {
    await setPaymentOrderExternalReference(String(tenantId), order.id, externalReference);
  }

  const providerPayment = await withMercadoPagoAccess(tenantId, async ({ accessToken }) =>
    createMercadoPagoPayment(accessToken, {
      transaction_amount: draft.totalAmount,
      description: buildDirectPaymentDescription(draft.items),
      payment_method_id: "pix",
      external_reference: externalReference,
      notification_url: buildNotificationUrl(input.baseUrl, tenantId, order.id),
      payer: buildPayer({
        buyerEmail: input.buyerEmail,
        payerName: input.payerName,
        identification: input.identification,
      }),
      date_of_expiration: new Date(Date.now() + PIX_EXPIRATION_MS).toISOString(),
      idempotencyKey: order.idempotencyKey,
    }),
  );

  const updated = await syncAndReloadOrder(
    tenantId,
    order.id,
    String(providerPayment.status || "pending"),
    providerPayment.id != null ? String(providerPayment.id) : undefined,
  );

  return mapDirectPaymentResult({
    order: updated,
    providerPayment,
    method: "pix",
  });
}

export async function createCardPayment(
  tenantId: string,
  input: CreateCardPaymentInput & { baseUrl: string },
): Promise<DirectPaymentResult> {
  const { order, draft } = await ensureDirectPaymentOrder({
    tenantId,
    method: "credit_card",
    recipeIds: input.recipeIds,
    buyerEmail: input.buyerEmail,
    checkoutReference: input.checkoutReference,
  });

  if (order.mpPaymentId) {
    const providerPayment = await getCurrentProviderPayment(tenantId, order);
    const updated = await getPaymentOrderById(tenantId, order.id);
    return mapDirectPaymentResult({
      order: updated || order,
      providerPayment,
      method: "card",
    });
  }

  const externalReference = buildPaymentExternalReference(tenantId, order.id);
  if (order.externalReference !== externalReference) {
    await setPaymentOrderExternalReference(String(tenantId), order.id, externalReference);
  }

  const providerPayment = await withMercadoPagoAccess(tenantId, async ({ accessToken }) =>
    createMercadoPagoPayment(accessToken, {
      token: input.token,
      transaction_amount: draft.totalAmount,
      description: buildDirectPaymentDescription(draft.items),
      installments: input.installments,
      payment_method_id: input.paymentMethodId,
      issuer_id: input.issuerId || undefined,
      external_reference: externalReference,
      notification_url: buildNotificationUrl(input.baseUrl, tenantId, order.id),
      payer: buildPayer({
        buyerEmail: input.buyerEmail,
        payerName: input.payerName,
        identification: input.identification,
      }),
      capture: true,
      idempotencyKey: order.idempotencyKey,
    }),
  );

  const updated = await syncAndReloadOrder(
    tenantId,
    order.id,
    String(providerPayment.status || "pending"),
    providerPayment.id != null ? String(providerPayment.id) : undefined,
  );

  return mapDirectPaymentResult({
    order: updated,
    providerPayment,
    method: "card",
  });
}

export async function getDirectPaymentStatus(
  tenantId: string,
  paymentOrderId: string,
): Promise<DirectPaymentResult> {
  const order = await getPaymentOrderById(tenantId, paymentOrderId);
  if (!order) {
    throw new ApiError(404, `Order ${paymentOrderId} not found`);
  }

  const method = toDirectPaymentMethod(order.paymentMethod);
  const providerPayment = await getCurrentProviderPayment(tenantId, order);
  const updated = await getPaymentOrderById(tenantId, paymentOrderId);

  return mapDirectPaymentResult({
    order: updated || order,
    providerPayment,
    method,
  });
}

export async function cancelDirectPayment(
  tenantId: string,
  paymentOrderId: string,
): Promise<DirectPaymentResult> {
  const order = await getPaymentOrderById(tenantId, paymentOrderId);
  if (!order) {
    throw new ApiError(404, `Order ${paymentOrderId} not found`);
  }
  if (!order.mpPaymentId) {
    throw new ApiError(409, "O pagamento ainda não possui um identificador do Mercado Pago.");
  }

  const cancelled = await withMercadoPagoAccess(tenantId, async ({ accessToken }) =>
    cancelMercadoPagoPayment(accessToken, String(order.mpPaymentId)),
  );
  const updated = await syncAndReloadOrder(
    tenantId,
    order.id,
    String(cancelled.status || "cancelled"),
    cancelled.id != null ? String(cancelled.id) : String(order.mpPaymentId),
  );

  return mapDirectPaymentResult({
    order: updated,
    providerPayment: cancelled,
    method: toDirectPaymentMethod(order.paymentMethod),
  });
}

import { ApiError } from "../shared/http.js";
import { getRecipeById } from "../recipes/repo.js";
import { 
  createPaymentOrder, 
  findPaymentOrderByIdempotencyKey,
  getPaymentOrderById,
  setPaymentOrderExternalReference,
  setPaymentOrderPreferenceId,
  updatePaymentOrderStatus,
  PaymentStatus,
  type PaymentRecord,
} from "./repo.js";
import { createEntitlement } from "../identity/entitlements.repo.js";
import { createMercadoPagoPreference, MercadoPagoApiError, type MercadoPagoPreference } from "../integrations/mercadopago/client.js"; 
import {
  getUsableMercadoPagoAccessToken,
  markConnectionReconnectRequired,
  refreshMercadoPagoConnection,
} from "../integrations/mercadopago/connections.js";
import { logAuditEvent } from "../audit/repo.js";
import { Logger } from "../shared/logger.js";
import { buildPaymentExternalReference } from "./externalReference.js";
import { getSettingsMap, mapTypedSettings } from "../settings/repo.js";

const logger = new Logger({ domain: "payments" });

type CheckoutUrlKind = "init_point" | "sandbox_init_point";
type PaymentMode = "sandbox" | "production";

function getExpectedCheckoutUrlKind(paymentMode: PaymentMode): CheckoutUrlKind {
  return paymentMode === "production" ? "init_point" : "sandbox_init_point";
}

function getAvailableCheckoutUrlKinds(input: {
  initPoint: string | null;
  sandboxInitPoint: string | null;
}) {
  const available: CheckoutUrlKind[] = [];
  if (input.initPoint) available.push("init_point");
  if (input.sandboxInitPoint) available.push("sandbox_init_point");
  return available;
}

function resolveCheckoutUrl(input: {
  initPoint: string | null;
  sandboxInitPoint: string | null;
  paymentMode: PaymentMode;
}) {
  if (input.paymentMode === "sandbox" && input.sandboxInitPoint) {
    return {
      checkoutUrl: input.sandboxInitPoint,
      checkoutUrlKind: "sandbox_init_point" as CheckoutUrlKind,
    };
  }

  if (input.paymentMode === "production" && input.initPoint) {
    return {
      checkoutUrl: input.initPoint,
      checkoutUrlKind: "init_point" as CheckoutUrlKind,
    };
  }

  const expectedCheckoutUrlKind = getExpectedCheckoutUrlKind(input.paymentMode);
  const availableCheckoutUrlKinds = getAvailableCheckoutUrlKinds(input);
  const message = input.paymentMode === "sandbox"
    ? "A conta conectada não retornou um checkout sandbox. Use uma conta de testes ou altere o modo para produção."
    : "A conta conectada não retornou um checkout de produção. Revise a conexão antes de cobrar pagamentos reais.";

  throw new ApiError(409, message, {
    paymentMode: input.paymentMode,
    expectedCheckoutUrlKind,
    availableCheckoutUrlKinds,
  });
}

async function logCheckoutAuditEvent(input: {
  tenantId: string | number;
  paymentOrderId: string | number;
  action: "checkout.preference_created" | "checkout.preference_failed";
  connectionId: string | null;
  payload?: Record<string, unknown>;
}) {
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: "system",
    actorId: "system",
    action: input.action,
    resourceType: "payment_order",
    resourceId: String(input.paymentOrderId),
    payload: {
      connectionId: input.connectionId,
      ...(input.payload || {}),
    },
  });
}

type CheckoutFingerprint = {
  recipeIds: string[];
  buyerEmail: string;
  userId: string | null;
  amount: number;
  paymentMethod: string;
  provider: string;
};

function buildCheckoutFingerprint(input: {
  recipeIds: string[];
  buyerEmail: string;
  userId?: string | number | null;
  amount: number;
  paymentMethod: string;
  provider: string;
}): CheckoutFingerprint {
  return {
    recipeIds: [...input.recipeIds],
    buyerEmail: input.buyerEmail.trim().toLowerCase(),
    userId: input.userId == null ? null : String(input.userId),
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    provider: input.provider,
  };
}

function checkoutFingerprintMatches(order: PaymentRecord, expected: CheckoutFingerprint) {
  return (
    JSON.stringify(order.recipeIds) === JSON.stringify(expected.recipeIds) &&
    order.payerEmail.trim().toLowerCase() === expected.buyerEmail &&
    Number(order.amount) === Number(expected.amount) &&
    String(order.userId ?? null) === String(expected.userId ?? null) &&
    String(order.paymentMethod || "") === String(expected.paymentMethod) &&
    String(order.provider || "") === String(expected.provider)
  );
}

const TERMINAL_PAYMENT_STATUSES = new Set([
  "approved",
  "rejected",
  "cancelled",
  "refunded",
  "chargeback",
  "charged_back",
  "failed",
]);

function isTerminalPaymentStatus(status: string) {
  return TERMINAL_PAYMENT_STATUSES.has(String(status).toLowerCase());
}

export async function createCheckout(tenantId: string | number, input: {
  recipeIds: string[];
  buyerEmail: string;
  checkoutReference: string;
  baseUrl: string;
  userId?: string | number | null;
  enableNotifications?: boolean;
}) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  const items = [];
  let totalAmount = 0;

  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
    if (!recipe) throw new ApiError(404, `Recipe ${recipeId} not found`);
    items.push({
      recipeId: recipe.id,
      recipeSlug: recipe.slug,
      slug: recipe.slug,
      title: recipe.title,
      imageUrl: recipe.imageUrl || null,
      priceBRL: recipe.priceBRL || 0,
      quantity: 1,
    });
    totalAmount += recipe.priceBRL || 0;
  }

  const checkoutFingerprint = buildCheckoutFingerprint({
    recipeIds: input.recipeIds,
    buyerEmail,
    userId: input.userId ?? null,
    amount: totalAmount,
    paymentMethod: "mercadopago",
    provider: "mercadopago",
  });

  const existingOrder = await findPaymentOrderByIdempotencyKey(String(tenantId), `chk_${input.checkoutReference}`);
  if (existingOrder) {
    if (!checkoutFingerprintMatches(existingOrder, checkoutFingerprint)) {
      throw new ApiError(409, "Checkout idempotency key already used for a different payload.", {
        tenantId: String(tenantId),
        idempotencyKey: `chk_${input.checkoutReference}`,
        paymentOrderId: existingOrder.id,
      });
    }

    logger.info("checkout.idempotent_reuse", {
      action: "checkout.idempotent_reuse",
      tenantId,
      paymentOrderId: existingOrder.id,
      idempotencyKey: `chk_${input.checkoutReference}`,
      amount: totalAmount,
      buyerEmail,
    });
  }

  // T2/T3: Create Internal Order FIRST
  const payment = existingOrder || await createPaymentOrder(String(tenantId), {
    amount: totalAmount,
    status: 'created',
    externalReference: input.checkoutReference,
    idempotencyKey: `chk_${input.checkoutReference}`,
    payerEmail: buyerEmail,
    paymentMethod: 'mercadopago',
    recipeIds: input.recipeIds,
    userId: input.userId ? String(input.userId) : null,
    items,
  });

  const typedSettings = mapTypedSettings(await getSettingsMap(String(tenantId)));
  const paymentMode = typedSettings.payment_mode;

  if (existingOrder && isTerminalPaymentStatus(existingOrder.status)) {
    logger.info("checkout.idempotent_terminal_reuse", {
      action: "checkout.idempotent_terminal_reuse",
      tenantId,
      paymentOrderId: existingOrder.id,
      idempotencyKey: `chk_${input.checkoutReference}`,
      status: existingOrder.status,
    });

    return {
      paymentOrderId: existingOrder.id,
      paymentId: String(existingOrder.id),
      paymentIds: [String(existingOrder.id)],
      checkoutUrl: null,
      checkoutUrlKind: null,
      paymentMode,
      preferenceId: existingOrder.preferenceId || null,
      status: existingOrder.status as PaymentStatus,
      unlockedCount: 0,
      gateway: existingOrder.provider === "mock" ? "mock" : "mercado_pago",
    };
  }

  const sellerExternalReference = buildPaymentExternalReference(tenantId, payment.id);
  await setPaymentOrderExternalReference(String(tenantId), payment.id, sellerExternalReference);
  const preferencePayload = {
    items: items.map((it) => ({
      id: it.recipeId,
      title: it.title,
      unit_price: it.priceBRL,
      quantity: 1,
      currency_id: "BRL",
    })),
    external_reference: sellerExternalReference,
    payer: { email: buyerEmail },
    back_urls: {
      success: `${input.baseUrl}/checkout/success?orderId=${payment.id}`,
      pending: `${input.baseUrl}/checkout/pending?orderId=${payment.id}`,
      failure: `${input.baseUrl}/checkout/failure?orderId=${payment.id}`,
    },
    notification_url: (input.enableNotifications ?? true)
      ? `${input.baseUrl}/api/checkout/webhook?paymentId=${payment.id}`
      : undefined,
    idempotencyKey: input.checkoutReference,
  };

  let firstAttempt: Awaited<ReturnType<typeof getUsableMercadoPagoAccessToken>>;
  try {
    firstAttempt = await getUsableMercadoPagoAccessToken(String(tenantId));
  } catch (error) {
    await logCheckoutAuditEvent({
      tenantId,
      paymentOrderId: payment.id,
      action: "checkout.preference_failed",
      connectionId: null,
      payload: {
        reason: "connection_unavailable",
        paymentMode,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
  let connectionId = firstAttempt.connection.id;
  let mpPref: MercadoPagoPreference | null = null;
  try {
    mpPref = await createMercadoPagoPreference(firstAttempt.accessToken, preferencePayload);
  } catch (error) {
    if (!(error instanceof MercadoPagoApiError) || (error.status !== 401 && error.status !== 403)) {
      await logCheckoutAuditEvent({
        tenantId,
        paymentOrderId: payment.id,
        action: "checkout.preference_failed",
        connectionId,
        payload: {
          reason: "preference_create_failed",
          paymentMode,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      logger.error("checkout.preference_failed", {
        action: "checkout.preference_failed",
        tenantId,
        paymentOrderId: payment.id,
        providerPaymentId: null,
        connectionId,
        checkoutUrlKind: null,
        error,
      });
      throw error;
    }

    logger.warn("checkout.preference_failed", {
      action: "checkout.preference_failed",
      tenantId,
      paymentOrderId: payment.id,
      providerPaymentId: null,
      connectionId,
      checkoutUrlKind: null,
      reason: "token_rejected_first_attempt",
      status: error.status,
    });

    try {
      const refreshedConnection = await refreshMercadoPagoConnection(connectionId);
      connectionId = refreshedConnection.id;
    } catch (refreshError) {
      await markConnectionReconnectRequired({
        tenantId,
        reason: "token_refresh_failed_after_rejection",
      });
      await logCheckoutAuditEvent({
        tenantId,
        paymentOrderId: payment.id,
        action: "checkout.preference_failed",
        connectionId,
        payload: {
          reason: "token_refresh_failed_after_rejection",
          paymentMode,
          errorMessage: refreshError instanceof Error ? refreshError.message : String(refreshError),
        },
      });
      logger.warn("checkout.preference_failed", {
        action: "checkout.preference_failed",
        tenantId,
        paymentOrderId: payment.id,
        providerPaymentId: null,
        connectionId,
        checkoutUrlKind: null,
        reason: "token_refresh_failed_after_rejection",
      });
      throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
    }

    let retryAttempt: Awaited<ReturnType<typeof getUsableMercadoPagoAccessToken>>;
    try {
      retryAttempt = await getUsableMercadoPagoAccessToken(String(tenantId));
    } catch (retryResolutionError) {
      await markConnectionReconnectRequired({
        tenantId,
        reason: "token_resolution_failed_after_refresh",
      });
      await logCheckoutAuditEvent({
        tenantId,
        paymentOrderId: payment.id,
        action: "checkout.preference_failed",
        connectionId,
        payload: {
          reason: "token_resolution_failed_after_refresh",
          paymentMode,
          errorMessage: retryResolutionError instanceof Error
            ? retryResolutionError.message
            : String(retryResolutionError),
        },
      });
      throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
    }
    connectionId = retryAttempt.connection.id;
    try {
      mpPref = await createMercadoPagoPreference(retryAttempt.accessToken, preferencePayload);
    } catch (retryError) {
      if (retryError instanceof MercadoPagoApiError && (retryError.status === 401 || retryError.status === 403)) {
        await markConnectionReconnectRequired({
          tenantId,
          reason: "token_rejected_after_refresh",
        });
        await logCheckoutAuditEvent({
          tenantId,
          paymentOrderId: payment.id,
          action: "checkout.preference_failed",
          connectionId,
          payload: {
            reason: "token_rejected_after_refresh",
            paymentMode,
            status: retryError.status,
          },
        });
        logger.warn("checkout.preference_failed", {
          action: "checkout.preference_failed",
          tenantId,
          paymentOrderId: payment.id,
          providerPaymentId: null,
          connectionId,
          checkoutUrlKind: null,
          reason: "token_rejected_after_refresh",
          status: retryError.status,
        });
        throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
      }

      await logCheckoutAuditEvent({
        tenantId,
        paymentOrderId: payment.id,
        action: "checkout.preference_failed",
        connectionId,
        payload: {
          reason: "preference_create_failed_retry",
          paymentMode,
          errorMessage: retryError instanceof Error ? retryError.message : String(retryError),
        },
      });
      logger.error("checkout.preference_failed", {
        action: "checkout.preference_failed",
        tenantId,
        paymentOrderId: payment.id,
        providerPaymentId: null,
        connectionId,
        checkoutUrlKind: null,
        error: retryError,
      });
      throw retryError;
    }
  }
  const initPoint = mpPref?.init_point ? String(mpPref.init_point) : null;
  const sandboxInitPoint = mpPref?.sandbox_init_point ? String(mpPref.sandbox_init_point) : null;
  let resolvedCheckout: { checkoutUrl: string; checkoutUrlKind: CheckoutUrlKind };
  try {
    resolvedCheckout = resolveCheckoutUrl({
      initPoint,
      sandboxInitPoint,
      paymentMode,
    });
  } catch (error) {
    await logCheckoutAuditEvent({
      tenantId,
      paymentOrderId: payment.id,
      action: "checkout.preference_failed",
      connectionId,
      payload: {
        reason: "checkout_url_missing_for_mode",
        paymentMode,
        initPointAvailable: Boolean(initPoint),
        sandboxInitPointAvailable: Boolean(sandboxInitPoint),
      },
    });
    throw error;
  }

  if (mpPref?.id) {
    await setPaymentOrderPreferenceId(String(tenantId), payment.id, String(mpPref.id));
  }

  // Only mark the order as pending once the active runtime mode has a usable launch URL.
  await updatePaymentOrderStatus(String(tenantId), payment.id, 'pending', undefined);
  await logCheckoutAuditEvent({
    tenantId,
    paymentOrderId: payment.id,
    action: "checkout.preference_created",
    connectionId,
    payload: {
      paymentMode,
      checkoutUrlKind: resolvedCheckout.checkoutUrlKind,
      preferenceId: mpPref?.id || null,
      amount: totalAmount,
      buyerEmail,
    },
  });

  logger.info("checkout.preference_created", {
    action: "checkout.preference_created",
    tenantId,
    paymentOrderId: payment.id,
    providerPaymentId: null,
    buyerEmail,
    amount: totalAmount,
    connectionId,
    checkoutUrlKind: resolvedCheckout.checkoutUrlKind,
  });
  
  return { 
    paymentOrderId: payment.id,
    paymentId: String(payment.id),
    paymentIds: [String(payment.id)],
    checkoutUrl: resolvedCheckout.checkoutUrl,
    checkoutUrlKind: resolvedCheckout.checkoutUrlKind,
    paymentMode,
    preferenceId: mpPref?.id || null,
    status: "pending",
    unlockedCount: 0,
    gateway: 'mercado_pago'
  };
}

export async function createMockCheckout(tenantId: string | number, input: {
  recipeIds: string[];
  buyerEmail: string;
  checkoutReference: string;
}) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  const items = [];
  let totalAmount = 0;

  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
    if (!recipe) throw new ApiError(404, `Recipe ${recipeId} not found`);
    items.push({
      recipeId: recipe.id,
      recipeSlug: recipe.slug,
      slug: recipe.slug,
      title: recipe.title,
      imageUrl: recipe.imageUrl || null,
      priceBRL: recipe.priceBRL || 0,
      quantity: 1,
    });
    totalAmount += recipe.priceBRL || 0;
  }

  const payment = await createPaymentOrder(String(tenantId), {
    amount: totalAmount,
    status: 'approved',
    externalReference: input.checkoutReference,
    idempotencyKey: `mock_${input.checkoutReference}_${Date.now()}`,
    payerEmail: buyerEmail,
    paymentMethod: 'mock',
    recipeIds: input.recipeIds,
    items,
  });

  // Grant access immediately for mock
  for (const rid of input.recipeIds) {
    await createEntitlement(tenantId, {
      paymentId: String(payment.id),
      payerEmail: buyerEmail,
      recipeSlug: rid,
    });
  }

  return { 
    paymentOrderId: payment.id,
    paymentId: String(payment.id),
    paymentIds: [String(payment.id)],
    checkoutUrl: null,
    checkoutUrlKind: null,
    paymentMode: "sandbox",
    preferenceId: null,
    status: 'approved',
    unlockedCount: input.recipeIds.length,
    gateway: "mock",
    message: 'Mock payment success'
  };
}

export async function syncPayment(tenantId: string | number, paymentId: string | number, status: string, providerPaymentId?: string) {
    logger.info("Syncing payment status", { tenantId, paymentId, nextStatus: status, providerPaymentId });
    const payment = await getPaymentOrderById(tenantId, paymentId);
    if (!payment) throw new ApiError(404, `Order ${paymentId} not found`);

    const nextStatus = status as PaymentStatus;
    
    // T6: Simple State Machine Logic
    if (payment.status === 'approved' && nextStatus !== 'refunded' && nextStatus !== 'chargeback') {
        // Already approved and not a reversal, skip
        return;
    }

    await updatePaymentOrderStatus(String(tenantId), paymentId, nextStatus, providerPaymentId);
    
    // T7: Entitlement Grant
    if (nextStatus === 'approved') {
        const current = await getPaymentOrderById(tenantId, paymentId);
        if (current && Array.isArray(current.items)) {
            for (const item of current.items) {
                const slug = item.recipeSlug || item.recipeId; // Fallback to ID if slug missing
                if (slug) {
                    await createEntitlement(tenantId, {
                        paymentId: String(paymentId),
                        payerEmail: current.payerEmail,
                        recipeSlug: String(slug),
                    });
                }
            }
        }
    }
}

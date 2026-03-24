import { ApiError } from "../shared/http.js";
import { getRecipeById } from "../recipes/repo.js";
import { 
  createPayment, 
  getPaymentById, 
  updatePaymentStatus,
  PaymentStatus,
} from "./repo.js";
import { createEntitlement } from "../identity/entitlements.repo.js";
import { createMercadoPagoPreference } from "../integrations/mercadopago/client.js"; 
import { Logger } from "../shared/logger.js";

const logger = new Logger({ domain: "payments" });

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
    items.push({ recipeId: recipe.id, title: recipe.title, priceBRL: recipe.priceBRL || 0 });
    totalAmount += recipe.priceBRL || 0;
  }

  // T2/T3: Create Internal Order FIRST
  const payment = await createPayment(tenantId, {
    amount: totalAmount,
    status: 'created',
    externalReference: input.checkoutReference,
    idempotencyKey: `chk_${input.checkoutReference}`,
    payerEmail: buyerEmail,
    paymentMethod: 'mercadopago',
    recipeIds: input.recipeIds,
    userId: input.userId,
    items,
  });

  // Call Mercado Pago
  const mpPref = await createMercadoPagoPreference(tenantId, {
    items: items.map(it => ({
      id: it.recipeId,
      title: it.title,
      unit_price: it.priceBRL,
      quantity: 1,
      currency_id: 'BRL',
    })),
    external_reference: `t:${tenantId}:p:${payment.id}`,
    payer: { email: buyerEmail },
    back_urls: {
      success: `${input.baseUrl}/checkout/success?orderId=${payment.id}`,
      pending: `${input.baseUrl}/checkout/pending?orderId=${payment.id}`,
      failure: `${input.baseUrl}/checkout/failure?orderId=${payment.id}`,
    },
    notification_url: input.enableNotifications ? `${input.baseUrl}/api/checkout/webhook?tenantId=${tenantId}&paymentId=${payment.id}` : undefined,
    idempotencyKey: input.checkoutReference,
  });

  // Update order with preferenceId
  await updatePaymentStatus(tenantId, payment.id, 'pending', undefined);
  
  logger.info("Checkout created", { 
    tenantId, 
    paymentOrderId: payment.id, 
    buyerEmail, 
    amount: totalAmount 
  });
  
  return { 
    paymentOrderId: payment.id,
    checkoutUrl: mpPref.init_point,
    preferenceId: mpPref.id,
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
    items.push({ recipeId: recipe.id, title: recipe.title, priceBRL: recipe.priceBRL || 0 });
    totalAmount += recipe.priceBRL || 0;
  }

  const payment = await createPayment(tenantId, {
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
    status: 'approved',
    message: 'Mock payment success'
  };
}

export async function syncPayment(tenantId: string | number, paymentId: string | number, status: string, providerPaymentId?: string) {
    logger.info("Syncing payment status", { tenantId, paymentId, nextStatus: status, providerPaymentId });
    const payment = await getPaymentById(tenantId, paymentId);
    if (!payment) throw new ApiError(404, `Order ${paymentId} not found`);

    const nextStatus = status as PaymentStatus;
    
    // T6: Simple State Machine Logic
    if (payment.status === 'approved' && nextStatus !== 'refunded' && nextStatus !== 'chargeback') {
        // Already approved and not a reversal, skip
        return;
    }

    await updatePaymentStatus(tenantId, paymentId, nextStatus, providerPaymentId);
    
    // T7: Entitlement Grant
    if (nextStatus === 'approved') {
        const current = await getPaymentById(tenantId, paymentId);
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

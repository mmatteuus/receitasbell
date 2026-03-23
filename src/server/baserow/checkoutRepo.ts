import { ApiError } from '../http.js';
import { getRecipeById, getRecipeBySlug } from './recipesRepo.js';
import { findOrCreateUserByEmail } from './usersRepo.js';
import { createPayment, updatePaymentStatus } from './paymentsRepo.js';
import { createEntitlement, revokeEntitlement } from './entitlementsRepo.js';
import { createMercadoPagoPreference } from '../payments/mercadoPago.js';
import { BASEROW_TABLES, fetchBaserow } from './client.js';

export async function createMockCheckout(tenantId: string | number, input: { recipeIds: string[]; buyerEmail: string; checkoutReference: string }) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  const user = await findOrCreateUserByEmail(tenantId, buyerEmail);
  
  const items = [];
  let totalAmount = 0;

  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
    if (!recipe) throw new ApiError(404, `Recipe ${recipeId} not found`);
    
    items.push({
      recipeId: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      priceBRL: recipe.priceBRL || 0,
      imageUrl: recipe.imageUrl || "",
    });
    totalAmount += recipe.priceBRL || 0;
  }

  const payment = await createPayment(tenantId, {
    amount: totalAmount,
    status: 'approved',
    externalReference: input.checkoutReference,
    paymentId: `mock_${Date.now()}`,
    payerEmail: buyerEmail,
    paymentMethod: 'mock',
    recipeIds: input.recipeIds,
    items: items,
  });

  for (const item of items) {
    await createEntitlement(tenantId, {
      paymentId: payment.id,
      payerEmail: buyerEmail,
      recipeSlug: item.slug,
    });
  }

  return {
    payment,
    status: 'approved',
    paymentId: payment.id,
  };
}

export async function createMercadoPagoCheckout(tenantId: string | number, input: { recipeIds: string[]; buyerEmail: string; checkoutReference: string; baseUrl: string }) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  
  const items = [];
  let totalAmount = 0;

  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
    if (!recipe) throw new ApiError(404, `Recipe ${recipeId} not found`);
    
    items.push({
      recipeId: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      priceBRL: recipe.priceBRL || 0,
      imageUrl: recipe.imageUrl || "",
    });
    totalAmount += recipe.priceBRL || 0;
  }

  // Criar pagamento pendente
  const payment = await createPayment(tenantId, {
    amount: totalAmount,
    status: 'pending',
    externalReference: input.checkoutReference,
    paymentId: '', // Ainda não temos do MP
    payerEmail: buyerEmail,
    paymentMethod: 'mercadopago',
    recipeIds: input.recipeIds,
    items: items,
  });

  const preference = await createMercadoPagoPreference(String(tenantId), {
    items: items.map((item: any) => ({
      recipeId: item.recipeId,
      title: item.title,
      slug: item.slug,
      priceBRL: item.priceBRL,
      imageUrl: item.imageUrl || "",
      quantity: 1,
    })),
    buyerEmail: buyerEmail,
    externalReference: input.checkoutReference,
    successUrl: `${input.baseUrl}/checkout/success`,
    pendingUrl: `${input.baseUrl}/checkout/pending`,
    failureUrl: `${input.baseUrl}/checkout/failure`,
    notificationUrl: `${input.baseUrl}/api/payments/mercadopago/webhook`,
    metadata: {
        payment_id: String(payment.id),
        tenant_id: String(tenantId),
    }
  });

  return preference;
}

export async function syncMercadoPagoPayment(tenantId: string | number, paymentPayload: any, notificationPayload: any) {
    const status = paymentPayload.status;
    const internalPaymentId = paymentPayload.metadata?.payment_id;

    if (internalPaymentId) {
        await updatePaymentStatus(tenantId, internalPaymentId, status);
        
        if (status === 'approved') {
            const data = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/${internalPaymentId}/?user_field_names=true`);
            const recipeIds = JSON.parse(data.recipe_ids_json || "[]");
            const payerEmail = data.payer_email;

            for (const rid of recipeIds) {
                const recipe = await getRecipeById(tenantId, rid);
                if (recipe) {
                    await createEntitlement(tenantId, {
                        paymentId: String(internalPaymentId),
                        payerEmail: payerEmail,
                        recipeSlug: recipe.slug,
                    });
                }
            }
        }
    }
    
    return { id: internalPaymentId, status };
}

import { ApiError } from '../http.js';
import { getRecipeById, getRecipeBySlug } from './recipesRepo.js';
import { findOrCreateUserByEmail } from './usersRepo.js';
import { createPayment, updatePaymentStatus } from './paymentsRepo.js';
import { createEntitlement, revokeEntitlement } from './entitlementsRepo.js';
import { createMercadoPagoPreference } from '../payments/mercadoPago.js';
import { BASEROW_TABLES, fetchBaserow } from './client.js';

export async function createMockCheckout(tenantId: string | number, input: any) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  const user = await findOrCreateUserByEmail(tenantId, buyerEmail);
  
  const payment = await createPayment(tenantId, {
    amount: input.items?.reduce((sum: number, item: any) => sum + item.priceBRL, 0) || 0,
    status: 'approved',
    externalReference: input.checkoutReference,
    paymentId: `mock_${Date.now()}`,
    payerEmail: buyerEmail,
    paymentMethod: 'mock',
    recipeIds: input.recipeIds,
    items: input.items || [],
  });

  for (const recipeId of input.recipeIds) {
    const recipe = await getRecipeById(tenantId, recipeId);
    if (recipe) {
      await createEntitlement(tenantId, {
        paymentId: payment.id,
        payerEmail: buyerEmail,
        recipeSlug: recipe.slug,
      });
    }
  }

  return {
    payment,
    status: 'approved',
    paymentId: payment.id,
  };
}

export async function createMercadoPagoCheckout(tenantId: string | number, input: any) {
  // Simplificado para fins de migração, idealmente chamaria createMercadoPagoPreference
  // e salvaria um pagamento pendente no Baserow.
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  
  // Criar pagamento pendente
  const payment = await createPayment(tenantId, {
    amount: input.items?.reduce((sum: number, item: any) => sum + item.priceBRL, 0) || 0,
    status: 'pending',
    externalReference: input.checkoutReference,
    paymentId: '', // Ainda não temos do MP
    payerEmail: buyerEmail,
    paymentMethod: 'mercadopago',
    recipeIds: input.recipeIds,
    items: input.items || [],
  });

  const preference = await createMercadoPagoPreference({
    items: input.items.map((item: any) => ({
      recipeId: item.recipeId,
      title: item.title,
      slug: item.slug,
      priceBRL: item.priceBRL,
      imageUrl: item.imageUrl || "",
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
        await updatePaymentStatus(internalPaymentId, status);
        
        if (status === 'approved') {
            const data = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/${internalPaymentId}/?user_field_names=true`);
            const recipeIds = JSON.parse(data.recipe_ids_json || "[]");
            const payerEmail = data.payer_email;

            for (const rid of recipeIds) {
                const recipe = await getRecipeById(tenantId, rid);
                if (recipe) {
                    await createEntitlement(tenantId, {
                        userId: data.userId || "",
                        recipeId: recipe.id,
                        recipeSlug: recipe.slug,
                        paymentId: String(internalPaymentId),
                    });
                }
            }
        }
    }
    
    return { id: internalPaymentId, status };
}

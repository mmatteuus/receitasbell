import { ApiError } from "../../shared/http.js";
import { getRecipeById } from "../recipes/repo.js";
import { 
  createPayment, 
  getPaymentById, 
  updatePaymentStatus,
} from "./repo.js";
import { createEntitlement } from "../users/entitlements.repo.js";
import { createMercadoPagoPreference as createMPPref } from "../../integrations/mercadopago/service.js"; // I'll create this consolidated file

export async function createCheckout(tenantId: string | number, input: {
  recipeIds: string[];
  buyerEmail: string;
  checkoutReference: string;
  baseUrl: string;
  userId?: string | number | null;
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
    status: 'created',
    externalReference: input.checkoutReference,
    idempotencyKey: `chk_${input.checkoutReference}`,
    payerEmail: buyerEmail,
    paymentMethod: 'mercadopago',
    recipeIds: input.recipeIds,
    items,
  });

  return { paymentOrderId: payment.id };
}

export async function syncPayment(tenantId: string | number, paymentId: string | number, status: string) {
    await updatePaymentStatus(tenantId, paymentId, status);
    if (status === 'approved') {
        const payment = await getPaymentById(tenantId, paymentId);
        if (payment) {
            for (const rid of payment.recipeIds) {
                await createEntitlement(tenantId, {
                    paymentId: String(paymentId),
                    payerEmail: payment.payerEmail,
                    recipeSlug: rid,
                });
            }
        }
    }
}

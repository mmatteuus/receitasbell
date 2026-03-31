import { withApiHandler } from "../../../../shared/http.js";
import { stripeClient } from "../../../providers/stripe/client.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";
import { getStripeAppEnvAsync, env } from "../../../../shared/env.js";
import { getRecipeBySlug } from "../../../../recipes/repo.js";
import { createPaymentOrder, updatePaymentOrderInternal } from "../../../repo.js";
import type { CartItem } from "../../../../../types/cart.js";

interface CheckoutSessionRequest {
  tenantId: string;
  recipeSlug: string;
  userId: string;
}

export default withApiHandler<void>(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { tenantId, recipeSlug, userId } = req.body as CheckoutSessionRequest;

  if (!tenantId || !recipeSlug || !userId) {
    res.status(400).json({ error: "Missing required parameters (tenantId, recipeSlug, userId)" });
    return;
  }

  await getStripeAppEnvAsync(tenantId);

  const recipe = await getRecipeBySlug(tenantId, recipeSlug);
  if (!recipe || recipe.accessTier !== "paid" || !recipe.priceBRL) {
    res.status(400).json({ error: "Recipe invalid or free tier." });
    return;
  }

  const { data: storedAccount } = await supabaseAdmin
    .from("stripe_connect_accounts")
    .select("stripe_account_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!storedAccount?.stripe_account_id) {
    res.status(400).json({ error: "Tenant does not have an active Stripe integration." });
    return;
  }

  const orderId = crypto.randomUUID();
  const amountCents = Math.round(recipe.priceBRL * 100);
  
  const order = await createPaymentOrder(tenantId, {
    userId,
    recipeIds: [recipe.id],
    amount: amountCents,
    currency: "BRL",
    status: "pending",
    provider: "stripe",
    externalReference: orderId,
    idempotencyKey: orderId,
    payerEmail: userId, 
    paymentMethod: "stripe_checkout",
    items: [{ 
      recipeId: recipe.id, 
      title: recipe.title, 
      priceBRL: recipe.priceBRL, 
      slug: recipe.slug, 
      imageUrl: recipe.imageUrl ?? null, 
      quantity: 1 
    } satisfies CartItem],
  });

  const applicationFeeAmount = Math.round(amountCents * 0.1);

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card", "boleto", "pix"],
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: amountCents,
          product_data: {
            name: recipe.title,
            images: recipe.imageUrl ? [recipe.imageUrl] : [],
            metadata: { recipeId: recipe.id }
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${env.APP_BASE_URL}/recipes/${recipe.slug}?payment=success&orderId=${order.id}`,
    cancel_url: `${env.APP_BASE_URL}/recipes/${recipe.slug}?payment=cancel`,
    client_reference_id: order.id,
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: storedAccount.stripe_account_id,
      },
    },
    metadata: {
      tenantId,
      userId,
      recipeId: recipe.id,
      orderId: order.id,
    }
  });

  await updatePaymentOrderInternal(tenantId, order.id, {
    provider_payment_id: session.id
  });

  res.status(200).json({ 
    checkoutUrl: session.url, 
    sessionId: session.id, 
    orderId: order.id 
  });
});

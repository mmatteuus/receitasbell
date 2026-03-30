import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripeClient } from "../../../providers/stripe/client.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";
import { getStripeAppEnvAsync, env } from "../../../../shared/env.js";
import { getRecipeBySlug } from "../../../../recipes/repo.js";
import { createPaymentOrder } from "../../../repo.js";
import type { CartItem } from "../../../../../types/cart.js";

function getTenantId(req: VercelRequest): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return "";
    return "extract-from-token"; // Simplification
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tenantId = req.body?.tenantId || getTenantId(req);
    const recipeSlug = req.body?.recipeSlug;
    const userId = req.body?.userId;

    if (!tenantId || !recipeSlug || !userId) {
      return res.status(400).json({ error: "Missing required parameters (tenantId, recipeSlug, userId)" });
    }

    await getStripeAppEnvAsync(tenantId);

    const recipe = await getRecipeBySlug(tenantId, recipeSlug);
    if (!recipe || recipe.accessTier !== "paid" || !recipe.priceBRL) {
      return res.status(400).json({ error: "Recipe invalid or free tier." });
    }

    const { data: storedAccount } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!storedAccount?.stripe_account_id) {
       return res.status(400).json({ error: "Tenant does not have an active Stripe integration." });
    }

    // Creating internal payment reference
    const orderId = crypto.randomUUID();
    const order = await createPaymentOrder(tenantId, {
      userId,
      recipeIds: [recipe.id],
      amount: Math.round(recipe.priceBRL * 100),
      currency: "BRL",
      status: "pending",
      provider: "stripe",
      externalReference: orderId,
      idempotencyKey: orderId,
      payerEmail: userId,
      paymentMethod: "stripe_checkout",
      items: [{ recipeId: recipe.id, title: recipe.title, priceBRL: recipe.priceBRL, slug: recipe.slug, imageUrl: recipe.imageUrl ?? null, quantity: 1 } satisfies CartItem],
    });

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card", "boleto", "pix"], // Or custom combinations
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: Math.round(recipe.priceBRL * 100),
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
      success_url: `${env.APP_BASE_URL}/recipes/${recipe.slug}?payment=success`,
      cancel_url: `${env.APP_BASE_URL}/recipes/${recipe.slug}?payment=cancel`,
      client_reference_id: order.id,
      payment_intent_data: {
        application_fee_amount: Math.round((recipe.priceBRL * 0.1) * 100), // example 10% fee
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

    // Update internal order with provider ID via custom repo update...
    // (Simulate an update here if the repo has an update method or do it directly)
    await supabaseAdmin
        .from('payment_orders')
        .update({ provider_payment_id: session.id })
        .eq('id', order.id);

    return res.status(200).json({ checkoutUrl: session.url, sessionId: session.id, orderId: order.id });
  } catch (error: any) {
    console.error("Error creating stripe checkout session:", error);
    return res.status(500).json({ error: error.message });
  }
}

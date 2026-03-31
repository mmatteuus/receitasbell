import { withApiHandler } from "../../../../shared/http.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripeClient } from "../../../providers/stripe/client.js";
import type Stripe from "stripe";
import { env } from "../../../../shared/env.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";
import { updatePaymentOrderStatus, getPaymentOrderById } from "../../../repo.js";

async function buffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withApiHandler(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const signature = req.headers["stripe-signature"] as string;
  const rawBody = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Webhook Signature Error: ${errorMessage}`);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;
    const tenantId = session.metadata?.tenantId;

    if (!orderId || !tenantId) {
      console.warn("[Stripe Webhook] Missing orderId or tenantId in session", session.id);
      res.json({ received: true });
      return;
    }

    const order = await getPaymentOrderById(tenantId, orderId);
    
    if (!order) {
      console.error("[Stripe Webhook] Order not found:", orderId);
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.status === 'approved') {
      res.json({ received: true, note: "Already approved" });
      return;
    }

    await updatePaymentOrderStatus(tenantId, orderId, 'approved', (session.payment_intent as string) || session.id);

    if (order.recipeIds && order.recipeIds.length > 0) {
      const entitlements = order.recipeIds.map(recipeId => ({
        tenant_id: tenantId,
        user_id: order.userId || order.payerEmail,
        recipe_id: recipeId,
        amount_paid: Number((order.amount / 100).toFixed(2)),
        provider: 'stripe',
        provider_payment_id: (session.payment_intent as string) || session.id,
        payment_order_id: order.id
      }));

      const { error: entError } = await supabaseAdmin
        .from('recipe_purchases')
        .upsert(entitlements, { onConflict: 'user_id,recipe_id' });

      if (entError) {
        console.error("[Stripe Webhook] Error creating entitlements:", entError);
      }
    }
  }

  res.json({ received: true });
});

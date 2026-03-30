import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripeClient } from "../../../providers/stripe/client.js";
import { env } from "../../../../shared/env.js";
import { supabaseAdmin } from "../../../../integrations/supabase/client.js";


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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["stripe-signature"] as string;

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const orderId = session.client_reference_id;
      const metadata = session.metadata;

      if (!orderId || !metadata?.tenantId) {
         console.warn("Ignoring session missing orderId or tenantId.");
         return res.json({ received: true });
      }

      // Update Order Status
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'approved' })
        .eq('id', orderId);

      // Create Entitlement
      const { data: order } = await supabaseAdmin
        .from('payment_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order && order.user_id && order.recipe_id) {
         await supabaseAdmin
            .from('recipe_purchases')
            .upsert({
               tenant_id: order.tenant_id,
               user_id: order.user_id,
               recipe_id: order.recipe_id,
               amount_paid: order.amount_brl,
               provider: 'stripe',
               provider_payment_id: session.id,
            });
      }
    } 

    return res.json({ received: true });
  } catch (e: any) {
    console.error("Webhook processing error:", e);
    // Usually Stripe wants 200 anyway unless we want a retry. Let's return 500 for retry.
    return res.status(500).json({ error: e.message });
  }
}

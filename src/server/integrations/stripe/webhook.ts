// src/server/integrations/stripe/webhook.ts
import { env } from "../../shared/env.js";
import { verifyStripeWebhookSignature } from "./client.js";
import { getTenantStripeConnection } from "./connections.js";
import { logAuditEvent } from "../../audit/repo.js";
import { parsePaymentExternalReference } from "../../payments/externalReference.js";
import { supabaseAdmin } from "../supabase/client.js";
import type Stripe from "stripe";

export function mapStripePaymentStatus(session: Stripe.Checkout.Session): string {
  switch (session.payment_status) {
    case "paid": return "approved";
    case "unpaid": return session.status === "expired" ? "cancelled" : "pending";
    case "no_payment_required": return "approved";
    default: return "pending";
  }
}

export function parseStripeWebhookSignature(rawBody: Buffer | string, signatureHeader: string): Stripe.Event {
  const secret = env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET nao configurado.");
  return verifyStripeWebhookSignature(rawBody, signatureHeader, secret);
}

export async function processStripeWebhookEvent(event: Stripe.Event): Promise<{
  processed: boolean;
  paymentOrderId?: string | null;
  tenantId?: string | null;
  status?: string | null;
  reason?: string;
}> {
  const allowedTypes = [
    "checkout.session.completed",
    "checkout.session.expired",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
  ];
  if (!allowedTypes.includes(event.type)) return { processed: true, reason: "event_type_ignored" };

  const session = event.data.object as Stripe.Checkout.Session;
  const clientReferenceId = session.client_reference_id;
  const stripeAccountId = event.account;
  if (!clientReferenceId) return { processed: true, reason: "no_client_reference_id" };

  const parsed = parsePaymentExternalReference(clientReferenceId);
  if (!parsed) return { processed: true, reason: "invalid_client_reference_id" };

  const { tenantId, paymentOrderId } = parsed;

  if (stripeAccountId) {
    const connection = await getTenantStripeConnection(tenantId);
    if (connection && connection.stripeAccountId !== stripeAccountId) {
      return { processed: false, reason: "stripe_account_mismatch", tenantId, paymentOrderId };
    }
  }

  const internalStatus = mapStripePaymentStatus(session);
  const providerPaymentId = (session.payment_intent as string | null) ?? session.id;
  // Atualizar status diretamente na tabela de pedidos
  await supabaseAdmin
    .from("payment_orders")
    .update({
      status: internalStatus,
      provider_payment_id: providerPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentOrderId);
  if (internalStatus === "approved") {
    const { data: order } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .eq("id", paymentOrderId)
      .single();
    if (order?.user_id && order?.recipe_id) {
      await supabaseAdmin
        .from("recipe_purchases")
        .upsert({
          tenant_id: order.tenant_id,
          user_id: order.user_id,
          recipe_id: order.recipe_id,
          amount_paid: order.amount_brl,
          provider: "stripe",
          provider_payment_id: providerPaymentId,
        });
    }
  }
  await logAuditEvent({
    tenantId,
    actorType: "system",
    actorId: "stripe_webhook",
    action: "stripe.webhook.payment_synced",
    resourceType: "payment_order",
    resourceId: paymentOrderId,
    payload: { stripeEventType: event.type, stripeSessionId: session.id, stripeAccountId: stripeAccountId ?? null, internalStatus },
  });
  return { processed: true, paymentOrderId, tenantId, status: internalStatus };
}

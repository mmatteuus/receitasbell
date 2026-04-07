import { buffer, withApiHandler } from '../../../../shared/http.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripeClient } from '../../../providers/stripe/client.js';
import type Stripe from 'stripe';
import { env } from '../../../../shared/env.js';
import { supabaseAdmin } from '../../../../integrations/supabase/client.js';
import { updatePaymentOrderStatus, getPaymentOrderById } from '../../../repo.js';
import { upsertConnectAccount } from '../../../repo/accounts.js';
import type { Logger } from '../../../../shared/logger.js';

async function isEventProcessed(
  tenantId: string,
  eventId: string,
  logger: Logger
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('payment_events')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('event_type', 'stripe_event_id')
    .eq('payload', JSON.stringify({ stripeEventId: eventId }))
    .maybeSingle();

  if (error) {
    logger.warn('stripe.webhook.idempotency_check_failed', error);
    return false;
  }

  return !!data;
}

async function markEventProcessed(
  tenantId: string,
  event: Stripe.Event,
  logger: Logger
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payment_events')
    .insert({
      tenant_id: tenantId,
      event_type: 'stripe_event_id',
      payload: { stripeEventId: event.id, stripeEventType: event.type },
      created_at: new Date().toISOString(),
    });

  if (error) {
    logger.warn('stripe.webhook.idempotency_store_failed', error);
  }
}

async function grantEntitlementsFromOrder(
  tenantId: string,
  session: Stripe.Checkout.Session,
  order: Awaited<ReturnType<typeof getPaymentOrderById>>,
  logger: Logger
) {
  if (!order?.recipeIds || order.recipeIds.length === 0) return;
  if (!order.userId) {
    logger.warn('stripe.webhook.entitlements_missing_userid', {
      orderId: order.id,
    });
    return;
  }

  const entitlements = order.recipeIds.map((recipeId) => ({
    tenant_id: tenantId,
    user_id: order.userId,
    recipe_id: recipeId,
    payment_order_id: order.id,
  }));

  const { error: entError } = await supabaseAdmin
    .from('entitlements')
    .upsert(entitlements, { onConflict: 'tenant_id,user_id,recipe_id' });

  if (entError) {
    logger.error('stripe.webhook.entitlements_failed', entError);
    throw entError;
  }

  logger.debug('stripe.webhook.entitlements_granted', {
    count: entitlements.length,
    recipeIds: order.recipeIds,
  });
}

async function processCheckoutSessionEvent(
  session: Stripe.Checkout.Session,
  options: { expectedPaid: boolean; statusIfNotPaid?: 'failed' | 'pending' },
  logger: Logger
) {
  const orderId = session.client_reference_id;
  const tenantId = session.metadata?.tenantId;
  const providerPaymentId = (session.payment_intent as string) || session.id;

  if (!orderId || !tenantId) {
    logger.warn('stripe.webhook.missing_metadata', {
      sessionId: session.id,
      orderId: orderId ?? null,
      tenantId: tenantId ?? null,
    });
    return;
  }

  const order = await getPaymentOrderById(tenantId, orderId);
  if (!order) {
    logger.warn('stripe.webhook.order_not_found', {
      orderId,
      tenantId,
      sessionId: session.id,
    });
    return;
  }

  const scopedLogger = logger.withContext({
    tenantId,
    paymentOrderId: orderId,
    providerPaymentId,
  });

  if (!options.expectedPaid) {
    if (options.statusIfNotPaid && order.status !== options.statusIfNotPaid) {
      await updatePaymentOrderStatus(tenantId, orderId, options.statusIfNotPaid);
      scopedLogger.debug('stripe.webhook.status_updated', {
        status: options.statusIfNotPaid,
      });
    }
    return;
  }

  if (session.payment_status !== 'paid') {
    if (options.statusIfNotPaid && order.status !== options.statusIfNotPaid) {
      await updatePaymentOrderStatus(tenantId, orderId, options.statusIfNotPaid);
      scopedLogger.debug('stripe.webhook.status_updated', {
        status: options.statusIfNotPaid,
      });
    }
    return;
  }

  if (order.status !== 'approved') {
    await updatePaymentOrderStatus(tenantId, orderId, 'approved', providerPaymentId);
    scopedLogger.debug('stripe.webhook.status_updated', {
      status: 'approved',
    });
  }

  await grantEntitlementsFromOrder(tenantId, session, order, scopedLogger);
}

export default withApiHandler(async (req: VercelRequest, res: VercelResponse, { logger }) => {
  const baseLogger = logger.withContext({ provider: 'stripe' });

  if (req.method !== 'POST') {
    baseLogger.warn('stripe.webhook.method_not_allowed', { method: req.method });
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    baseLogger.error('stripe.webhook.secret_missing', new Error('STRIPE_WEBHOOK_SECRET missing'));
    res.status(500).send('Webhook Error: Missing Stripe webhook secret');
    return;
  }

  const signatureHeader = req.headers['stripe-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    baseLogger.warn('stripe.webhook.signature_missing', { reason: 'missing_signature' });
    res.status(400).send('Webhook Error: Missing Stripe signature');
    return;
  }

  let rawBody: Buffer;
  try {
    rawBody = await buffer(req);
  } catch (error: unknown) {
    baseLogger.error('stripe.webhook.body_read_failed', error);
    res.status(400).send('Webhook Error: Invalid payload');
    return;
  }

  if (!rawBody.length) {
    baseLogger.warn('stripe.webhook.empty_body', { reason: 'empty_payload' });
    res.status(400).send('Webhook Error: Empty payload');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    baseLogger.error('stripe.webhook.signature_invalid', err);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  const eventLogger = baseLogger.withContext({
    providerEventId: event.id,
    action: `stripe.webhook.${event.type}`,
    eventType: event.type,
  });
  eventLogger.debug('stripe.webhook.received', {
    account: event.account ?? null,
    livemode: event.livemode,
  });

  // Validar idempotência: mesmo evento não pode ser processado 2x
  const tenantIdFromSession = ((event.data.object as unknown as Record<string, unknown>)?.metadata as Record<string, unknown>)?.tenantId as string | undefined;
  if (tenantIdFromSession && await isEventProcessed(tenantIdFromSession, event.id, eventLogger)) {
    eventLogger.debug('stripe.webhook.event_already_processed', {
      reason: 'duplicate_event',
    });
    res.json({ received: true, duplicate: true });
    return;
  }

  // 1. Evento de Checkout (venda de receitas)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await processCheckoutSessionEvent(
        session,
        { expectedPaid: true, statusIfNotPaid: 'pending' },
        eventLogger
      );
      if (tenantIdFromSession) await markEventProcessed(tenantIdFromSession, event, eventLogger);
    } catch (error: unknown) {
      eventLogger.error('stripe.webhook.checkout_failed', error);
      throw error;
    }
  }

  if (event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await processCheckoutSessionEvent(session, { expectedPaid: true }, eventLogger);
      if (tenantIdFromSession) await markEventProcessed(tenantIdFromSession, event, eventLogger);
    } catch (error: unknown) {
      eventLogger.error('stripe.webhook.checkout_failed', error);
      throw error;
    }
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await processCheckoutSessionEvent(
        session,
        { expectedPaid: false, statusIfNotPaid: 'failed' },
        eventLogger
      );
      if (tenantIdFromSession) await markEventProcessed(tenantIdFromSession, event, eventLogger);
    } catch (error: unknown) {
      eventLogger.error('stripe.webhook.checkout_failed', error);
      throw error;
    }
  }

  // 2. Evento de Connect (onboarding de vendedores)
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const tenantId = account.metadata?.tenantId;

    if (tenantId) {
      try {
        await upsertConnectAccount({
          tenantId,
          stripeAccountId: account.id,
          status: account.details_submitted ? 'ready' : 'pending',
          detailsSubmitted: account.details_submitted ?? false,
          chargesEnabled: account.charges_enabled ?? false,
          payoutsEnabled: account.payouts_enabled ?? false,
          defaultCurrency: account.default_currency ?? 'BRL',
          requirements: {
            currentlyDue: account.requirements?.currently_due || [],
            eventuallyDue: account.requirements?.eventually_due || [],
          },
          disabledReason: account.requirements?.disabled_reason || null,
        });
      } catch (error: unknown) {
        eventLogger.error('stripe.webhook.connect_sync_failed', error);
        throw error;
      }
    } else {
      eventLogger.warn('stripe.webhook.connect_missing_tenant', {
        stripeAccountId: account.id,
      });
    }
  }

  res.json({ received: true });
});
